import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.klicktipp.com";

type Fields = { username: string; password: string };
type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// KlickTipp's Management API signs in with POST /account/login, which returns { sessid, session_name };
// every later request carries `Cookie: <session_name>=<sessid>`. Each call signs in, does its work and
// signs out, so sessions never outlive the call.
async function withSession<T>(
  fields: Fields,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  work: (call: (path: string, init?: RequestInit) => Promise<Response>) => Promise<T>,
): Promise<T> {
  const login = await fetcher(`${base}/account/login`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: fields.username, password: fields.password }),
  });
  if (!login.ok) throw new Error(`KlickTipp sign-in failed with HTTP ${login.status}.`);
  const session = await decodeJson(login, object({ sessid: string(), session_name: string() }));
  const cookie = `${session.session_name}=${session.sessid}`;
  try {
    return await work((path, init) =>
      fetcher(`${base}${path}`, {
        ...init,
        signal,
        headers: { Accept: "application/json", Cookie: cookie, ...(init?.headers as Record<string, string> | undefined) },
      }),
    );
  } finally {
    // Deliberately unsignalled so a cancelled call still closes its session.
    await fetcher(`${base}/account/logout`, { method: "POST", headers: { Cookie: cookie } }).catch(() => undefined);
  }
}

async function send(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, path: string, init: RequestInit = {}) {
  return withSession(fields, fetcher, signal, async (call) => {
    const response = await call(path, {
      ...init,
      headers: init.body === undefined ? {} : { "Content-Type": "application/json" },
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  });
}

const klicktipp = defineProvider({
  name: "KlickTipp",
  hosts: ["api.klicktipp.com"],
  auth: {
    // OAuth client credentials cannot be created in KlickTipp's UI, and the Developer Key + Customer Key
    // flow needs a partner Enterprise account, so the connection uses an API user's name and password.
    password: secrets({
      label: "API user name and password",
      fields: object({
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields;
    await withSession(fields, fetch, signal, async () => undefined);
    return { accountInfo: { externalId: fields.username, displayName: fields.username } };
  },
});

const id = (value: unknown, name: string): string => {
  const text = String(value);
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error(`${name} must be an id without special characters.`);
  return text;
};

function qs(input: Params, keys: string[]): string {
  const url = new URLSearchParams();
  for (const key of keys) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") url.set(key, String(value));
  }
  const text = url.toString();
  return text === "" ? "" : `?${text}`;
}

const body = (value: Params) => JSON.stringify(value);
const fieldValues = record(string());

export default defineApp(
  { user: { accounts: { klicktipp: klicktipp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.klicktipp ?? [],
        (account) => {
          const f = account.fields;
          const call = (path: string, init?: RequestInit) => send(f, fetch, signal, path, init);
          return withApprovals(
            router({
              contacts: router(
                {
                  list: query(
                    {
                      description:
                        "List contact IDs. status filters by subscribed, pending or unsubscribed (comma separated, default subscribed); bounceStatus by hardbounce, softbounce, spambounce or nobounce. With limit (max 500) the result is paginated: pass nextCursor back as cursor. Without limit all IDs are returned.",
                      input: object({
                        status: string().optional(),
                        bounceStatus: string().optional(),
                        limit: number().optional(),
                        cursor: string().optional(),
                      }),
                    },
                    async (_ctx, input: Params) => call(`/subscriber${qs(input, ["status", "bounceStatus", "limit", "cursor"])}`),
                  ),
                  changed: query(
                    {
                      description: "List IDs of contacts changed since a Unix timestamp (from), with cursor pagination (limit, cursor).",
                      input: object({ from: number(), cursor: string().optional(), limit: number().optional() }),
                    },
                    async (_ctx, input: Params) => call(`/subscriber/changed${qs(input, ["from", "cursor", "limit"])}`),
                  ),
                  get: query(
                    { description: "Get the complete data of a contact by ID.", input: object({ contactId: string() }) },
                    async (_ctx, input: Params) => call(`/subscriber/${id(input.contactId, "contactId")}`),
                  ),
                  getMany: query(
                    {
                      description: "Get the complete data of up to 200 contacts. contactIds is a comma separated list of IDs.",
                      input: object({ contactIds: string() }),
                    },
                    async (_ctx, input: Params) => {
                      const ids = String(input.contactIds).split(",").map((value) => id(value.trim(), "contactIds"));
                      return call(`/subscriber/bulk/${ids.join(",")}`);
                    },
                  ),
                  search: query(
                    { description: "Find the contact ID for an email address.", input: object({ email: string() }) },
                    async (_ctx, input: Params) => call("/subscriber/search", { method: "POST", body: body({ email: input.email }) }),
                  ),
                  taggedWith: query(
                    {
                      description:
                        "List contact IDs and tag-assignment timestamps for a tag (manual or smart). status and bounceStatus are lists of values such as subscribed and nobounce.",
                      input: object({ tagId: number(), status: array(string()), bounceStatus: array(string()) }),
                    },
                    async (_ctx, input: Params) =>
                      call("/subscriber/tagged", {
                        method: "POST",
                        body: body({ tagid: input.tagId, status: input.status, bounceStatus: input.bounceStatus }),
                      }),
                  ),
                  upsert: mutation(
                    {
                      description:
                        "Add a contact, or update the one with the same email. Optional listId starts that opt-in process, tagId assigns a tag, and fields maps field keys (for example fieldFirstName) to string values.",
                      input: object({
                        email: string().optional(),
                        smsnumber: string().optional(),
                        listId: number().optional(),
                        tagId: number().optional(),
                        fields: fieldValues.optional(),
                      }),
                    },
                    async (_ctx, input: Params) =>
                      call("/subscriber", {
                        method: "POST",
                        body: body({ email: input.email, smsnumber: input.smsnumber, listid: input.listId, tagid: input.tagId, fields: input.fields }),
                      }),
                  ),
                  update: mutation(
                    {
                      description: "Update a contact by ID: change its email (newemail), SMS number (newsmsnumber) or field values.",
                      input: object({ contactId: string(), newemail: string().optional(), newsmsnumber: string().optional(), fields: fieldValues.optional() }),
                    },
                    async (_ctx, input: Params) =>
                      call(`/subscriber/${id(input.contactId, "contactId")}`, {
                        method: "PUT",
                        body: body({ newemail: input.newemail, newsmsnumber: input.newsmsnumber, fields: input.fields }),
                      }),
                  ),
                  delete: mutation(
                    { description: "Delete a contact by ID.", input: object({ contactId: string() }) },
                    async (_ctx, input: Params) => call(`/subscriber/${id(input.contactId, "contactId")}`, { method: "DELETE" }),
                  ),
                  unsubscribe: mutation(
                    { description: "Unsubscribe a contact by email, preventing further communication.", input: object({ email: string() }) },
                    async (_ctx, input: Params) => call("/subscriber/unsubscribe", { method: "POST", body: body({ email: input.email }) }),
                  ),
                  tag: mutation(
                    { description: "Add one or more tags to a contact.", input: object({ email: string(), tagIds: array(number()) }) },
                    async (_ctx, input: Params) => call("/subscriber/tag", { method: "POST", body: body({ email: input.email, tagids: input.tagIds }) }),
                  ),
                  untag: mutation(
                    { description: "Remove a tag from a contact.", input: object({ email: string(), tagId: number() }) },
                    async (_ctx, input: Params) => call("/subscriber/untag", { method: "POST", body: body({ email: input.email, tagid: input.tagId }) }),
                  ),
                },
                { title: "Contacts", description: "Contacts (subscribers): search, read, add, update, tag, unsubscribe and delete." },
              ),
              tags: router(
                {
                  list: query({ description: "List the IDs and names of all manual tags (smart tags are not listed).", input: object({}) }, async () => call("/tag")),
                  get: query(
                    { description: "Get a tag's name and description by ID (manual or smart tag).", input: object({ tagId: string() }) },
                    async (_ctx, input: Params) => call(`/tag/${id(input.tagId, "tagId")}`),
                  ),
                  create: mutation(
                    { description: "Create a manual tag.", input: object({ name: string(), text: string().optional() }) },
                    async (_ctx, input: Params) => call("/tag", { method: "POST", body: body({ name: input.name, text: input.text }) }),
                  ),
                  update: mutation(
                    { description: "Update a manual tag's name or description.", input: object({ tagId: string(), name: string().optional(), text: string().optional() }) },
                    async (_ctx, input: Params) =>
                      call(`/tag/${id(input.tagId, "tagId")}`, { method: "PUT", body: body({ name: input.name, text: input.text }) }),
                  ),
                  delete: mutation(
                    { description: "Delete a manual tag and remove it from all contacts.", input: object({ tagId: string() }) },
                    async (_ctx, input: Params) => call(`/tag/${id(input.tagId, "tagId")}`, { method: "DELETE" }),
                  ),
                },
                { title: "Tags", description: "Manual tags used to segment contacts." },
              ),
              fields: router(
                {
                  list: query(
                    {
                      description: "List data fields. Keys are prefixed with field (field12345, fieldFirstName). detail=true adds each field's type.",
                      input: object({ detail: boolean().optional() }),
                    },
                    async (_ctx, input: Params) => call(`/field${qs(input, ["detail"])}`),
                  ),
                  get: query(
                    {
                      description: "Get a data field by its unprefixed ID (field12345 is 12345, fieldFirstName is FirstName). detail=true adds the type.",
                      input: object({ fieldId: string(), detail: boolean().optional() }),
                    },
                    async (_ctx, input: Params) => call(`/field/${id(input.fieldId, "fieldId")}${qs(input, ["detail"])}`),
                  ),
                },
                { title: "Data fields", description: "Custom and standard contact data fields." },
              ),
              optIns: router(
                {
                  list: query(
                    {
                      description: "List opt-in processes (ID to name). detail=true adds the pending and thank-you URLs.",
                      input: object({ detail: boolean().optional() }),
                    },
                    async (_ctx, input: Params) => call(`/list${qs(input, ["detail"])}`),
                  ),
                  get: query(
                    { description: "Get the complete data of an opt-in process.", input: object({ listId: string() }) },
                    async (_ctx, input: Params) => call(`/list/${id(input.listId, "listId")}`),
                  ),
                  redirectUrl: query(
                    {
                      description: "Find the redirect URL of an opt-in process for a contact's email.",
                      input: object({ listId: string(), email: string() }),
                    },
                    async (_ctx, input: Params) => call("/list/redirect", { method: "POST", body: body({ listid: input.listId, email: input.email }) }),
                  ),
                },
                { title: "Opt-in processes", description: "Double opt-in processes that confirm new contacts." },
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "KlickTipp",
        description: "KlickTipp email marketing: contacts, tags, custom data fields and opt-in processes through the Management API.",
        instructions:
          "Custom field keys are prefixed with field (fieldFirstName, field12345); use fields.list to find them. Contact writes are keyed by email; reads and updates by contact ID, found with contacts.search. Tag and opt-in process IDs come from tags.list and optIns.list.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

// Every Kustomer organization has its own API host: https://<orgname>.api.kustomerapp.com.
// Organizations on the second pod use https://<orgname>.api.prod2.kustomerapp.com, so a full host is accepted too.
function apiOrigin(raw: string): string {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (/^[a-z0-9][a-z0-9_-]*$/.test(value)) return `https://${value}.api.kustomerapp.com`;
  if (/^[a-z0-9][a-z0-9_-]*\.api(\.[a-z0-9]+)?\.kustomerapp\.com$/.test(value)) return `https://${value}`;
  throw new Error("Enter your Kustomer organization name (the <orgname> in <orgname>.api.kustomerapp.com).");
}

const kustomer = defineProvider({
  name: "Kustomer",
  hosts: ["*.kustomerapp.com"],
  auth: {
    // Admins create keys at Settings > Security > API Keys; the key's role limits what it can do.
    apiKey: secrets({
      label: "API key",
      fields: object({
        orgName: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = apiOrigin(account.fields.orgName);
    const response = await fetch(`${origin}/v1/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: new URL(origin).host, displayName: new URL(origin).host } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(origin: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

function pathFor(path: string, ids: readonly string[], input: Params): string {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

// Tools take path ids, `query` parameters and (for writes) a JSON `body`.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }) },
    async (_ctx, input: Params) => call("GET", pathFor(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(
  call: Call,
  method: Exclude<Method, "GET">,
  path: string,
  description: string,
  ids: readonly string[] = [],
  hasBody: boolean | "optional" = true,
) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(hasBody === "optional" ? { body: optionalPayload } : hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, pathFor(path, ids, input), (input.query as Params | undefined) ?? {}, hasBody ? (input.body as Params | undefined) : undefined),
  );
}

// Search endpoints are POST but read-only, so they are queries and need no approval.
function search(call: Call, path: string, description: string) {
  return query(
    { description, input: object({ query: filters, body: payload }) },
    async (_ctx, input: Params) => call("POST", path, (input.query as Params | undefined) ?? {}, input.body as Params),
  );
}

const listNote = "Pages: pass page and pageSize in query; the response has links.next.";

function build(call: Call) {
  return router({
    me: query({ description: "The user that owns the API key.", input: object({}) }, async () => call("GET", "/v1/users/me")),
    customers: router(
      {
        list: read(call, "/v1/customers", `List customers. ${listNote}`),
        get: read(call, "/v1/customers/{id}", "Retrieve a customer by id.", ["id"]),
        getByEmail: read(call, "/v1/customers/email={email}", "Retrieve a customer by email address.", ["email"]),
        getByExternalId: read(call, "/v1/customers/externalId={externalId}", "Retrieve a customer by external id.", ["externalId"]),
        search: search(call, "/v1/customers/search", "Search customers. body: { and: [...] / or: [...] } query conditions, plus sort and fields; see the Kustomer search reference."),
        create: write(call, "POST", "/v1/customers", "Create a customer. body: name, emails [{email,type}], phones, externalId, custom attributes suffixed Str/Num/Bool/At/Txt/Url."),
        update: write(call, "PATCH", "/v1/customers/{id}", "Update a customer. body holds the fields to change.", ["id"]),
        delete: write(call, "DELETE", "/v1/customers/{id}", "Delete a customer.", ["id"], false),
        conversations: read(call, "/v1/customers/{id}/conversations", `List a customer's conversations. ${listNote}`, ["id"]),
        messages: read(call, "/v1/customers/{id}/messages", `List a customer's messages. ${listNote}`, ["id"]),
        merge: write(call, "POST", "/v1/customers/{id}/merge", "Merge another customer into this one. body: { targetCustomerId or sourceCustomerId } per the Kustomer reference.", ["id"]),
      },
      { title: "Customers", description: "Customer records and their timelines." },
    ),
    conversations: router(
      {
        list: read(call, "/v1/conversations", `List conversations. ${listNote}`),
        get: read(call, "/v1/conversations/{id}", "Retrieve a conversation by id.", ["id"]),
        search: search(call, "/v1/conversations/search", "Search conversations. body: query conditions, sort and fields."),
        create: write(call, "POST", "/v1/conversations", "Create a conversation. body: customer (id), name, status, direction, channel, assignedUsers, assignedTeams, tags."),
        update: write(call, "PATCH", "/v1/conversations/{id}", "Update a conversation (status, assignment, tags, priority, custom attributes). body holds the fields to change.", ["id"]),
        delete: write(call, "DELETE", "/v1/conversations/{id}", "Delete a conversation.", ["id"], false),
        messages: read(call, "/v1/conversations/{id}/messages", `List messages in a conversation. ${listNote}`, ["id"]),
        createMessage: write(call, "POST", "/v1/conversations/{id}/messages", "Add a message to a conversation. body: app, channel, direction, preview, subject, body, attributes.", ["id"]),
        notes: read(call, "/v1/conversations/{id}/notes", "List internal notes on a conversation.", ["id"]),
        createNote: write(call, "POST", "/v1/conversations/{id}/notes", "Add an internal note to a conversation. body: body (text), and optional attributes.", ["id"]),
        forward: write(call, "POST", "/v1/conversations/{id}/forward", "Forward a conversation. body per the Kustomer reference.", ["id"]),
        merge: write(call, "POST", "/v1/conversations/{id}/merge", "Merge another conversation into this one. body per the Kustomer reference.", ["id"]),
      },
      { title: "Conversations", description: "Conversations, their messages and internal notes." },
    ),
    messages: router(
      {
        list: read(call, "/v1/messages", `List messages. ${listNote}`),
        get: read(call, "/v1/messages/{id}", "Retrieve a message by id.", ["id"]),
        search: search(call, "/v1/messages/search", "Search messages. body: query conditions, sort and fields."),
        update: write(call, "PATCH", "/v1/messages/{id}", "Update a message. body holds the fields to change.", ["id"]),
      },
      { title: "Messages", description: "Messages across all conversations." },
    ),
    companies: router(
      {
        list: read(call, "/v1/companies", `List companies. ${listNote}`),
        get: read(call, "/v1/companies/{id}", "Retrieve a company by id.", ["id"]),
        search: search(call, "/v1/companies/search", "Search companies. body: query conditions, sort and fields."),
        create: write(call, "POST", "/v1/companies", "Create a company. body: name, domains, externalId, custom attributes."),
        update: write(call, "PATCH", "/v1/companies/{id}", "Update a company. body holds the fields to change.", ["id"]),
        delete: write(call, "DELETE", "/v1/companies/{id}", "Delete a company.", ["id"], false),
      },
      { title: "Companies", description: "Company records customers belong to." },
    ),
    users: router(
      {
        list: read(call, "/v1/users", `List users (agents). ${listNote}`),
        get: read(call, "/v1/users/{id}", "Retrieve a user by id.", ["id"]),
      },
      { title: "Users", description: "Agents in the organization." },
    ),
    teams: router(
      {
        list: read(call, "/v1/teams", "List teams."),
        get: read(call, "/v1/teams/{id}", "Retrieve a team by id.", ["id"]),
      },
      { title: "Teams", description: "Agent teams." },
    ),
    queues: router(
      {
        list: read(call, "/v1/queues", "List queues."),
        get: read(call, "/v1/queues/{id}", "Retrieve a queue by id.", ["id"]),
      },
      { title: "Queues", description: "Conversation queues." },
    ),
    tags: router(
      {
        list: read(call, "/v1/tags", "List tags."),
        get: read(call, "/v1/tags/{id}", "Retrieve a tag by id.", ["id"]),
        create: write(call, "POST", "/v1/tags", "Create a tag. body: name, color."),
      },
      { title: "Tags", description: "Tags applied to conversations." },
    ),
    brands: router(
      {
        list: read(call, "/v1/brands", "List brands."),
        get: read(call, "/v1/brands/{id}", "Retrieve a brand by id.", ["id"]),
      },
      { title: "Brands", description: "Brands the organization supports." },
    ),
    shortcuts: router(
      {
        list: read(call, "/v1/shortcuts", "List shortcuts (saved replies)."),
        get: read(call, "/v1/shortcuts/{id}", "Retrieve a shortcut by id.", ["id"]),
      },
      { title: "Shortcuts", description: "Saved reply templates." },
    ),
    workflows: router(
      {
        list: read(call, "/v1/workflows", "List workflows."),
        get: read(call, "/v1/workflows/{id}", "Retrieve a workflow by id.", ["id"]),
      },
      { title: "Workflows", description: "Automation workflows." },
    ),
    klasses: router(
      {
        list: read(call, "/v1/klasses", "List custom object types (klasses)."),
        get: read(call, "/v1/klasses/{name}", "Retrieve a custom object type by name.", ["name"]),
        listObjects: read(call, "/v1/klasses/{name}/kobjects", `List custom objects (KObjects) of a type. ${listNote}`, ["name"]),
        getObject: read(call, "/v1/klasses/{name}/{id}", "Retrieve one custom object by klass name and id.", ["name", "id"]),
        createObject: write(call, "POST", "/v1/klasses/{name}", "Create a custom object of a type. body: attributes and customer relationship.", ["name"]),
        updateObject: write(call, "PATCH", "/v1/klasses/{name}/{id}", "Update a custom object. body holds the fields to change.", ["name", "id"]),
        deleteObject: write(call, "DELETE", "/v1/klasses/{name}/{id}", "Delete a custom object.", ["name", "id"], false),
      },
      { title: "Custom objects", description: "KObjects and their types." },
    ),
    audit: router(
      { list: read(call, "/v1/audit-logs", `List audit log entries. ${listNote}`) },
      { title: "Audit logs", description: "Administrative audit trail." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { kustomer: kustomer.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kustomer ?? [],
        (account) =>
          withApprovals(
            build(client(apiOrigin(account.fields.orgName), account.fields.token, fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Kustomer",
        description:
          "Customer service CRM: customers, conversations, messages, internal notes, companies, users, teams, queues, tags, shortcuts, workflows and custom objects.",
        instructions:
          "Results depend on the role of the API key. Pass URL parameters in query and the JSON payload in body. Search tools use POST but only read.",
        icons,
      },
    ),
  }),
);

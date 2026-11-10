import {
  accountRouter,
  array,
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

// EspoCRM is self-hosted (or hosted by the vendor on a customer-specific domain), so the instance
// URL is part of the account. The provider declares no `hosts` (arbitrary origins cannot be
// covered by framework host patterns), so app code holds the raw API key; it is only sent to
// siteOrigin(site).
const espocrm = defineProvider({
  name: "EspoCRM",
  auth: {
    apiKey: secrets({
      label: "API user key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = siteOrigin(account.fields.site);
    const response = await fetch(`${origin}/api/v1/App/user`, {
      signal,
      headers: authHeaders(account.fields.apiKey),
    });
    const { user } = await decodeJson(response, object({ user: object({ id: string() }) }));
    return { accountInfo: { externalId: `${origin}:${user.id}`, displayName: `${new URL(origin).host} (${user.id})` } };
  },
});

// One place that validates the stored site; every use (health and tool routing) goes through it.
function siteOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your EspoCRM URL, for example https://crm.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The EspoCRM site must use https.");
  // EspoCRM can live under a sub-path (https://example.com/crm); keep it.
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function authHeaders(key: string) {
  return { "X-Api-Key": key, Accept: "application/json" };
}

type Params = Record<string, unknown>;

// PHP-style bracket encoding, which is how EspoCRM reads `where` and other nested search params.
function encodeNested(out: URLSearchParams, name: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => encodeNested(out, `${name}[${index}]`, item));
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) encodeNested(out, `${name}[${key}]`, item);
  } else {
    out.append(name, String(value));
  }
}

const listFields = {
  select: array(string()).optional(),
  where: array(record(json())).optional(),
  textFilter: string().optional(),
  primaryFilter: string().optional(),
  boolFilterList: array(string()).optional(),
  orderBy: string().optional(),
  order: string().optional(),
  maxSize: number().optional(),
  offset: number().optional(),
};

const listHelp =
  ' where is a list of conditions like [{"type":"equals","attribute":"status","value":"New"}] (types: equals, notEquals, contains, startsWith, in, notIn, greaterThan, lessThan, between, isNull, isNotNull, and "or"/"and" groups with a nested value list). order is "asc" or "desc". maxSize defaults to 20 (max 200); response is { list, total }.';

function listParams(args: Params): URLSearchParams {
  const out = new URLSearchParams();
  if (Array.isArray(args.select)) out.set("select", (args.select as string[]).join(","));
  for (const name of ["textFilter", "primaryFilter", "orderBy", "order", "maxSize", "offset"]) {
    if (args[name] !== undefined) out.set(name, String(args[name]));
  }
  if (args.where !== undefined) encodeNested(out, "where", args.where);
  if (args.boolFilterList !== undefined) encodeNested(out, "boolFilterList", args.boolFilterList);
  return out;
}

// Common entity types exposed as typed groups. Any other entity (custom ones included) works through `records`.
const entities: [group: string, entity: string, label: string][] = [
  ["accounts", "Account", "account (company)"],
  ["contacts", "Contact", "contact"],
  ["leads", "Lead", "lead"],
  ["opportunities", "Opportunity", "opportunity"],
  ["cases", "Case", "case"],
  ["tasks", "Task", "task"],
  ["meetings", "Meeting", "meeting"],
  ["calls", "Call", "call"],
  ["emails", "Email", "email"],
  ["documents", "Document", "document"],
  ["campaigns", "Campaign", "campaign"],
  ["targetLists", "TargetList", "target list"],
  ["knowledgeBaseArticles", "KnowledgeBaseArticle", "knowledge base article"],
  ["products", "Product", "product"],
  ["quotes", "Quote", "quote"],
  ["users", "User", "user"],
  ["teams", "Team", "team"],
];

const segment = (value: unknown) => encodeURIComponent(String(value));

function build(site: string, key: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = siteOrigin(site);
  const call = async (method: string, path: string, search?: URLSearchParams, body?: unknown, extra: Record<string, string> = {}) => {
    const qs = search?.toString() ?? "";
    const response = await fetcher(`${origin}/api/v1/${path}${qs === "" ? "" : `?${qs}`}`, {
      method,
      signal,
      headers: {
        ...authHeaders(key),
        ...extra,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const entityTools = (entity: (args: Params) => string, withEntity: boolean, label: string) => {
    const et: Record<string, ReturnType<typeof string>> = withEntity ? { entityType: string() } : {};
    return {
      list: query(
        { description: `List ${label} records.${listHelp}`, input: object({ ...et, ...listFields }) },
        async (_ctx, args: Params) => call("GET", segment(entity(args)), listParams(args)),
      ),
      get: query(
        { description: `Get one ${label} record by id with all its attributes.`, input: object({ ...et, id: string() }) },
        async (_ctx, args: Params) => call("GET", `${segment(entity(args))}/${segment(args.id)}`),
      ),
      create: mutation(
        {
          description: `Create a ${label} record. data holds attribute values (for example {"name":"Acme"}); links to other records use <link>Id, for example accountId.`,
          input: object({ ...et, data: record(json()) }),
        },
        async (_ctx, args: Params) => call("POST", segment(entity(args)), undefined, args.data),
      ),
      update: mutation(
        { description: `Update a ${label} record. Only the attributes in data change.`, input: object({ ...et, id: string(), data: record(json()) }) },
        async (_ctx, args: Params) => call("PUT", `${segment(entity(args))}/${segment(args.id)}`, undefined, args.data),
      ),
      delete: mutation(
        { description: `Delete a ${label} record.`, input: object({ ...et, id: string() }) },
        async (_ctx, args: Params) => call("DELETE", `${segment(entity(args))}/${segment(args.id)}`),
      ),
      listRelated: query(
        {
          description: `List records linked to a ${label} record through a relationship link (for example contacts, opportunities, meetings).${listHelp}`,
          input: object({ ...et, id: string(), link: string(), ...listFields }),
        },
        async (_ctx, args: Params) => call("GET", `${segment(entity(args))}/${segment(args.id)}/${segment(args.link)}`, listParams(args)),
      ),
      link: mutation(
        {
          description: `Link existing records to a ${label} record through a relationship link. Pass targetIds (ids of the records to link).`,
          input: object({ ...et, id: string(), link: string(), targetIds: array(string()) }),
        },
        async (_ctx, args: Params) =>
          call("POST", `${segment(entity(args))}/${segment(args.id)}/${segment(args.link)}`, undefined, { ids: args.targetIds }),
      ),
      unlink: mutation(
        {
          description: `Remove the relationship between a ${label} record and other records (the linked records are not deleted).`,
          input: object({ ...et, id: string(), link: string(), targetIds: array(string()) }),
        },
        async (_ctx, args: Params) =>
          call("DELETE", `${segment(entity(args))}/${segment(args.id)}/${segment(args.link)}`, undefined, { ids: args.targetIds }),
      ),
      stream: query(
        { description: `Read the stream (posts, notes, status changes) of a ${label} record.`, input: object({ ...et, id: string(), maxSize: number().optional(), offset: number().optional() }) },
        async (_ctx, args: Params) => {
          const search = new URLSearchParams();
          if (args.maxSize !== undefined) search.set("maxSize", String(args.maxSize));
          if (args.offset !== undefined) search.set("offset", String(args.offset));
          return call("GET", `${segment(entity(args))}/${segment(args.id)}/stream`, search);
        },
      ),
    };
  };

  const typed = Object.fromEntries(
    entities.map(([group, entityType, label]) => [group, router(entityTools(() => entityType, false, label))]),
  );

  return router({
    ...typed,
    records: router(entityTools((args) => String(args.entityType), true, "any entity type")),
    stream: router({
      list: query(
        { description: "Read the API user's own stream.", input: object({ maxSize: number().optional(), offset: number().optional() }) },
        async (_ctx, args: Params) => {
          const search = new URLSearchParams();
          if (args.maxSize !== undefined) search.set("maxSize", String(args.maxSize));
          if (args.offset !== undefined) search.set("offset", String(args.offset));
          return call("GET", "Stream", search);
        },
      ),
      post: mutation(
        {
          description: "Post a message to a record's stream. parentType is the entity type (for example Account) and parentId its id.",
          input: object({ parentType: string(), parentId: string(), post: string() }),
        },
        async (_ctx, args: Params) =>
          call("POST", "Note", undefined, { type: "Post", parentType: args.parentType, parentId: args.parentId, post: args.post }),
      ),
    }),
    meta: router({
      currentUser: query(
        { description: "Return the API user, its ACL and preferences.", input: object({}) },
        async () => call("GET", "App/user"),
      ),
      metadata: query(
        { description: "Return the instance metadata: entity definitions, fields, links and enum options. Large; use it to discover entity types and field names.", input: object({}) },
        async () => call("GET", "Metadata"),
      ),
      settings: query(
        { description: "Return the instance's public settings.", input: object({}) },
        async () => call("GET", "Settings"),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { espocrm: espocrm.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.espocrm ?? [],
        (account) =>
          withApprovals(build(account.fields.site, account.fields.apiKey, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "EspoCRM",
        description:
          "EspoCRM accounts, contacts, leads, opportunities, cases, tasks, meetings, calls, emails, documents, campaigns and any other entity, with relationships and streams.",
        instructions:
          "Records are identified by id and addressed by entity type (Account, Contact, Lead...). Use the typed groups for common entities and `records` for any other entity type, including custom ones; meta.metadata lists entity types and fields. Foreign keys are <link>Id attributes (accountId, assignedUserId). The API user's role limits what it can read and write.",
        icons,
      },
    ),
  }),
);

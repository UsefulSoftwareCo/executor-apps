import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.twenty.com";

const twenty = defineProvider({
  name: "Twenty",
  hosts: ["api.twenty.com"],
  auth: {
    // Settings > APIs & Webhooks > Create key in the Twenty workspace.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Twenty publishes RFC 8414 metadata and registers clients dynamically (RFC 7591).
    oauth: oauth2({ discover: origin, scopes: ["api"] }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/rest/workspaceMembers?limit=1`, {
      signal,
      headers: { Authorization: bearer(account), Accept: "application/json" },
    });
    await decodeJson(response, object({ data: object({ workspaceMembers: json() }) }));
  },
});

type Account = { method: "apiKey"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } };

function bearer(account: Account): string {
  return `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`;
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: unknown) => Promise<unknown>;

const Id = object({ id: string() });
const Body = object({ body: record(json()) });

const listFields = {
  limit: number().optional(),
  startingAfter: string().optional(),
  endingBefore: string().optional(),
  filter: string().optional(),
  orderBy: string().optional(),
  depth: number().optional(),
  fields: string().optional(),
};
const listInput = object(listFields);

const listHelp =
  'Cursor-paginated: pass pageInfo.endCursor as startingAfter. filter looks like `name.firstName[eq]:"Ada"` (combine with and(...), or(...); operators eq, neq, in, is, gt, gte, lt, lte, like, ilike, startsWith, endsWith, containsAny). orderBy looks like `createdAt[DescNullsFirst]`. depth=1 expands relations. fields is a comma-separated field list.';

function listSearch(args: Params): Params {
  return {
    limit: args.limit,
    starting_after: args.startingAfter,
    ending_before: args.endingBefore,
    filter: args.filter,
    order_by: args.orderBy,
    depth: args.depth,
    fields: args.fields,
  };
}

const standardObjects: readonly { key: string; path: string; label: string; readOnly?: boolean }[] = [
  { key: "people", path: "people", label: "person (people)" },
  { key: "companies", path: "companies", label: "company (companies)" },
  { key: "opportunities", path: "opportunities", label: "opportunity (opportunities)" },
  { key: "notes", path: "notes", label: "note (notes)" },
  { key: "tasks", path: "tasks", label: "task (tasks)" },
  { key: "noteTargets", path: "noteTargets", label: "note target linking a note to a record" },
  { key: "taskTargets", path: "taskTargets", label: "task target linking a task to a record" },
  { key: "attachments", path: "attachments", label: "attachment (attachments)" },
  { key: "workflows", path: "workflows", label: "workflow (workflows)" },
  { key: "workspaceMembers", path: "workspaceMembers", label: "workspace member (workspaceMembers)", readOnly: true },
];

function recordTools(label: string, path: string, call: Call, readOnly = false) {
  const base = `/rest/${path}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {
    list: query({ description: `List ${label} records. ${listHelp}`, input: listInput }, async (_c, a) =>
      call("GET", base, listSearch(a), undefined),
    ),
    get: query(
      {
        description: `Get one ${label} record by id.`,
        input: object({ id: string(), depth: number().optional(), fields: string().optional() }),
      },
      async (_c, a) => call("GET", `${base}/${encodeURIComponent(a.id)}`, { depth: a.depth, fields: a.fields }, undefined),
    ),
  };
  if (!readOnly) {
    tools.create = mutation(
      { description: `Create a ${label} record. body holds the fields (composite fields such as name or emails are objects).`, input: Body },
      async (_c, a) => call("POST", base, {}, a.body),
    );
    tools.update = mutation(
      { description: `Update a ${label} record; body holds only the fields to change.`, input: object({ id: string(), body: record(json()) }) },
      async (_c, a) => call("PATCH", `${base}/${encodeURIComponent(a.id)}`, {}, a.body),
    );
    tools.delete = mutation(
      { description: `Delete a ${label} record (soft delete).`, input: Id },
      async (_c, a) => call("DELETE", `${base}/${encodeURIComponent(a.id)}`, {}, undefined),
    );
  }
  return tools;
}

function build(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: bearer(account),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const objectName = string();
  const records = router({
    list: query(
      {
        description: `List records of any object (standard or custom) by its plural name, such as people or a custom object's namePlural. ${listHelp}`,
        input: object({ object: objectName, ...listFields }),
      },
      async (_c, a) => call("GET", `/rest/${encodeURIComponent(a.object)}`, listSearch(a), undefined),
    ),
    get: query(
      {
        description: "Get one record of any object by plural object name and id.",
        input: object({ object: objectName, id: string(), depth: number().optional(), fields: string().optional() }),
      },
      async (_c, a) =>
        call("GET", `/rest/${encodeURIComponent(a.object)}/${encodeURIComponent(a.id)}`, { depth: a.depth, fields: a.fields }, undefined),
    ),
    create: mutation(
      { description: "Create a record of any object by plural object name.", input: object({ object: objectName, body: record(json()) }) },
      async (_c, a) => call("POST", `/rest/${encodeURIComponent(a.object)}`, {}, a.body),
    ),
    update: mutation(
      { description: "Update a record of any object.", input: object({ object: objectName, id: string(), body: record(json()) }) },
      async (_c, a) => call("PATCH", `/rest/${encodeURIComponent(a.object)}/${encodeURIComponent(a.id)}`, {}, a.body),
    ),
    delete: mutation(
      { description: "Delete a record of any object.", input: object({ object: objectName, id: string() }) },
      async (_c, a) => call("DELETE", `/rest/${encodeURIComponent(a.object)}/${encodeURIComponent(a.id)}`, {}, undefined),
    ),
    createMany: mutation(
      {
        description: "Create up to 60 records of any object in one request. records is an array of field objects.",
        input: object({ object: objectName, records: json() }),
      },
      async (_c, a) => call("POST", `/rest/batch/${encodeURIComponent(a.object)}`, {}, a.records),
    ),
  });

  const metadata = router({
    objects: router({
      list: query({ description: "List the workspace's objects (standard and custom) with their fields.", input: object({ limit: number().optional(), startingAfter: string().optional() }) }, async (_c, a) =>
        call("GET", "/rest/metadata/objects", { limit: a.limit, starting_after: a.startingAfter }, undefined),
      ),
      get: query({ description: "Get one object's metadata, including its fields, by object id.", input: Id }, async (_c, a) =>
        call("GET", `/rest/metadata/objects/${encodeURIComponent(a.id)}`, {}, undefined),
      ),
      create: mutation({ description: "Create a custom object. body needs nameSingular, namePlural, labelSingular, labelPlural.", input: Body }, async (_c, a) =>
        call("POST", "/rest/metadata/objects", {}, a.body),
      ),
      update: mutation({ description: "Update an object's metadata.", input: object({ id: string(), body: record(json()) }) }, async (_c, a) =>
        call("PATCH", `/rest/metadata/objects/${encodeURIComponent(a.id)}`, {}, a.body),
      ),
      delete: mutation({ description: "Delete a custom object and its data.", input: Id }, async (_c, a) =>
        call("DELETE", `/rest/metadata/objects/${encodeURIComponent(a.id)}`, {}, undefined),
      ),
    }),
    fields: router({
      list: query({ description: "List fields across all objects.", input: object({ limit: number().optional(), startingAfter: string().optional() }) }, async (_c, a) =>
        call("GET", "/rest/metadata/fields", { limit: a.limit, starting_after: a.startingAfter }, undefined),
      ),
      get: query({ description: "Get one field's metadata by field id.", input: Id }, async (_c, a) =>
        call("GET", `/rest/metadata/fields/${encodeURIComponent(a.id)}`, {}, undefined),
      ),
      create: mutation({ description: "Create a field. body needs objectMetadataId, type, name, label.", input: Body }, async (_c, a) =>
        call("POST", "/rest/metadata/fields", {}, a.body),
      ),
      update: mutation({ description: "Update a field's metadata.", input: object({ id: string(), body: record(json()) }) }, async (_c, a) =>
        call("PATCH", `/rest/metadata/fields/${encodeURIComponent(a.id)}`, {}, a.body),
      ),
      delete: mutation({ description: "Delete a field and its data.", input: Id }, async (_c, a) =>
        call("DELETE", `/rest/metadata/fields/${encodeURIComponent(a.id)}`, {}, undefined),
      ),
    }),
  });

  const standard = Object.fromEntries(
    standardObjects.map((o) => [o.key, router(recordTools(o.label, o.path, call, o.readOnly))]),
  );
  return router({ ...standard, records, metadata });
}

export default defineApp(
  { user: { accounts: { twenty: twenty.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.twenty ?? [],
        (account) =>
          withApprovals(build(account, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Twenty",
        description:
          "Twenty CRM: people, companies, opportunities, notes, tasks and custom objects, plus workspace object and field metadata.",
        instructions:
          "Each workspace has its own schema. Call metadata.objects.list first to see custom objects and fields, then use records.* with the object's plural name. Rate limit is 100 requests per minute; batches take at most 60 records.",
        icons,
      },
    ),
  }),
);

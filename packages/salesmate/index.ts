import {
  accountRouter,
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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Salesmate account lives on its own host, the "link name" (for example demo.salesmate.io).
const hostPattern = /^[a-z0-9][a-z0-9-]*\.salesmate\.io$/;

function origin(account: { fields: { linkName: string } }) {
  const host = account.fields.linkName
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your Salesmate link name as shown in your dashboard URL, for example demo.salesmate.io.");
  return { base: `https://${host}`, host };
}

const salesmate = defineProvider({
  name: "Salesmate",
  hosts: ["*.salesmate.io"],
  auth: {
    apiKey: secrets({
      label: "Access key",
      fields: object({
        linkName: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { base, host } = origin(account);
    const response = await fetch(`${base}/apis/core/v4/users?status=active`, {
      signal,
      headers: { accessToken: account.fields.token, "x-linkname": host, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, host: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}/apis${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/apis/")) throw new Error("path must stay under /apis");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        accessToken: token,
        "x-linkname": host,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const bodyInput = object({ body: json() });
const searchInput = object({
  body: json(),
  rows: number().optional(),
  from: number().optional(),
});
const searchDoc =
  'Body is a Salesmate search request: {"fields": ["contact.id", "contact.email"], "query": {"group": {"operator": "AND", "rules": [{"condition": "EQUALS", "moduleName": "Contact", "field": {"fieldName": "contact.email", "type": "Email"}, "data": "a@b.com"}]}}}. rows is the page size (max 250), from is the offset.';

function build(call: Call) {
  const search = (path: string, description: string) =>
    query({ description: `${description} ${searchDoc}`, input: searchInput }, (_c, { body, rows, from }) =>
      call("POST", path, { rows, from }, body),
    );
  const get = (path: (i: string) => string, description: string) =>
    query(
      { description, input: object({ id: id(), fieldsToQuery: string().optional() }) },
      (_c, { id: i, fieldsToQuery }) => call("GET", path(i), { fieldsToQuery }),
    );
  const create = (path: string, description: string) =>
    mutation({ description, input: bodyInput }, (_c, { body }) => call("POST", path, {}, body));
  const update = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) =>
      call("PUT", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));

  // Notes share one shape across modules: contact 1, activity 2, deal 4, company 5, plus custom modules.
  const notes = (moduleId: string) => {
    const base = (objectId: string) => `/module/v4/modules/${seg(moduleId)}/objects/${seg(objectId)}/notes`;
    return {
      list: query({ description: "List all notes on a record.", input: object({ objectId: id() }) }, (_c, { objectId }) =>
        call("GET", base(objectId)),
      ),
      get: query(
        { description: "Get a note by id.", input: object({ objectId: id(), noteId: id() }) },
        (_c, { objectId, noteId }) => call("GET", `${base(objectId)}/${seg(noteId)}`),
      ),
      create: mutation(
        { description: 'Add a note to a record. Body example: {"description": "Called the customer"}.', input: object({ objectId: id(), body: json() }) },
        (_c, { objectId, body }) => call("POST", base(objectId), {}, body),
      ),
      update: mutation(
        { description: "Update a note.", input: object({ objectId: id(), noteId: id(), body: json() }) },
        (_c, { objectId, noteId, body }) => call("PUT", `${base(objectId)}/${seg(noteId)}`, {}, body),
      ),
      pin: mutation(
        { description: "Pin a note to the top of the record.", input: object({ objectId: id(), noteId: id() }) },
        (_c, { objectId, noteId }) => call("PATCH", `${base(objectId)}/${seg(noteId)}/pin-it`),
      ),
      unpin: mutation(
        { description: "Unpin a note.", input: object({ objectId: id(), noteId: id() }) },
        (_c, { objectId, noteId }) => call("PATCH", `${base(objectId)}/${seg(noteId)}/unpin-it`),
      ),
      delete: mutation(
        { description: "Delete a note.", input: object({ objectId: id(), noteId: id() }) },
        (_c, { objectId, noteId }) => call("DELETE", `${base(objectId)}/${seg(noteId)}`),
      ),
    };
  };

  const contacts = router(
    {
      get: get((i) => `/contact/v4/${seg(i)}`, "Get a contact by id."),
      search: search("/contact/v4/search", "Search and filter contacts."),
      create: create("/contact/v4", 'Create a contact. Body example: {"firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com", "owner": 1}.'),
      update: update((i) => `/contact/v4/${seg(i)}`, "Update a contact."),
      delete: remove((i) => `/contact/v4/${seg(i)}`, "Delete a contact."),
      ...Object.fromEntries(Object.entries(notes("1")).map(([k, v]) => [`note${k[0]!.toUpperCase()}${k.slice(1)}`, v])),
    },
    { title: "Contacts", description: "People tracked in the CRM, with their notes." },
  );

  const companies = router(
    {
      get: get((i) => `/company/v4/${seg(i)}`, "Get a company by id."),
      search: search("/company/v4/search", "Search and filter companies."),
      create: create("/company/v4", 'Create a company. Body example: {"name": "Acme", "owner": 1, "website": "acme.com"}.'),
      update: update((i) => `/company/v4/${seg(i)}`, "Update a company."),
      delete: remove((i) => `/company/v4/${seg(i)}`, "Delete a company."),
      ...Object.fromEntries(Object.entries(notes("5")).map(([k, v]) => [`note${k[0]!.toUpperCase()}${k.slice(1)}`, v])),
    },
    { title: "Companies", description: "Organizations in the CRM, with their notes." },
  );

  const deals = router(
    {
      get: get((i) => `/deal/v4/${seg(i)}`, "Get a deal by id."),
      search: search("/deal/v4/search", "Search and filter deals."),
      create: create("/deal/v4", 'Create a deal. Body example: {"title": "Renewal", "owner": 1, "primaryContact": 1, "pipeline": "Sales", "status": "Open", "stage": "New"}.'),
      update: update((i) => `/deal/v4/${seg(i)}`, "Update a deal, including moving it to another stage."),
      delete: remove((i) => `/deal/v4/${seg(i)}`, "Delete a deal."),
      ...Object.fromEntries(Object.entries(notes("4")).map(([k, v]) => [`note${k[0]!.toUpperCase()}${k.slice(1)}`, v])),
    },
    { title: "Deals", description: "Sales deals, their stages and notes." },
  );

  const activities = router(
    {
      get: get((i) => `/activity/v4/${seg(i)}`, "Get an activity (task, call, meeting) by id."),
      search: query(
        { description: `Search activities. ${searchDoc}`, input: object({ body: json(), rows: number().optional(), from: number().optional(), viewType: string().optional() }) },
        (_c, { body, rows, from, viewType }) => call("POST", "/activity/v4/search", { rows, from, viewType: viewType ?? "list" }, body),
      ),
      create: create("/activity/v4", 'Create an activity. Body example: {"title": "Follow up", "type": "Call", "owner": 1, "dueDate": "2026-11-01T10:00:00.000Z"}.'),
      update: update((i) => `/activity/v4/${seg(i)}`, "Update an activity, including marking it complete."),
      delete: mutation(
        { description: "Delete an activity. Soft-deletes unless hardDelete is true.", input: object({ id: id(), hardDelete: boolean().optional() }) },
        (_c, { id: i, hardDelete }) => call("DELETE", `/activity/v4/${seg(i)}`, { hardDelete: hardDelete ?? false }),
      ),
      ...Object.fromEntries(Object.entries(notes("2")).map(([k, v]) => [`note${k[0]!.toUpperCase()}${k.slice(1)}`, v])),
    },
    { title: "Activities", description: "Tasks, calls and meetings, with their notes." },
  );

  const products = router(
    {
      search: query(
        { description: `Search products. ${searchDoc} sortBy and sortOrder are optional.`, input: object({ body: json(), rows: number().optional(), from: number().optional(), sortBy: string().optional(), sortOrder: string().optional() }) },
        (_c, { body, rows, from, sortBy, sortOrder }) => call("POST", "/v3/products/search", { rows, from, sortBy, sortOrder }, body),
      ),
      create: create("/v1/products", "Create a product."),
      addVariations: mutation(
        { description: "Add variations to a product.", input: object({ id: id(), body: json() }) },
        (_c, { id: i, body }) => call("POST", `/v1/products/${seg(i)}/variations`, {}, body),
      ),
      update: update((i) => `/v1/products/${seg(i)}`, "Update a product."),
      delete: remove((i) => `/v1/products/${seg(i)}`, "Delete a product."),
      bulkDelete: mutation(
        { description: "Delete several products at once. Body lists the product ids as the API reference describes.", input: bodyInput },
        (_c, { body }) => call("PUT", "/v1/products/bulkDelete", {}, body),
      ),
    },
    { title: "Products", description: "Product catalog entries and variations." },
  );

  const modules = router(
    {
      ids: query({ description: "Get module ids and internal names, needed for custom module records and notes.", input: object({}) }, () =>
        call("GET", "/module/v4/modules/internal_name"),
      ),
    },
    { title: "Modules", description: "Module metadata." },
  );

  const records = router(
    {
      search: search("/module/v4/records/search", "Search records of custom modules (include the module in the query rules)."),
      get: query(
        { description: "Get a custom module record.", input: object({ moduleId: id(), recordId: id(), fieldsToQuery: string().optional() }) },
        (_c, { moduleId, recordId, fieldsToQuery }) => call("GET", `/module/v4/${seg(moduleId)}/records/${seg(recordId)}`, { fieldsToQuery }),
      ),
      create: mutation(
        { description: "Create a record in a custom module.", input: object({ moduleId: id(), body: json() }) },
        (_c, { moduleId, body }) => call("POST", `/module/v4/${seg(moduleId)}/records`, {}, body),
      ),
      update: mutation(
        { description: "Update a custom module record.", input: object({ moduleId: id(), recordId: id(), body: json() }) },
        (_c, { moduleId, recordId, body }) => call("PUT", `/module/v4/${seg(moduleId)}/records/${seg(recordId)}`, {}, body),
      ),
      delete: mutation(
        { description: "Delete a custom module record. Soft-deletes unless hardDelete is true.", input: object({ moduleId: id(), recordId: id(), hardDelete: boolean().optional() }) },
        (_c, { moduleId, recordId, hardDelete }) => call("DELETE", `/module/v4/${seg(moduleId)}/records/${seg(recordId)}`, { hardDelete: hardDelete ?? false }),
      ),
      lookupFields: query(
        { description: "Fetch details of the records a lookup field points at.", input: object({ module: id(), recordId: id(), fieldApiName: id(), fieldsToQuery: string().optional(), relation: string().optional() }) },
        (_c, { module, recordId, fieldApiName, fieldsToQuery, relation }) =>
          call("GET", `/${seg(module)}/v1/${seg(recordId)}/lookup-fields/${seg(fieldApiName)}/associated-records`, { fieldsToQuery, relation: relation ?? "forward" }),
      ),
      noteList: query(
        { description: "List notes on a record in any module.", input: object({ moduleId: id(), objectId: id() }) },
        (_c, { moduleId, objectId }) => call("GET", `/module/v4/modules/${seg(moduleId)}/objects/${seg(objectId)}/notes`),
      ),
      noteCreate: mutation(
        { description: "Add a note to a record in any module.", input: object({ moduleId: id(), objectId: id(), body: json() }) },
        (_c, { moduleId, objectId, body }) => call("POST", `/module/v4/modules/${seg(moduleId)}/objects/${seg(objectId)}/notes`, {}, body),
      ),
    },
    { title: "Module records", description: "Records and notes of custom modules." },
  );

  const users = router(
    {
      list: query(
        { description: "List users; status is active, inactive or empty for all.", input: object({ status: string().optional() }) },
        (_c, { status }) => call("GET", "/core/v4/users", { status: status ?? "active" }),
      ),
    },
    { title: "Users", description: "Users in the Salesmate account." },
  );

  return router({ contacts, companies, deals, activities, products, modules, records, users });
}

export default defineApp(
  { user: { accounts: { salesmate: salesmate.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.salesmate ?? [],
        (account) => {
          const { base, host } = origin(account);
          return withApprovals(build(client(base, host, account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "Salesmate",
        description: "Contacts, companies, deals, activities, products, notes and custom module records in the Salesmate CRM.",
        icons,
        instructions:
          "Create and update tools take the raw JSON body from the Salesmate API reference. Search tools take a filter body plus rows (max 250) and from. Note tools exist per module: contacts, companies, deals and activities have noteXxx tools; use records.noteList/noteCreate with a moduleId for others (contact 1, activity 2, deal 4, company 5).",
      },
    ),
  }),
);

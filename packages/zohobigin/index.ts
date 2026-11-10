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
  oauth2,
  object,
  query,
  record,
  router,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Zoho keeps each data center separate: the accounts server issues tokens and the API server only
// accepts tokens from its own data center.
const regions = {
  us: { accounts: "https://accounts.zoho.com", api: "https://www.zohoapis.com" },
  eu: { accounts: "https://accounts.zoho.eu", api: "https://www.zohoapis.eu" },
  in: { accounts: "https://accounts.zoho.in", api: "https://www.zohoapis.in" },
  au: { accounts: "https://accounts.zoho.com.au", api: "https://www.zohoapis.com.au" },
  jp: { accounts: "https://accounts.zoho.jp", api: "https://www.zohoapis.jp" },
  ca: { accounts: "https://accounts.zohocloud.ca", api: "https://www.zohoapis.ca" },
  sa: { accounts: "https://accounts.zoho.sa", api: "https://www.zohoapis.sa" },
  cn: { accounts: "https://accounts.zoho.com.cn", api: "https://www.zohoapis.com.cn" },
} as const;

type Region = keyof typeof regions;

const regionOfMethod = {
  oauthUs: "us",
  oauthEu: "eu",
  oauthIn: "in",
  oauthAu: "au",
  oauthJp: "jp",
  oauthCa: "ca",
  oauthSa: "sa",
  oauthCn: "cn",
} as const satisfies Record<string, Region>;

// Zoho has no registration endpoint: the connect page asks for the client created in the API console.
// The client credentials go in the token request body, and a refresh token comes back only for
// access_type=offline.
const oauth = (region: Region) =>
  oauth2({
    authorizationUrl: `${regions[region].accounts}/oauth/v2/auth`,
    tokenUrl: `${regions[region].accounts}/oauth/v2/token`,
    revocationUrl: `${regions[region].accounts}/oauth/v2/token/revoke`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopeSeparator: ",",
    scopes: [
      "ZohoBigin.modules.ALL",
      "ZohoBigin.settings.ALL",
      "ZohoBigin.users.READ",
      "ZohoBigin.org.READ",
      "ZohoBigin.coql.READ",
      "ZohoSearch.securesearch.READ",
    ],
    authorizationParams: { access_type: "offline", prompt: "consent" },
  });

const CurrentUser = object({ users: array(object({ id: string(), full_name: string() })) });

const zohoBigin = defineProvider({
  name: "Zoho Bigin",
  hosts: Object.values(regions).flatMap((region) => [region.accounts.slice(8), region.api.slice(8)]),
  auth: {
    oauthUs: oauth("us"),
    oauthEu: oauth("eu"),
    oauthIn: oauth("in"),
    oauthAu: oauth("au"),
    oauthJp: oauth("jp"),
    oauthCa: oauth("ca"),
    oauthSa: oauth("sa"),
    oauthCn: oauth("cn"),
  },
  async health({ account, fetch, signal }) {
    const region = regionOfMethod[account.method];
    const response = await fetch(`${regions[region].api}/bigin/v2/users?type=CurrentUser`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { users } = await decodeJson(response, CurrentUser);
    const user = users[0];
    if (!user) throw new Error("Zoho Bigin returned no current user.");
    return { accountInfo: { externalId: `${region}:${user.id}`, displayName: `${user.full_name} (${region})` } };
  },
});

const moduleDescription =
  "Module API name: Contacts, Accounts (shown as Companies in Bigin), Pipelines (deals), Products, Tasks, Events or Calls.";
const Module = string({ minLength: 1 });
const Id = string({ minLength: 1 });
const Records = array(record(json()));
const Query = record(string());

type Fetch = (url: string, init?: RequestInit & { signal?: AbortSignal }) => Promise<Response>;

function client(region: Region, token: string, fetch: Fetch) {
  const base = `${regions[region].api}/bigin/v2`;
  return async (method: "GET" | "POST" | "PUT" | "DELETE", path: string, params?: Record<string, unknown>, body?: unknown, signal?: AbortSignal) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetch(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Zoho answers 204 with no body when a list or search matches nothing.
    if (response.status === 204) return { data: [] };
    return decodeJson(response, json());
  };
}

function tools(call: ReturnType<typeof client>) {
  return router({
    records: router(
      {
        list: query(
          {
            description:
              "List records of a module. fields is required by Zoho (max 50 API names, e.g. Last_Name,Email); get the names with metadata.listFields. Pages hold up to 200 records; past 2,000 records pass page_token from the previous response's info.next_page_token.",
            input: object({
              module: Module,
              fields: array(string({ minLength: 1 })),
              page: number().optional(),
              per_page: number().optional(),
              page_token: string().optional(),
              sort_by: string().optional(),
              sort_order: string().optional(),
              cvid: string().optional(),
            }),
          },
          async ({ signal }, { module, ...params }) => call("GET", module, params, undefined, signal),
        ),
        get: query(
          {
            description: "Fetch one record by id with all of its fields.",
            input: object({ module: Module, id: Id }),
          },
          async ({ signal }, { module, id }) => call("GET", `${module}/${id}`, undefined, undefined, signal),
        ),
        search: query(
          {
            description:
              "Search a module. Give exactly one of criteria, email, phone or word. criteria looks like ((Deal_Name:starts_with:W)and(Amount:greater_than:5000)); comparators are equals, not_equal, starts_with, in, greater_than, greater_equal, less_than, less_equal, between by field type. Returns an empty data list when nothing matches.",
            input: object({
              module: Module,
              criteria: string().optional(),
              email: string().optional(),
              phone: string().optional(),
              word: string().optional(),
              page: number().optional(),
              per_page: number().optional(),
            }),
          },
          async ({ signal }, { module, ...params }) => call("GET", `${module}/search`, params, undefined, signal),
        ),
        coql: query(
          {
            description:
              "Run a read-only COQL SELECT, e.g. select Last_Name, Email from Contacts where Email is not null limit 50. At most 50 fields and 200 rows per call; OFFSET reaches 10,000 rows.",
            input: object({ select_query: string({ minLength: 1 }) }),
          },
          async ({ signal }, { select_query }) => call("POST", "coql", undefined, { select_query }, signal),
        ),
        related: query(
          {
            description:
              "List records related to a record, such as Contacts for a company or Products of a pipeline record. related_list is the related list API name from metadata.listRelatedLists.",
            input: object({
              module: Module,
              id: Id,
              related_list: string({ minLength: 1 }),
              fields: array(string({ minLength: 1 })),
              page: number().optional(),
              per_page: number().optional(),
            }),
          },
          async ({ signal }, { module, id, related_list, ...params }) =>
            call("GET", `${module}/${id}/${related_list}`, params, undefined, signal),
        ),
        create: mutation(
          {
            description:
              "Create up to 100 records in a module. data is a list of field API name to value objects, e.g. [{Last_Name: 'Smith', Email: 'a@b.co'}] for Contacts or [{Deal_Name, Stage, Pipeline, Contact_Name: {id}}] for Pipelines. Lookups take {id}.",
            input: object({ module: Module, data: Records, trigger: array(string()).optional() }),
            approval: always(),
          },
          async ({ signal }, { module, data, trigger }) =>
            call("POST", module, undefined, { data, ...(trigger ? { trigger } : {}) }, signal),
        ),
        update: mutation(
          {
            description: "Update one record. Send only the fields to change.",
            input: object({ module: Module, id: Id, data: record(json()) }),
            approval: always(),
          },
          async ({ signal }, { module, id, data }) => call("PUT", `${module}/${id}`, undefined, { data: [data] }, signal),
        ),
        updateMany: mutation(
          {
            description: "Update up to 100 records at once. Each item of data must carry the record's id.",
            input: object({ module: Module, data: Records }),
            approval: always(),
          },
          async ({ signal }, { module, data }) => call("PUT", module, undefined, { data }, signal),
        ),
        upsert: mutation(
          {
            description:
              "Insert records, or update the ones that match duplicate_check_fields (e.g. Email). Up to 100 records.",
            input: object({
              module: Module,
              data: Records,
              duplicate_check_fields: array(string()).optional(),
            }),
            approval: always(),
          },
          async ({ signal }, { module, data, duplicate_check_fields }) =>
            call(
              "POST",
              `${module}/upsert`,
              undefined,
              { data, ...(duplicate_check_fields ? { duplicate_check_fields } : {}) },
              signal,
            ),
        ),
        delete: mutation(
          {
            description: "Delete up to 100 records by id. Deleted records go to the recycle bin.",
            input: object({ module: Module, ids: array(Id) }),
            approval: always(),
          },
          async ({ signal }, { module, ids }) => call("DELETE", module, { ids }, undefined, signal),
        ),
      },
      {
        title: "Records",
        description: "Contacts, companies (Accounts), pipeline records (Pipelines), products, tasks, events and calls.",
        instructions: moduleDescription,
      },
    ),
    notes: router(
      {
        list: query(
          {
            description: "List the notes attached to a record.",
            input: object({
              module: Module,
              id: Id,
              fields: array(string()).default(["Note_Title", "Note_Content", "Created_Time", "Owner"]),
              page: number().optional(),
              per_page: number().optional(),
            }),
          },
          async ({ signal }, { module, id, ...params }) =>
            call("GET", `${module}/${id}/Notes`, params, undefined, signal),
        ),
        create: mutation(
          {
            description: "Add a note to a record.",
            input: object({ module: Module, id: Id, title: string().optional(), content: string({ minLength: 1 }) }),
            approval: always(),
          },
          async ({ signal }, { module, id, title, content }) =>
            call(
              "POST",
              `${module}/${id}/Notes`,
              undefined,
              { data: [{ Note_Content: content, ...(title ? { Note_Title: title } : {}) }] },
              signal,
            ),
        ),
        delete: mutation(
          {
            description: "Delete a note from a record.",
            input: object({ module: Module, id: Id, note_id: Id }),
            approval: always(),
          },
          async ({ signal }, { module, id, note_id }) =>
            call("DELETE", `${module}/${id}/Notes/${note_id}`, undefined, undefined, signal),
        ),
      },
      { title: "Notes", description: "Notes on records." },
    ),
    tags: router(
      {
        list: query(
          {
            description: "List the tags of a module.",
            input: object({ module: Module }),
          },
          async ({ signal }, { module }) => call("GET", "settings/tags", { module }, undefined, signal),
        ),
        create: mutation(
          {
            description: "Create tags for a module.",
            input: object({ module: Module, tags: array(object({ name: string({ minLength: 1 }), color_code: string().optional() })) }),
            approval: always(),
          },
          async ({ signal }, { module, tags }) => call("POST", "settings/tags", { module }, { tags }, signal),
        ),
        addToRecord: mutation(
          {
            description: "Add tags to a record. Unknown tag names are created.",
            input: object({ module: Module, id: Id, tag_names: array(string({ minLength: 1 })), over_write: boolean().optional() }),
            approval: always(),
          },
          async ({ signal }, { module, id, ...params }) =>
            call("POST", `${module}/${id}/actions/add_tags`, params, undefined, signal),
        ),
        removeFromRecord: mutation(
          {
            description: "Remove tags from a record.",
            input: object({ module: Module, id: Id, tag_names: array(string({ minLength: 1 })) }),
            approval: always(),
          },
          async ({ signal }, { module, id, ...params }) =>
            call("POST", `${module}/${id}/actions/remove_tags`, params, undefined, signal),
        ),
      },
      { title: "Tags", description: "Tags on modules and records." },
    ),
    metadata: router(
      {
        listModules: query(
          { description: "List the modules available in the account.", input: object({}) },
          async ({ signal }) => call("GET", "settings/modules", undefined, undefined, signal),
        ),
        listFields: query(
          {
            description: "List the fields of a module with their API names, types and picklist values.",
            input: object({ module: Module }),
          },
          async ({ signal }, { module }) => call("GET", "settings/fields", { module }, undefined, signal),
        ),
        listLayouts: query(
          { description: "List the layouts of a module.", input: object({ module: Module }) },
          async ({ signal }, { module }) => call("GET", "settings/layouts", { module }, undefined, signal),
        ),
        listRelatedLists: query(
          { description: "List the related lists of a module.", input: object({ module: Module }) },
          async ({ signal }, { module }) => call("GET", "settings/related_lists", { module }, undefined, signal),
        ),
        listCustomViews: query(
          {
            description: "List the custom views of a module; a view id is the cvid of records.list.",
            input: object({ module: Module }),
          },
          async ({ signal }, { module }) => call("GET", "settings/custom_views", { module }, undefined, signal),
        ),
      },
      { title: "Metadata", description: "Modules, fields, layouts, related lists and custom views." },
    ),
    users: router(
      {
        list: query(
          {
            description:
              "List users. type is AllUsers, ActiveUsers, DeactiveUsers, ConfirmedUsers, NotConfirmedUsers, DeletedUsers, ActiveConfirmedUsers, AdminUsers, ActiveConfirmedAdmins or CurrentUser.",
            input: object({ type: string().default("AllUsers"), page: number().optional(), per_page: number().optional() }),
          },
          async ({ signal }, params) => call("GET", "users", params, undefined, signal),
        ),
        get: query(
          { description: "Fetch one user by id.", input: object({ id: Id }) },
          async ({ signal }, { id }) => call("GET", `users/${id}`, undefined, undefined, signal),
        ),
        organization: query(
          { description: "Get the organization's details.", input: object({}) },
          async ({ signal }) => call("GET", "org", undefined, undefined, signal),
        ),
      },
      { title: "Users", description: "Users and organization details." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { zohoBigin: zohoBigin.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zohoBigin ?? [],
        (account) => tools(client(regionOfMethod[account.method], account.fields.access_token, fetch as Fetch)),
        { signal },
      ),
      {
        title: "Zoho Bigin",
        description:
          "Contacts, companies, pipeline records, products, tasks, events, calls, notes and tags in Zoho Bigin, plus search, COQL queries and module metadata.",
        instructions:
          "Bigin names modules by API name: Contacts, Accounts (Companies in the UI), Pipelines (deals), Products, Tasks, Events, Calls. records.list requires fields; read names from metadata.listFields. Search with records.search or records.coql. Writes take {data: [...]}-style field objects; lookups take {id}.",
        icons,
      },
    ),
  }),
);

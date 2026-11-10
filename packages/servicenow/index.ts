import {
  accountRouter,
  array,
  basic,
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
  type Schema,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every ServiceNow instance lives on its own host: https://<instance>.service-now.com.
const instanceUrl = (instance: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(?:\.service-now\.com)?\/?$/.exec(
    instance.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <instance> of <instance>.service-now.com (letters, digits and hyphens).");
  return `https://${match[1]}.service-now.com`;
};

const servicenow = defineProvider({
  name: "ServiceNow",
  hosts: ["*.service-now.com"],
  auth: {
    // OAuth is not declared: ServiceNow's authorize and token endpoints are per-instance
    // (https://<instance>.service-now.com/oauth_auth.do and /oauth_token.do) and the framework only
    // takes static endpoint strings.
    basic: secrets({
      label: "Username and password",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
      request: ({ username, password }) => basic(username, password),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = instanceUrl(account.fields.instance);
    if (!/^[A-Za-z0-9._@-]+$/.test(account.fields.username))
      throw new Error("The user name may only contain letters, digits, '.', '_', '-' and '@'.");
    const url = new URL(`${base}/api/now/table/sys_user`);
    url.searchParams.set("sysparm_query", `user_name=${account.fields.username}`);
    url.searchParams.set("sysparm_limit", "1");
    url.searchParams.set("sysparm_fields", "sys_id,user_name,name");
    const response = await fetch(account.url(url.toString()), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const { result } = await decodeJson(response, object({ result: array(json()) }));
    if (result.length !== 1)
      throw new Error(`Expected exactly one sys_user row for ${account.fields.username}, got ${result.length}; check the user name and that it can read sys_user.`);
    const me = result[0] as { name?: string };
    return {
      accountInfo: {
        externalId: `${new URL(base).hostname}/${account.fields.username}`,
        username: account.fields.username,
        ...(typeof me.name === "string" && me.name !== "" ? { displayName: me.name } : {}),
        profileUrl: base,
      },
    };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

const safe = /^[A-Za-z0-9_.-]+$/;
const segment = (value: unknown, label: string) => {
  const text = String(value);
  if (!safe.test(text)) throw new Error(`${label} must contain only letters, digits, "_", "." and "-".`);
  return encodeURIComponent(text);
};

function client(base: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const upload = async (input: Params) => {
    const url = new URL(`${base}/api/now/attachment/file`);
    url.searchParams.set("table_name", String(input.table));
    url.searchParams.set("table_sys_id", String(input.recordSysId));
    url.searchParams.set("file_name", String(input.fileName));
    const response = await fetcher(url.toString(), {
      method: "POST",
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": typeof input.contentType === "string" ? input.contentType : "text/plain",
      },
      body: String(input.content),
    });
    return decodeJson(response, json());
  };
  return { call, upload };
}

type Client = ReturnType<typeof client>;

const tableName = string({ minLength: 1 });
const sysId = string({ minLength: 1 });
const fieldsBody = record(json());

// Shared Table API query parameters.
const listParams = {
  query: string().optional(),
  fields: string().optional(),
  limit: number().optional(),
  offset: number().optional(),
  displayValue: string().optional(),
  excludeReferenceLink: boolean().optional(),
};
const listSearch = (input: Params): Params => ({
  sysparm_query: input.query,
  sysparm_fields: input.fields,
  sysparm_limit: input.limit ?? 25,
  sysparm_offset: input.offset,
  sysparm_display_value: input.displayValue,
  sysparm_exclude_reference_link: input.excludeReferenceLink,
});
const recordParams = {
  fields: string().optional(),
  displayValue: string().optional(),
  excludeReferenceLink: boolean().optional(),
};
const recordSearch = (input: Params): Params => ({
  sysparm_fields: input.fields,
  sysparm_display_value: input.displayValue,
  sysparm_exclude_reference_link: input.excludeReferenceLink,
});

const queryHelp =
  "query is an encoded query, e.g. active=true^priority=1^ORDERBYDESC sys_created_on. limit defaults to 25; page with offset. displayValue is \"true\", \"false\" or \"all\".";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema<any, boolean>;
const q = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  query({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));
const m = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  mutation({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));

// CRUD tools over one fixed table of the Table API.
function tableTools(c: Client, table: string, noun: string, plural: string, opts: { write?: boolean; remove?: boolean } = {}) {
  const path = `/api/now/table/${table}`;
  return router(
    {
      list: q(`List ${plural} (table ${table}). ${queryHelp}`, object(listParams), (i) =>
        c.call("GET", path, listSearch(i)),
      ),
      get: q(`Retrieve one ${noun} by sys_id.`, object({ sysId, ...recordParams }), (i) =>
        c.call("GET", `${path}/${segment(i.sysId, "sysId")}`, recordSearch(i)),
      ),
      ...(opts.write === false
        ? {}
        : {
            create: m(`Create a ${noun}. fields maps column names to values.`, object({ fields: fieldsBody }), (i) =>
              c.call("POST", path, {}, i.fields),
            ),
            update: m(
              `Update a ${noun}; only the columns in fields change.`,
              object({ sysId, fields: fieldsBody }),
              (i) => c.call("PATCH", `${path}/${segment(i.sysId, "sysId")}`, {}, i.fields),
            ),
          }),
      ...(opts.remove === true
        ? {
            delete: m(`Delete a ${noun}.`, object({ sysId }), (i) =>
              c.call("DELETE", `${path}/${segment(i.sysId, "sysId")}`),
            ),
          }
        : {}),
    },
    { title: plural[0]!.toUpperCase() + plural.slice(1), description: `${plural} in the ${table} table.` },
  );
}

function build(c: Client) {
  const change = "/api/sn_chg_rest/change";
  const catalog = "/api/sn_sc/servicecatalog";
  const cmdb = "/api/now/cmdb/instance";

  return router({
    table: router(
      {
        list: q(`List records of any table. ${queryHelp}`, object({ table: tableName, ...listParams }), (i) =>
          c.call("GET", `/api/now/table/${segment(i.table, "table")}`, listSearch(i)),
        ),
        get: q("Retrieve one record of any table by sys_id.", object({ table: tableName, sysId, ...recordParams }), (i) =>
          c.call("GET", `/api/now/table/${segment(i.table, "table")}/${segment(i.sysId, "sysId")}`, recordSearch(i)),
        ),
        create: m("Create a record in any table. fields maps column names to values.", object({ table: tableName, fields: fieldsBody }), (i) =>
          c.call("POST", `/api/now/table/${segment(i.table, "table")}`, {}, i.fields),
        ),
        update: m(
          "Update a record of any table; only the columns in fields change.",
          object({ table: tableName, sysId, fields: fieldsBody }),
          (i) => c.call("PATCH", `/api/now/table/${segment(i.table, "table")}/${segment(i.sysId, "sysId")}`, {}, i.fields),
        ),
        replace: m(
          "Replace a record of any table (PUT); columns missing from fields may be cleared.",
          object({ table: tableName, sysId, fields: fieldsBody }),
          (i) => c.call("PUT", `/api/now/table/${segment(i.table, "table")}/${segment(i.sysId, "sysId")}`, {}, i.fields),
        ),
        delete: m("Delete a record of any table.", object({ table: tableName, sysId }), (i) =>
          c.call("DELETE", `/api/now/table/${segment(i.table, "table")}/${segment(i.sysId, "sysId")}`),
        ),
        schema: q(
          "Describe the columns defined directly on a table (name, type, label, mandatory) from sys_dictionary. Inherited columns are defined on parent tables; query those tables too.",
          object({ table: tableName }),
          (i) =>
            c.call("GET", "/api/now/table/sys_dictionary", {
              sysparm_query: `name=${segment(i.table, "table")}^elementISNOTEMPTY`,
              sysparm_fields: "element,internal_type,column_label,mandatory",
              sysparm_limit: 1000,
              sysparm_exclude_reference_link: true,
            }),
        ),
        listTables: q(
          "List tables defined on the instance (sys_db_object). query filters, e.g. nameSTARTSWITHincident.",
          object({ query: string().optional(), limit: number().optional(), offset: number().optional() }),
          (i) =>
            c.call("GET", "/api/now/table/sys_db_object", {
              sysparm_query: i.query,
              sysparm_fields: "name,label,super_class,sys_id",
              sysparm_limit: i.limit ?? 50,
              sysparm_offset: i.offset,
              sysparm_exclude_reference_link: true,
            }),
        ),
      },
      { title: "Table API", description: "Read and write records of any table." },
    ),
    stats: q(
      "Aggregate a table (Aggregate API): counts and avg/min/max/sum, optionally grouped. Pass avgFields, minFields, maxFields or sumFields as comma-separated column lists.",
      object({
        table: tableName,
        query: string().optional(),
        count: boolean().optional(),
        groupBy: string().optional(),
        avgFields: string().optional(),
        minFields: string().optional(),
        maxFields: string().optional(),
        sumFields: string().optional(),
        orderBy: string().optional(),
        having: string().optional(),
        displayValue: string().optional(),
      }),
      (i) =>
        c.call("GET", `/api/now/stats/${segment(i.table, "table")}`, {
          sysparm_query: i.query,
          sysparm_count: i.count ?? (i.avgFields || i.minFields || i.maxFields || i.sumFields ? undefined : true),
          sysparm_group_by: i.groupBy,
          sysparm_avg_fields: i.avgFields,
          sysparm_min_fields: i.minFields,
          sysparm_max_fields: i.maxFields,
          sysparm_sum_fields: i.sumFields,
          sysparm_order_by: i.orderBy,
          sysparm_having: i.having,
          sysparm_display_value: i.displayValue,
        }),
    ),
    incidents: tableTools(c, "incident", "incident", "incidents", { remove: true }),
    problems: tableTools(c, "problem", "problem", "problems", { remove: true }),
    tasks: tableTools(c, "task", "task", "tasks"),
    requests: tableTools(c, "sc_request", "service request", "service requests", { write: false }),
    requestedItems: tableTools(c, "sc_req_item", "requested item", "requested items"),
    catalogTasks: tableTools(c, "sc_task", "catalog task", "catalog tasks"),
    users: tableTools(c, "sys_user", "user", "users"),
    groups: tableTools(c, "sys_user_group", "group", "groups"),
    groupMembers: tableTools(c, "sys_user_grmember", "group membership", "group memberships", { remove: true }),
    locations: tableTools(c, "cmn_location", "location", "locations"),
    companies: tableTools(c, "core_company", "company", "companies"),
    departments: tableTools(c, "cmn_department", "department", "departments"),
    configurationItems: tableTools(c, "cmdb_ci", "configuration item", "configuration items"),
    servers: tableTools(c, "cmdb_ci_server", "server CI", "server CIs"),
    knowledgeRecords: tableTools(c, "kb_knowledge", "knowledge article record", "knowledge article records"),
    changes: router(
      {
        list: q(
          `List change requests (Change Management API). ${queryHelp} Also accepts a type filter in query, e.g. type=normal.`,
          object({ query: string().optional(), fields: string().optional(), limit: number().optional(), offset: number().optional() }),
          (i) =>
            c.call("GET", change, {
              sysparm_query: i.query,
              sysparm_fields: i.fields,
              sysparm_limit: i.limit ?? 25,
              sysparm_offset: i.offset,
            }),
        ),
        get: q("Retrieve one change request by sys_id.", object({ sysId }), (i) =>
          c.call("GET", `${change}/${segment(i.sysId, "sysId")}`),
        ),
        createNormal: m("Create a normal change request. fields maps column names to values.", object({ fields: fieldsBody }), (i) =>
          c.call("POST", `${change}/normal`, {}, i.fields),
        ),
        createEmergency: m("Create an emergency change request.", object({ fields: fieldsBody }), (i) =>
          c.call("POST", `${change}/emergency`, {}, i.fields),
        ),
        createStandard: m(
          "Create a standard change request from a standard change template (templateSysId).",
          object({ templateSysId: sysId, fields: fieldsBody }),
          (i) => c.call("POST", `${change}/standard/${segment(i.templateSysId, "templateSysId")}`, {}, i.fields),
        ),
        update: m("Update a change request; only the columns in fields change.", object({ sysId, fields: fieldsBody }), (i) =>
          c.call("PATCH", `${change}/${segment(i.sysId, "sysId")}`, {}, i.fields),
        ),
        delete: m("Delete a change request.", object({ sysId }), (i) =>
          c.call("DELETE", `${change}/${segment(i.sysId, "sysId")}`),
        ),
        tasks: q("List the change tasks of a change request.", object({ sysId }), (i) =>
          c.call("GET", `${change}/${segment(i.sysId, "sysId")}/task`),
        ),
        createTask: m("Create a change task on a change request.", object({ sysId, fields: fieldsBody }), (i) =>
          c.call("POST", `${change}/${segment(i.sysId, "sysId")}/task`, {}, i.fields),
        ),
        conflict: q("Show scheduling conflicts of a change request.", object({ sysId }), (i) =>
          c.call("GET", `${change}/${segment(i.sysId, "sysId")}/conflict`),
        ),
        models: q("List change models.", object({ limit: number().optional(), offset: number().optional() }), (i) =>
          c.call("GET", `${change}/model`, { sysparm_limit: i.limit ?? 25, sysparm_offset: i.offset }),
        ),
        typeTemplates: q("List standard change templates.", object({ query: string().optional(), limit: number().optional() }), (i) =>
          c.call("GET", `${change}/standard/template`, { sysparm_query: i.query, sysparm_limit: i.limit ?? 25 }),
        ),
      },
      {
        title: "Change management",
        description: "Change requests and change tasks through the Change Management API (needs the Change Management plugin).",
      },
    ),
    catalog: router(
      {
        list: q("List the service catalogs the user can see.", object({ text: string().optional(), limit: number().optional() }), (i) =>
          c.call("GET", `${catalog}/catalogs`, { sysparm_text: i.text, sysparm_limit: i.limit ?? 25 }),
        ),
        categories: q("List categories of a catalog.", object({ catalogSysId: sysId, limit: number().optional() }), (i) =>
          c.call("GET", `${catalog}/catalogs/${segment(i.catalogSysId, "catalogSysId")}/categories`, {
            sysparm_limit: i.limit ?? 25,
          }),
        ),
        searchItems: q(
          "Search catalog items by text, optionally within a catalog or category.",
          object({
            text: string().optional(),
            catalog: string().optional(),
            category: string().optional(),
            limit: number().optional(),
            offset: number().optional(),
          }),
          (i) =>
            c.call("GET", `${catalog}/items`, {
              sysparm_text: i.text,
              sysparm_catalog: i.catalog,
              sysparm_category: i.category,
              sysparm_limit: i.limit ?? 25,
              sysparm_offset: i.offset,
            }),
        ),
        getItem: q("Retrieve a catalog item with its variables.", object({ sysId }), (i) =>
          c.call("GET", `${catalog}/items/${segment(i.sysId, "sysId")}`),
        ),
        orderNow: m(
          "Order a catalog item immediately. variables maps variable names to values.",
          object({ sysId, quantity: number().optional(), variables: record(json()).optional() }),
          (i) =>
            c.call("POST", `${catalog}/items/${segment(i.sysId, "sysId")}/order_now`, {}, {
              sysparm_quantity: i.quantity ?? 1,
              variables: i.variables ?? {},
            }),
        ),
        addToCart: m(
          "Add a catalog item to the user's cart. variables maps variable names to values.",
          object({ sysId, quantity: number().optional(), variables: record(json()).optional() }),
          (i) =>
            c.call("POST", `${catalog}/items/${segment(i.sysId, "sysId")}/add_to_cart`, {}, {
              sysparm_quantity: i.quantity ?? 1,
              variables: i.variables ?? {},
            }),
        ),
        cart: q("Retrieve the user's cart.", object({}), () => c.call("GET", `${catalog}/cart`)),
        checkout: m("Check out the user's cart.", object({}), () => c.call("POST", `${catalog}/cart/checkout`)),
        submitOrder: m("Submit the user's cart as an order.", object({}), () => c.call("POST", `${catalog}/cart/submit_order`)),
        emptyCart: m("Empty the user's cart.", object({ cartId: sysId }), (i) =>
          c.call("DELETE", `${catalog}/cart/${segment(i.cartId, "cartId")}/empty`),
        ),
      },
      { title: "Service catalog", description: "Browse the service catalog, fill the cart and order items (Service Catalog API)." },
    ),
    cmdb: router(
      {
        listInstances: q(
          "List configuration items of a CMDB class (for example cmdb_ci_linux_server).",
          object({ className: tableName, query: string().optional(), limit: number().optional(), offset: number().optional() }),
          (i) =>
            c.call("GET", `${cmdb}/${segment(i.className, "className")}`, {
              sysparm_query: i.query,
              sysparm_limit: i.limit ?? 25,
              sysparm_offset: i.offset,
            }),
        ),
        getInstance: q(
          "Retrieve a configuration item with its attributes and inbound/outbound relations.",
          object({ className: tableName, sysId }),
          (i) => c.call("GET", `${cmdb}/${segment(i.className, "className")}/${segment(i.sysId, "sysId")}`),
        ),
        createInstance: m(
          "Create a configuration item. body holds attributes, inbound_relations, outbound_relations and source, as in the CMDB Instance API.",
          object({ className: tableName, body: fieldsBody }),
          (i) => c.call("POST", `${cmdb}/${segment(i.className, "className")}`, {}, i.body),
        ),
        updateInstance: m(
          "Update attributes of a configuration item (PATCH).",
          object({ className: tableName, sysId, body: fieldsBody }),
          (i) => c.call("PATCH", `${cmdb}/${segment(i.className, "className")}/${segment(i.sysId, "sysId")}`, {}, i.body),
        ),
        addRelation: m(
          "Add inbound or outbound relations to a configuration item. body holds inbound_relations and/or outbound_relations.",
          object({ className: tableName, sysId, body: fieldsBody }),
          (i) =>
            c.call("POST", `${cmdb}/${segment(i.className, "className")}/${segment(i.sysId, "sysId")}/relation`, {}, i.body),
        ),
        deleteRelation: m(
          "Delete one relation of a configuration item.",
          object({ className: tableName, sysId, relationSysId: sysId }),
          (i) =>
            c.call(
              "DELETE",
              `${cmdb}/${segment(i.className, "className")}/${segment(i.sysId, "sysId")}/relation/${segment(i.relationSysId, "relationSysId")}`,
            ),
        ),
        classMetadata: q("Describe a CMDB class: attributes, relations and parent classes.", object({ className: tableName }), (i) =>
          c.call("GET", `/api/now/cmdb/meta/${segment(i.className, "className")}`),
        ),
      },
      { title: "CMDB", description: "Configuration items, relations and class metadata (CMDB Instance API)." },
    ),
    knowledge: router(
      {
        search: q(
          "Search knowledge articles the user can read (Knowledge Management API).",
          object({
            query: string(),
            limit: number().optional(),
            offset: number().optional(),
            knowledgeBase: string().optional(),
          }),
          (i) =>
            c.call("GET", "/api/sn_km_api/knowledge/articles", {
              query: i.query,
              limit: i.limit ?? 10,
              offset: i.offset,
              kb: i.knowledgeBase,
            }),
        ),
        get: q("Retrieve one knowledge article with its body.", object({ sysId }), (i) =>
          c.call("GET", `/api/sn_km_api/knowledge/articles/${segment(i.sysId, "sysId")}`),
        ),
        featured: q("List featured knowledge articles.", object({ limit: number().optional() }), (i) =>
          c.call("GET", "/api/sn_km_api/knowledge/articles/featured", { limit: i.limit ?? 10 }),
        ),
        mostViewed: q("List the most viewed knowledge articles.", object({ limit: number().optional() }), (i) =>
          c.call("GET", "/api/sn_km_api/knowledge/articles/most_viewed", { limit: i.limit ?? 10 }),
        ),
      },
      { title: "Knowledge", description: "Search and read knowledge articles." },
    ),
    attachments: router(
      {
        list: q(`List attachment metadata. ${queryHelp} For one record use table_name=<table>^table_sys_id=<sys_id>.`, object({ query: string().optional(), limit: number().optional(), offset: number().optional() }), (i) =>
          c.call("GET", "/api/now/attachment", {
            sysparm_query: i.query,
            sysparm_limit: i.limit ?? 25,
            sysparm_offset: i.offset,
          }),
        ),
        get: q("Retrieve one attachment's metadata.", object({ sysId }), (i) =>
          c.call("GET", `/api/now/attachment/${segment(i.sysId, "sysId")}`),
        ),
        uploadText: m(
          "Attach a text file to a record.",
          object({ table: tableName, recordSysId: sysId, fileName: string({ minLength: 1 }), content: string(), contentType: string().optional() }),
          (i) => c.upload(i),
        ),
        delete: m("Delete an attachment.", object({ sysId }), (i) =>
          c.call("DELETE", `/api/now/attachment/${segment(i.sysId, "sysId")}`),
        ),
      },
      { title: "Attachments", description: "List, add and delete record attachments." },
    ),
    importSets: m(
      "Insert one row into an import set staging table; transform maps run on it. fields maps staging-table columns to values.",
      object({ stagingTable: tableName, fields: fieldsBody }),
      (i) => c.call("POST", `/api/now/import/${segment(i.stagingTable, "stagingTable")}`, {}, i.fields),
    ),
    email: m(
      "Send an email from the instance (Email API). Recipients are arrays of addresses.",
      object({
        to: array(string()),
        cc: array(string()).optional(),
        bcc: array(string()).optional(),
        subject: string(),
        text: string().optional(),
        html: string().optional(),
        tableName: string().optional(),
        tableRecordId: string().optional(),
      }),
      (i) =>
        c.call("POST", "/api/now/email", {}, {
          to: i.to,
          cc: i.cc,
          bcc: i.bcc,
          subject: i.subject,
          text: i.text,
          html: i.html,
          table_name: i.tableName,
          table_record_id: i.tableRecordId,
        }),
    ),
    rest: m(
      "Call any other ServiceNow REST endpoint under /api/ (scripted REST APIs, Performance Analytics, Service Operations Workspace, ...). Always asks first.",
      object({
        method: string(),
        path: string(),
        query: record(json()).optional(),
        body: json().optional(),
      }),
      (i) => {
        const method = String(i.method).toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method))
          throw new Error("method must be GET, POST, PUT, PATCH or DELETE.");
        const path = String(i.path);
        if (!path.startsWith("/api/") || path.includes("..") || /[?#\\]/.test(path))
          throw new Error("path must start with /api/ and carry no query string; pass parameters in query.");
        return c.call(method as Method, path, (i.query as Params | undefined) ?? {}, i.body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { servicenow: servicenow.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.servicenow ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(build(client(instanceUrl(account.fields.instance), signed, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "ServiceNow",
        description:
          "Incidents, problems, changes, requests, the service catalog, CMDB, knowledge, users and groups, and any table through the Table API of a ServiceNow instance.",
        icons,
      },
    ),
  }),
);

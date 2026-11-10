import {
  accountRouter,
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

// Every environment has its own Dataverse host: https://<org>.crm<N>.dynamics.com.
const hostPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.crm\d*\.dynamics\.com$/;
const tenantPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[a-z0-9.-]+$/i;

// "*." matches exactly one label, so each regional suffix (crm, crm2, ...) needs its own entry.
const regionSuffixes = ["crm", ...Array.from({ length: 24 }, (_, i) => `crm${i + 2}`)];
const dataverseHosts = regionSuffixes.map((suffix) => `*.${suffix}.dynamics.com`);

const entitySetPattern = /^[a-z][a-z0-9_]*$/;
const guidPattern = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

function entitySetOf(raw: string): string {
  if (!entitySetPattern.test(raw)) throw new Error("entitySet must be a lowercase entity set name such as accounts.");
  return raw;
}

function idOf(raw: string): string {
  if (!guidPattern.test(raw)) throw new Error("id must be a GUID.");
  return raw.replace(/[{}]/g, "");
}

// A key is a GUID or one or more alternate key pairs such as accountnumber='A-1'. String values are
// percent-encoded so they cannot alter the path or query.
const keyPair = "[a-z][a-z0-9_]*=(?:'(?:[^']|'')*'|[0-9]+)";
const keyPattern = new RegExp(`^${keyPair}(?:,${keyPair})*$`, "i");

function keyOf(raw: string): string {
  if (guidPattern.test(raw)) return idOf(raw);
  if (!keyPattern.test(raw)) throw new Error("key must be a GUID or alternate key pairs such as accountnumber='A-1'.");
  return raw.replace(/'((?:[^']|'')*)'/g, (_m, v: string) => `'${encodeURIComponent(v).replace(/%27/g, "''")}'`);
}

function actionPathOf(raw: string): string {
  if (!/^[A-Za-z0-9_.]+(\([0-9a-fA-F-]{36}\))?(\/[A-Za-z0-9_.]+)?$/.test(raw))
    throw new Error("path must be an action name or entityset(<guid>)/Microsoft.Dynamics.CRM.Action.");
  return raw;
}

type Fields = { orgUrl: string; tenantId: string; clientId: string; clientSecret: string };

function hostOf(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your environment URL, for example contoso.crm.dynamics.com.");
  return host;
}

const dynamics = defineProvider({
  name: "Dynamics 365",
  hosts: ["login.microsoftonline.com", ...dataverseHosts],
  auth: {
    // The OAuth scope and the API host are both per environment ({orgUrl}/.default), which a static
    // oauth2 declaration cannot express, so the client credentials grant is performed in code
    // for a Microsoft Entra app registration that is also an Application User in the environment.
    servicePrincipal: secrets({
      label: "Entra app registration (client credentials)",
      fields: object({
        orgUrl: plain(string({ minLength: 1 })),
        tenantId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = hostOf(account.fields.orgUrl);
    const { UserId } = await decodeJson(
      await client(account.fields, fetch, signal).send("GET", "/WhoAmI"),
      object({ UserId: string() }),
    );
    return {
      accountInfo: {
        externalId: `${host}:${account.fields.clientId}`,
        displayName: host,
        username: UserId,
      },
    };
  },
});

type Fetch = typeof fetch;

async function accessToken(fetcher: Fetch, signal: AbortSignal | undefined, fields: Fields) {
  const host = hostOf(fields.orgUrl);
  const tenant = fields.tenantId.trim();
  if (!tenantPattern.test(tenant)) throw new Error("Enter the Directory (tenant) ID or tenant domain.");
  const response = await fetcher(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      scope: `https://${host}/.default`,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const host = hostOf(fields.orgUrl);
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fetcher, signal, fields);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  const send = async (
    method: Method,
    path: string,
    search: Params = {},
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ) => {
    const u = new URL(`https://${host}/api/data/v9.2${path.startsWith("/") ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, String(value));
    }
    const response = await fetcher(u.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...extraHeaders,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return response;
  };
  const call = async (
    method: Method,
    path: string,
    search: Params = {},
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ) => {
    const response = await send(method, path, search, body, extraHeaders);
    if (response.status === 204) {
      // Creates answer 204 with the new record's URL in OData-EntityId.
      const created = response.headers.get("OData-EntityId");
      return created === null ? null : { entityId: created };
    }
    if (response.ok) {
      const text = await response.text();
      return text === "" ? null : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
  return { call, send };
}

type Client = ReturnType<typeof client>;

const odata = {
  select: string().optional(),
  filter: string().optional(),
  orderby: string().optional(),
  expand: string().optional(),
  top: number().optional(),
};
const odataDoc =
  "select is a comma-separated column list (accountid,name), filter an OData $filter (statecode eq 0 and contains(name,'Contoso')), orderby e.g. 'createdon desc', expand a navigation property, top the page size (default and maximum 5000; follow @odata.nextLink-style paging by filtering on the last key). Column names are lowercase logical names.";

function listParams(input: { select?: string; filter?: string; orderby?: string; expand?: string; top?: number }) {
  return {
    $select: input.select,
    $filter: input.filter,
    $orderby: input.orderby,
    $expand: input.expand,
    $top: input.top,
  };
}

const tables = {
  accounts: ["accounts", "Accounts", "account"],
  contacts: ["contacts", "Contacts", "contact"],
  leads: ["leads", "Leads", "lead"],
  opportunities: ["opportunities", "Opportunities", "opportunity"],
  cases: ["incidents", "Cases", "case"],
  quotes: ["quotes", "Quotes", "quote"],
  salesOrders: ["salesorders", "Sales orders", "sales order"],
  invoices: ["invoices", "Invoices", "invoice"],
  products: ["products", "Products", "product"],
  campaigns: ["campaigns", "Campaigns", "campaign"],
  tasks: ["tasks", "Tasks", "task"],
  appointments: ["appointments", "Appointments", "appointment"],
  phoneCalls: ["phonecalls", "Phone calls", "phone call"],
  emails: ["emails", "Emails", "email"],
  notes: ["annotations", "Notes", "note (annotation)"],
  users: ["systemusers", "Users", "user"],
  teams: ["teams", "Teams", "team"],
  businessUnits: ["businessunits", "Business units", "business unit"],
} as const;

function tableRouter(c: Client, set: string, label: string, noun: string) {
  const key = set;
  return router(
    {
      list: query(
        {
          description: `List rows of ${label} (GET /${key}). ${odataDoc}`,
          input: object(odata),
        },
        async (_ctx, input) => c.call("GET", `/${key}`, listParams(input), undefined, { Prefer: "odata.include-annotations=OData.Community.Display.V1.FormattedValue" }),
      ),
      get: query(
        {
          description: `Retrieve a ${noun} by its GUID (GET /${key}({id})).`,
          input: object({ id: string({ minLength: 1 }), select: odata.select, expand: odata.expand }),
        },
        async (_ctx, input) =>
          c.call("GET", `/${key}(${idOf(input.id)})`, { $select: input.select, $expand: input.expand }),
      ),
      create: mutation(
        {
          description: `Create a ${noun} (POST /${key}). data holds logical column names; bind lookups with "<navigationproperty>@odata.bind": "/<entityset>(<guid>)". Returns the new record's URL (entityId).`,
          input: object({ data: record(json()) }),
        },
        async (_ctx, input) => c.call("POST", `/${key}`, {}, input.data),
      ),
      update: mutation(
        {
          description: `Update a ${noun} by GUID (PATCH /${key}({id})). Only the given columns change; the record must exist.`,
          input: object({ id: string({ minLength: 1 }), data: record(json()) }),
        },
        async (_ctx, input) =>
          c.call("PATCH", `/${key}(${idOf(input.id)})`, {}, input.data, { "If-Match": "*" }),
      ),
      delete: mutation(
        {
          description: `Delete a ${noun} by GUID (DELETE /${key}({id})). Irreversible.`,
          input: object({ id: string({ minLength: 1 }) }),
        },
        async (_ctx, input) => c.call("DELETE", `/${key}(${idOf(input.id)})`),
      ),
    },
    { title: label, description: `${label} (${key}) in Dataverse.` },
  );
}

function build(c: Client) {
  const entitySet = string({ minLength: 1 });
  const es = (v: string) => entitySetOf(v);
  return router({
    whoAmI: query(
      { description: "Return the user id, business unit id and organization id the app registration acts as (GET /WhoAmI).", input: object({}) },
      async () => c.call("GET", "/WhoAmI"),
    ),
    ...Object.fromEntries(
      Object.entries(tables).map(([name, [set, label, noun]]) => [name, tableRouter(c, set, label, noun)]),
    ),
    metadata: router(
      {
        listTables: query(
          {
            description:
              "List table definitions (GET /EntityDefinitions): logical name, entity set name and primary id/name columns. Use it to find the entity set name for records.* calls. filter is an OData $filter such as IsCustomEntity eq true.",
            input: object({ filter: string().optional() }),
          },
          async (_ctx, input) =>
            c.call("GET", "/EntityDefinitions", {
              $select: "LogicalName,EntitySetName,DisplayName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity",
              $filter: input.filter,
            }),
        ),
        listColumns: query(
          {
            description:
              "List the columns of a table (GET /EntityDefinitions(LogicalName='x')/Attributes) with logical name, type and required level.",
            input: object({ table: string({ minLength: 1 }) }),
          },
          async (_ctx, input) =>
            c.call("GET", `/EntityDefinitions(LogicalName='${input.table.replace(/'/g, "''")}')/Attributes`, {
              $select: "LogicalName,AttributeType,RequiredLevel,IsPrimaryId,IsPrimaryName",
            }),
        ),
      },
      { title: "Metadata", description: "Discover tables and columns, including custom ones." },
    ),
    records: router(
      {
        list: query(
          {
            description: `List rows of any table by entity set name (GET /{entitySet}). ${odataDoc}`,
            input: object({ entitySet, ...odata }),
          },
          async (_ctx, input) => c.call("GET", `/${es(input.entitySet)}`, listParams(input)),
        ),
        get: query(
          {
            description: "Retrieve one row of any table by entity set name and GUID.",
            input: object({ entitySet, id: string({ minLength: 1 }), select: odata.select, expand: odata.expand }),
          },
          async (_ctx, input) =>
            c.call("GET", `/${es(input.entitySet)}(${idOf(input.id)})`, {
              $select: input.select,
              $expand: input.expand,
            }),
        ),
        fetchXml: query(
          {
            description:
              "Run a FetchXML query (GET /{entitySet}?fetchXml=...) for joins and aggregates that OData filters cannot express.",
            input: object({ entitySet, fetchXml: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("GET", `/${es(input.entitySet)}`, { fetchXml: input.fetchXml }),
        ),
        create: mutation(
          {
            description: "Create a row in any table (POST /{entitySet}). Returns the new row's URL (entityId).",
            input: object({ entitySet, data: record(json()) }),
          },
          async (_ctx, input) => c.call("POST", `/${es(input.entitySet)}`, {}, input.data),
        ),
        update: mutation(
          {
            description: "Update a row of any table by GUID (PATCH); only the given columns change.",
            input: object({ entitySet, id: string({ minLength: 1 }), data: record(json()) }),
          },
          async (_ctx, input) =>
            c.call("PATCH", `/${es(input.entitySet)}(${idOf(input.id)})`, {}, input.data, {
              "If-Match": "*",
            }),
        ),
        upsert: mutation(
          {
            description:
              "Create or update a row by GUID or alternate key, e.g. key \"accountnumber='A-1'\" (PATCH without If-Match).",
            input: object({ entitySet, key: string({ minLength: 1 }), data: record(json()) }),
          },
          async (_ctx, input) => c.call("PATCH", `/${es(input.entitySet)}(${keyOf(input.key)})`, {}, input.data),
        ),
        delete: mutation(
          {
            description: "Delete a row of any table by GUID. Irreversible.",
            input: object({ entitySet, id: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("DELETE", `/${es(input.entitySet)}(${idOf(input.id)})`),
        ),
      },
      { title: "Any table", description: "Rows of any Dataverse table, including custom ones, by entity set name." },
    ),
    actions: router(
      {
        invoke: mutation(
          {
            description:
              "Call an unbound Dataverse action (POST /{name}), such as QualifyLead-style custom actions or WinOpportunity. Bound actions use the Microsoft.Dynamics.CRM namespace in path, e.g. leads(<guid>)/Microsoft.Dynamics.CRM.QualifyLead.",
            input: object({ path: string({ minLength: 1 }), body: record(json()).optional() }),
          },
          async (_ctx, input) => c.call("POST", `/${actionPathOf(input.path)}`, {}, input.body ?? {}),
        ),
      },
      { title: "Actions", description: "Invoke Dataverse actions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { dynamics: dynamics.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dynamics ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dynamics 365",
        description:
          "Dynamics 365 Sales, Customer Service and other Dataverse apps: accounts, contacts, leads, opportunities, cases, quotes, activities, users and any table, plus metadata and FetchXML.",
        instructions:
          "Backed by the Dataverse Web API (v9.2) of one environment. Entity set names are plural logical names (accounts, incidents). Use metadata.listTables to find custom tables. The app registration acts as an Application User, so results depend on that user's security roles; a 403 means a missing privilege.",
        icons,
      },
    ),
  }),
);

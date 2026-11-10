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
  raw,
  record,
  router,
  type Schema,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every NetSuite account lives on its own host: https://<account-id>.suitetalk.api.netsuite.com.
// Sandbox ids such as 1234567_SB1 become 1234567-sb1 in the host name and stay 1234567_SB1 in the OAuth realm.
const accountPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const accountId = (value: string) => {
  const id = value.trim();
  if (!accountPattern.test(id))
    throw new Error("Enter the NetSuite account ID (letters, digits, \"_\" and \"-\"), e.g. 1234567 or 1234567_SB1.");
  return id;
};
const restBase = (account: string) =>
  `https://${accountId(account).toLowerCase().replaceAll("_", "-")}.suitetalk.api.netsuite.com/services/rest`;
const realmOf = (account: string) => accountId(account).toUpperCase().replaceAll("-", "_");

const netsuite = defineProvider({
  name: "NetSuite",
  hosts: ["*.suitetalk.api.netsuite.com"],
  auth: {
    // Token-based authentication (OAuth 1.0a, HMAC-SHA256). OAuth 2.0 is not declared (framework gap, see README): NetSuite's authorize and
    // token endpoints are per-account hosts and the framework only takes static endpoint strings. The four
    // credentials are raw because every request has to be signed with them.
    tba: secrets({
      label: "Token-based authentication",
      fields: object({
        accountId: plain(string({ minLength: 1 })),
        consumerKey: raw(string({ minLength: 1 })),
        consumerSecret: raw(string({ minLength: 1 })),
        tokenId: raw(string({ minLength: 1 })),
        tokenSecret: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const c = client(account.fields, fetch, signal);
    // Read-only: one row of the currency list, which every REST-enabled role can see.
    await c.call("POST", "/query/v1/suiteql", { limit: 1 }, { q: "SELECT id FROM currency" }, { Prefer: "transient" });
    return {
      accountInfo: {
        externalId: realmOf(account.fields.accountId),
        displayName: `NetSuite ${realmOf(account.fields.accountId)}`,
      },
    };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;
type Creds = {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
};

// RFC 3986 percent-encoding, as OAuth 1.0a signing requires.
const enc = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

async function authorization(method: string, base: string, pairs: [string, string][], creds: Creds) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const oauth: [string, string][] = [
    ["oauth_consumer_key", creds.consumerKey],
    ["oauth_nonce", Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")],
    ["oauth_signature_method", "HMAC-SHA256"],
    ["oauth_timestamp", String(Math.floor(Date.now() / 1000))],
    ["oauth_token", creds.tokenId],
    ["oauth_version", "1.0"],
  ];
  const normalized = [...pairs, ...oauth]
    .map(([k, v]) => [enc(k), enc(v)] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const baseString = `${method}&${enc(base)}&${enc(normalized)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${enc(creds.consumerSecret)}&${enc(creds.tokenSecret)}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(baseString)));
  const header = [
    ["realm", realmOf(creds.accountId)],
    ...oauth,
    ["oauth_signature", btoa(String.fromCharCode(...signature))],
  ]
    .map(([k, v]) => `${k}="${enc(v!)}"`)
    .join(", ");
  return `OAuth ${header}`;
}

const safeType = /^[A-Za-z][A-Za-z0-9_]*$/;
const recordType = (value: unknown) => {
  const text = String(value);
  if (!safeType.test(text))
    throw new Error('recordType must be a NetSuite record id such as "customer" or "customrecord_myrecord".');
  return text;
};
const safeId = /^[A-Za-z0-9_.-]+$/;
const segment = (value: unknown, label: string) => {
  const text = String(value);
  if (!safeId.test(text)) throw new Error(`${label} must contain only letters, digits, "_", "." and "-".`);
  return encodeURIComponent(text);
};
// A record is addressed by internal id or, with externalId, by its external id (eid:<value>).
const target = (i: Params) =>
  typeof i.externalId === "string" && i.externalId !== ""
    ? `eid:${segment(i.externalId, "externalId")}`
    : segment(i.id, "id");

function client(creds: Creds, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = restBase(creds.accountId);
  const call = async (
    method: Method,
    path: string,
    search: Params = {},
    body?: unknown,
    extra: Record<string, string> = {},
  ) => {
    const pairs: [string, string][] = [];
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      pairs.push([key, typeof value === "object" ? JSON.stringify(value) : String(value)]);
    }
    const url = `${base}${path}${pairs.length === 0 ? "" : `?${pairs.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&")}`}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        Authorization: await authorization(method, `${base}${path}`, pairs, creds),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) {
      const location = response.headers.get("location");
      return { ok: true, ...(location === null ? {} : { location }) };
    }
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const recordTypeField = string({ minLength: 1 });
const idField = string({ minLength: 1 });
const fieldsBody = record(json());

const listParams = {
  q: string().optional(),
  limit: number().optional(),
  offset: number().optional(),
};
const getParams = {
  fields: string().optional(),
  expandSubResources: boolean().optional(),
  simpleEnumFormat: boolean().optional(),
};
const listSearch = (i: Params): Params => ({ q: i.q, limit: i.limit ?? 100, offset: i.offset });
const getSearch = (i: Params): Params => ({
  fields: i.fields,
  expandSubResources: i.expandSubResources,
  simpleEnumFormat: i.simpleEnumFormat,
});
const writeSearch = (i: Params): Params => ({ replace: i.replace, replaceSelectedFields: i.replaceSelectedFields });

const filterHelp =
  'q is a filter expression such as: email IS "a@example.com" AND companyName CONTAIN "Acme" (operators: IS, IS_NOT, CONTAIN, EQUAL, GREATER, LESS, ANY_OF, EMPTY, AND, OR, NOT). limit defaults to 100 (maximum 1000); page with offset. The result lists links, not full records: call get for each id.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema<any, boolean>;
const q = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  query({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));
const m = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  mutation({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));

const idParams = { id: idField.optional(), externalId: string().optional() };
const idHelp = "Identify the record by id (internal id) or by externalId.";

// CRUD tools over one fixed record type of the REST Record API.
function recordTools(c: Client, type: string, noun: string, plural: string) {
  const path = `/record/v1/${type}`;
  const need = (i: Params) => {
    if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
    return `${path}/${target(i)}`;
  };
  return router(
    {
      list: q(`List ${plural} (record ${type}). ${filterHelp}`, object(listParams), (i) =>
        c.call("GET", path, listSearch(i)),
      ),
      get: q(`Retrieve one ${noun}. ${idHelp}`, object({ ...idParams, ...getParams }), (i) =>
        c.call("GET", need(i), getSearch(i)),
      ),
      create: m(
        `Create a ${noun}. fields is the record body as in the REST Record API (field ids as keys; sublists such as item: { items: [...] }). Returns the new record's location.`,
        object({ fields: fieldsBody }),
        (i) => c.call("POST", path, {}, i.fields),
      ),
      update: m(
        `Update a ${noun}; only the fields given change. ${idHelp}`,
        object({ ...idParams, fields: fieldsBody }),
        (i) => c.call("PATCH", need(i), {}, i.fields),
      ),
      delete: m(`Delete a ${noun}. ${idHelp}`, object(idParams), (i) => c.call("DELETE", need(i))),
    },
    { title: plural[0]!.toUpperCase() + plural.slice(1), description: `${plural} (record ${type}).` },
  );
}

const typed: readonly (readonly [key: string, type: string, noun: string, plural: string])[] = [
  ["customers", "customer", "customer", "customers"],
  ["vendors", "vendor", "vendor", "vendors"],
  ["contacts", "contact", "contact", "contacts"],
  ["employees", "employee", "employee", "employees"],
  ["partners", "partner", "partner", "partners"],
  ["salesOrders", "salesOrder", "sales order", "sales orders"],
  ["invoices", "invoice", "invoice", "invoices"],
  ["estimates", "estimate", "estimate (quote)", "estimates"],
  ["cashSales", "cashSale", "cash sale", "cash sales"],
  ["creditMemos", "creditMemo", "credit memo", "credit memos"],
  ["customerPayments", "customerPayment", "customer payment", "customer payments"],
  ["returnAuthorizations", "returnAuthorization", "return authorization", "return authorizations"],
  ["itemFulfillments", "itemFulfillment", "item fulfillment", "item fulfillments"],
  ["purchaseOrders", "purchaseOrder", "purchase order", "purchase orders"],
  ["vendorBills", "vendorBill", "vendor bill", "vendor bills"],
  ["vendorPayments", "vendorPayment", "vendor payment", "vendor payments"],
  ["vendorCredits", "vendorCredit", "vendor credit", "vendor credits"],
  ["itemReceipts", "itemReceipt", "item receipt", "item receipts"],
  ["expenseReports", "expenseReport", "expense report", "expense reports"],
  ["journalEntries", "journalEntry", "journal entry", "journal entries"],
  ["inventoryItems", "inventoryItem", "inventory item", "inventory items"],
  ["opportunities", "opportunity", "opportunity", "opportunities"],
  ["supportCases", "supportCase", "support case", "support cases"],
  ["tasks", "task", "task", "tasks"],
  ["projects", "job", "project (job)", "projects"],
  ["accounts", "account", "general ledger account", "accounts"],
  ["subsidiaries", "subsidiary", "subsidiary", "subsidiaries"],
  ["departments", "department", "department", "departments"],
  ["classifications", "classification", "class", "classes"],
  ["locations", "location", "location", "locations"],
  ["currencies", "currency", "currency", "currencies"],
];

function build(c: Client) {
  return router({
    suiteql: q(
      "Run a SuiteQL query (read-only SQL over NetSuite's analytics data source), e.g. SELECT id, companyName, email FROM customer WHERE isInactive = 'F'. Use ? placeholders with the params array for bound values, e.g. q 'SELECT id FROM customer WHERE email = ?' with params ['a@example.com']. limit is the page size (default 100, maximum 1000); page with offset. Returns items as plain rows, with count, hasMore and totalResults.",
      object({
        q: string({ minLength: 1 }),
        params: array(json()).optional(),
        limit: number().optional(),
        offset: number().optional(),
      }),
      (i) =>
        c.call(
          "POST",
          "/query/v1/suiteql",
          { limit: i.limit ?? 100, offset: i.offset },
          { q: i.q, ...(i.params === undefined ? {} : { params: i.params }) },
          { Prefer: "transient" },
        ),
    ),
    records: router(
      {
        list: q(
          `List records of any record type, including custom records (customrecord_...). ${filterHelp}`,
          object({ recordType: recordTypeField, ...listParams }),
          (i) => c.call("GET", `/record/v1/${recordType(i.recordType)}`, listSearch(i)),
        ),
        get: q(
          `Retrieve one record of any record type. ${idHelp}`,
          object({ recordType: recordTypeField, ...idParams, ...getParams }),
          (i) => {
            if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
            return c.call("GET", `/record/v1/${recordType(i.recordType)}/${target(i)}`, getSearch(i));
          },
        ),
        create: m(
          "Create a record of any record type. fields is the record body; subrecord and sublist shapes follow the record's schema from records.metadata. Returns the new record's location.",
          object({ recordType: recordTypeField, fields: fieldsBody }),
          (i) => c.call("POST", `/record/v1/${recordType(i.recordType)}`, {}, i.fields),
        ),
        update: m(
          `Update a record; only the fields given change. ${idHelp} replace names sublists to replace wholesale instead of merging (comma-separated).`,
          object({
            recordType: recordTypeField,
            ...idParams,
            fields: fieldsBody,
            replace: string().optional(),
            replaceSelectedFields: string().optional(),
          }),
          (i) => {
            if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
            return c.call("PATCH", `/record/v1/${recordType(i.recordType)}/${target(i)}`, writeSearch(i), i.fields);
          },
        ),
        upsert: m(
          "Create or replace a record addressed by external id (PUT /record/v1/<type>/eid:<externalId>).",
          object({ recordType: recordTypeField, externalId: string({ minLength: 1 }), fields: fieldsBody }),
          (i) =>
            c.call(
              "PUT",
              `/record/v1/${recordType(i.recordType)}/eid:${segment(i.externalId, "externalId")}`,
              {},
              i.fields,
            ),
        ),
        delete: m(
          `Delete a record of any record type. ${idHelp}`,
          object({ recordType: recordTypeField, ...idParams }),
          (i) => {
            if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
            return c.call("DELETE", `/record/v1/${recordType(i.recordType)}/${target(i)}`);
          },
        ),
        sublist: q(
          "Read one sublist of a record, e.g. recordType salesOrder, sublist item. Returns the sublist's lines.",
          object({
            recordType: recordTypeField,
            ...idParams,
            sublist: string({ minLength: 1 }),
            expandSubResources: boolean().optional(),
          }),
          (i) => {
            if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
            return c.call(
              "GET",
              `/record/v1/${recordType(i.recordType)}/${target(i)}/${recordType(i.sublist)}`,
              { expandSubResources: i.expandSubResources },
            );
          },
        ),
        transform: m(
          "Create one record from another (REST !transform), e.g. recordType salesOrder with target itemFulfillment or invoice, purchaseOrder to itemReceipt or vendorBill, customer to cashSale. fields optionally overrides fields of the new record. Returns its location.",
          object({
            recordType: recordTypeField,
            ...idParams,
            target: string({ minLength: 1 }),
            fields: fieldsBody.optional(),
          }),
          (i) => {
            if (i.id === undefined && i.externalId === undefined) throw new Error("Pass id or externalId.");
            return c.call(
              "POST",
              `/record/v1/${recordType(i.recordType)}/${target(i)}/!transform/${recordType(i.target)}`,
              {},
              i.fields ?? {},
            );
          },
        ),
        metadata: q(
          "Describe records. Without recordType, lists every record type the role can reach (select narrows it to a comma-separated list of record ids). With recordType, returns the record's schema as OpenAPI 3 (fields, sublists, subrecords) so you know the body create and update expect.",
          object({ recordType: string().optional(), select: string().optional() }),
          (i) =>
            typeof i.recordType === "string" && i.recordType !== ""
              ? c.call("GET", `/record/v1/metadata-catalog/${recordType(i.recordType)}`, {}, undefined, {
                  Accept: "application/schema+json",
                })
              : c.call("GET", "/record/v1/metadata-catalog", { select: i.select }),
        ),
      },
      { title: "Records", description: "Any NetSuite record type, custom records included, through the REST Record API." },
    ),
    ...Object.fromEntries(typed.map(([key, type, noun, plural]) => [key, recordTools(c, type, noun, plural)])),
    rest: m(
      "Call any other SuiteTalk REST endpoint under /services/rest/ (for example /record/v1/<type>/<id>/!action/<name>, or /record/v1/<type>/{id}/<sublist>/<line>). Always asks first.",
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
        if (!path.startsWith("/") || path.includes("..") || /[?#\\]/.test(path))
          throw new Error("path must start with / (relative to /services/rest) and carry no query string; pass parameters in query.");
        return c.call(method as Method, path, (i.query as Params | undefined) ?? {}, i.body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { netsuite: netsuite.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.netsuite ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "NetSuite",
        description:
          "Customers, vendors, sales and purchase transactions, items, employees, the general ledger, SuiteQL queries and any record type, custom records included, in a NetSuite account.",
        icons,
      },
    ),
  }),
);

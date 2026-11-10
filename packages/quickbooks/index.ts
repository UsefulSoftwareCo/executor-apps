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
  router,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const hosts = {
  oauth: { api: "https://quickbooks.api.intuit.com", identity: "https://accounts.platform.intuit.com" },
  sandbox: { api: "https://sandbox-quickbooks.api.intuit.com", identity: "https://sandbox-accounts.platform.intuit.com" },
} as const;

// Intuit's OAuth 2.0 endpoints are the same for production and sandbox apps; the API and userinfo hosts differ.
// Intuit publishes OIDC discovery documents (developer.api.intuit.com/.well-known/openid_configuration), not
// RFC 8414 metadata, so the endpoints are declared to match them.
const signIn = () =>
  oauth2({
    authorizationUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    tokenEndpointAuthMethod: "client_secret_basic",
    scopes: ["com.intuit.quickbooks.accounting", "openid", "profile", "email"],
  });

type Account = { method: "oauth" | "sandbox"; fields: { access_token: string } };

const minorVersion = "75";

const UserInfo = object({ sub: string() });

const quickbooks = defineProvider({
  name: "QuickBooks",
  hosts: [
    "quickbooks.api.intuit.com",
    "sandbox-quickbooks.api.intuit.com",
    "accounts.platform.intuit.com",
    "sandbox-accounts.platform.intuit.com",
  ],
  auth: { oauth: signIn(), sandbox: signIn() },
  // The OpenID userinfo endpoint is the only call that needs no company (realm) id.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${hosts[account.method].identity}/v1/openid_connect/userinfo`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const info = await decodeJson(response, UserInfo);
    return { accountInfo: { externalId: info.sub } };
  },
});

// [name, type, required, where]; path parameters come from {braces} in the path and are always required.
type Type = "string" | "number" | "json";
type Where = "path" | "query" | "body";
type Field = [name: string, type: Type, required: boolean, where: Where];

const realm: Field = ["realmId", "string", true, "path"];
const s = (name: string, where: "query" | "body" = "query", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "query", required = false): Field => [name, "number", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

interface Row {
  group: string;
  action: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  fields: Field[];
  // Fixed query parameters, e.g. operation=delete.
  fixed?: Record<string, string>;
  // Sets sparse: true on the body unless the caller chose otherwise.
  sparse?: boolean;
  // Sends the empty octet-stream body QuickBooks expects for send-by-email.
  empty?: boolean;
  // Builds a SQL-like query statement from the input.
  statement?: string;
}

interface Entity {
  // The API name: path segment is its lowercase form, query statements use it as is.
  name: string;
  key: string;
  label: string;
  create?: boolean;
  get?: boolean;
  update?: boolean;
  del?: boolean;
  void?: "operation" | "include";
  send?: boolean;
  sparse?: boolean;
  note?: string;
}

const all = { create: true, get: true, update: true, sparse: true } as const;

const entities: Entity[] = [
  { name: "Account", key: "account", label: "chart-of-accounts account", ...all, note: "Accounts cannot be deleted; update with Active false to deactivate." },
  { name: "Attachable", key: "attachable", label: "attachment note or file reference", ...all, del: true },
  { name: "Bill", key: "bill", label: "vendor bill", ...all, del: true },
  { name: "BillPayment", key: "billPayment", label: "bill payment", ...all, del: true, void: "include" },
  { name: "Budget", key: "budget", label: "budget", get: true },
  { name: "Class", key: "class", label: "class", ...all },
  { name: "CompanyCurrency", key: "companyCurrency", label: "multicurrency company currency", create: true, get: true, update: true },
  { name: "CreditMemo", key: "creditMemo", label: "credit memo", ...all, del: true, send: true },
  { name: "Customer", key: "customer", label: "customer", ...all, note: "Customers cannot be deleted; update with Active false to deactivate." },
  { name: "Department", key: "department", label: "department (location)", ...all },
  { name: "Deposit", key: "deposit", label: "bank deposit", ...all, del: true },
  { name: "Employee", key: "employee", label: "employee", ...all },
  { name: "Estimate", key: "estimate", label: "estimate (quote)", ...all, del: true, send: true },
  { name: "Invoice", key: "invoice", label: "invoice", ...all, del: true, void: "operation", send: true },
  { name: "Item", key: "item", label: "product or service item", ...all },
  { name: "JournalEntry", key: "journalEntry", label: "journal entry", ...all, del: true },
  { name: "Payment", key: "payment", label: "customer payment", ...all, del: true, void: "include" },
  { name: "PaymentMethod", key: "paymentMethod", label: "payment method", ...all },
  { name: "Purchase", key: "purchase", label: "expense, check or credit card purchase", ...all, del: true },
  { name: "PurchaseOrder", key: "purchaseOrder", label: "purchase order", ...all, del: true, send: true },
  { name: "RefundReceipt", key: "refundReceipt", label: "refund receipt", ...all, del: true, send: true },
  { name: "SalesReceipt", key: "salesReceipt", label: "sales receipt", ...all, del: true, void: "operation", send: true },
  { name: "TaxAgency", key: "taxAgency", label: "tax agency", create: true, get: true },
  { name: "TaxCode", key: "taxCode", label: "tax code", get: true },
  { name: "TaxRate", key: "taxRate", label: "tax rate", get: true },
  { name: "Term", key: "term", label: "payment term", ...all },
  { name: "TimeActivity", key: "timeActivity", label: "time entry", create: true, get: true, update: true, sparse: true, del: true },
  { name: "Transfer", key: "transfer", label: "transfer between accounts", ...all, del: true },
  { name: "Vendor", key: "vendor", label: "vendor", ...all, note: "Vendors cannot be deleted; update with Active false to deactivate." },
  { name: "VendorCredit", key: "vendorCredit", label: "vendor credit", ...all, del: true },
];

const rows: Row[] = [];

for (const e of entities) {
  const path = `/${e.name.toLowerCase()}`;
  const note = e.note === undefined ? "" : ` ${e.note}`;
  rows.push({
    group: e.key,
    action: "list",
    method: "GET",
    path: "/query",
    statement: e.name,
    description: `List ${e.label}s with a QuickBooks query. where is the clause after WHERE (for example "Active = true AND MetaData.LastUpdatedTime > '2024-01-01'"); orderBy is the clause after ORDERBY. Pages hold up to 1000 rows (maxResults), starting at startPosition (1-based).`,
    fields: [realm, s("where"), s("orderBy"), n("startPosition"), n("maxResults")],
  });
  if (e.get) {
    rows.push({ group: e.key, action: "get", method: "GET", path: `${path}/{id}`, description: `Retrieve a ${e.label} by id.`, fields: [realm, ["id", "string", true, "path"]] });
  }
  if (e.create) {
    rows.push({
      group: e.key,
      action: "create",
      method: "POST",
      path,
      description: `Create a ${e.label}. body is the ${e.name} object as documented at https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/${e.name.toLowerCase()}.${note}`,
      fields: [realm, j("body", "body", true)],
    });
  }
  if (e.update) {
    rows.push({
      group: e.key,
      action: "update",
      method: "POST",
      path,
      sparse: e.sparse === true,
      description: `Update a ${e.label}. body must include Id and the latest SyncToken (read the object first).${
        e.sparse === true
          ? " The update is sparse by default: only the fields in body change. Send sparse: false for a full replacement that drops omitted fields."
          : " This is a full update: fields omitted from body are reset."
      }${note}`,
      fields: [realm, j("body", "body", true)],
    });
  }
  if (e.del) {
    rows.push({
      group: e.key,
      action: "delete",
      method: "POST",
      path,
      fixed: { operation: "delete" },
      description: `Permanently delete a ${e.label}. Pass its Id and latest SyncToken.`,
      fields: [realm, ["Id", "string", true, "body"], ["SyncToken", "string", true, "body"]],
    });
  }
  if (e.void !== undefined) {
    rows.push({
      group: e.key,
      action: "void",
      method: "POST",
      path,
      fixed: e.void === "operation" ? { operation: "void" } : { operation: "update", include: "void" },
      description: `Void a ${e.label}, keeping the record with a zero amount. Pass its Id and latest SyncToken${e.void === "include" ? " (sparse: true is sent)" : ""}.`,
      fields: [realm, ["Id", "string", true, "body"], ["SyncToken", "string", true, "body"]],
      ...(e.void === "include" ? { sparse: true } : {}),
    });
  }
  if (e.send) {
    rows.push({
      group: e.key,
      action: "send",
      method: "POST",
      path: `${path}/{id}/send`,
      empty: true,
      description: `Email a ${e.label} to the customer or vendor. sendTo overrides the address stored on the record.`,
      fields: [realm, ["id", "string", true, "path"], s("sendTo")],
    });
  }
}

// Reports: GET /reports/{name}. Each report accepts a subset of these parameters; QuickBooks ignores the rest.
const reportParams = [
  s("start_date"), s("end_date"), s("date_macro"), s("accounting_method"), s("summarize_column_by"),
  s("customer"), s("vendor"), s("employee"), s("item"), s("class"), s("department"), s("account"),
  s("account_type"), s("aging_method"), s("report_date"), s("past_due"), s("num_periods"), s("columns"),
  s("sort_by"), s("sort_order"), s("group_by"), s("adjusted_gain_loss"), s("add_due_date"),
];

const reports: [name: string, description: string][] = [
  ["AccountList", "Chart of accounts with balances."],
  ["APAgingDetail", "Accounts payable aging detail."],
  ["APAgingSummary", "Accounts payable aging summary by vendor."],
  ["ARAgingDetail", "Accounts receivable aging detail."],
  ["ARAgingSummary", "Accounts receivable aging summary by customer."],
  ["BalanceSheet", "Balance sheet."],
  ["CashFlow", "Statement of cash flows."],
  ["ClassSales", "Sales by class."],
  ["CustomerBalance", "Customer balance summary."],
  ["CustomerBalanceDetail", "Customer balance detail."],
  ["CustomerIncome", "Income by customer."],
  ["CustomerSales", "Sales by customer."],
  ["DepartmentSales", "Sales by department."],
  ["GeneralLedger", "General ledger."],
  ["InventoryValuationDetail", "Inventory valuation detail."],
  ["InventoryValuationSummary", "Inventory valuation summary."],
  ["ItemSales", "Sales by product or service."],
  ["JournalReport", "Journal."],
  ["ProfitAndLoss", "Profit and loss statement."],
  ["ProfitAndLossDetail", "Profit and loss detail."],
  ["TaxSummary", "Tax summary."],
  ["TransactionList", "Transaction list by date."],
  ["TrialBalance", "Trial balance."],
  ["VendorBalance", "Vendor balance summary."],
  ["VendorBalanceDetail", "Vendor balance detail."],
  ["VendorExpenses", "Expenses by vendor."],
];
for (const [name, description] of reports) {
  rows.push({
    group: "reports",
    action: name.charAt(0).toLowerCase() + name.slice(1),
    method: "GET",
    path: `/reports/${name}`,
    description: `${description} Dates are YYYY-MM-DD; date_macro (for example "This Fiscal Year-to-date") replaces start_date and end_date; accounting_method is Cash or Accrual. Parameters a report does not support are ignored.`,
    fields: [realm, ...reportParams],
  });
}

rows.push(
  { group: "company", action: "info", method: "GET", path: "/companyinfo/{realmId}", description: "The company's name, legal name, address, fiscal year start and country.", fields: [realm] },
  { group: "preferences", action: "get", method: "GET", path: "/preferences", description: "Company preferences: accounting, sales form, tax, currency, email and time tracking settings.", fields: [realm] },
  { group: "preferences", action: "update", method: "POST", path: "/preferences", description: "Update company preferences. body is the full Preferences object with Id and the latest SyncToken; omitted sections are reset.", fields: [realm, j("body", "body", true)] },
  { group: "exchangeRate", action: "get", method: "GET", path: "/exchangerate", description: "The exchange rate from sourcecurrencycode to the home currency, optionally on asofdate (YYYY-MM-DD). Needs multicurrency.", fields: [realm, s("sourcecurrencycode", "query", true), s("asofdate")] },
  { group: "exchangeRate", action: "update", method: "POST", path: "/exchangerate", description: "Set the exchange rate for a currency. body has SourceCurrencyCode, Rate and AsOfDate, and the latest SyncToken when changing an existing rate.", fields: [realm, j("body", "body", true)] },
  { group: "taxService", action: "createTaxCode", method: "POST", path: "/taxservice/taxcode", description: "Create a tax code with its tax rates. body has TaxCode, TaxRateDetails (RateValue, TaxApplicableOn, TaxRateName, TaxAgencyId) and optionally TaxAgencyId.", fields: [realm, j("body", "body", true)] },
  { group: "batch", action: "run", method: "POST", path: "/batch", description: "Run up to 30 operations in one request. body is { BatchItemRequest: [{ bId, operation: create|update|delete|query, <Entity>: {...} | Query: \"select ...\" }] }.", fields: [realm, j("body", "body", true)] },
  { group: "changes", action: "since", method: "GET", path: "/cdc", description: "Change data capture: entities created, updated or deleted since a time. entities is a comma-separated list such as \"Invoice,Customer\"; changedSince is an ISO 8601 time at most 30 days back.", fields: [realm, s("entities", "query", true), s("changedSince", "query", true)] },
  { group: "query", action: "run", method: "GET", path: "/query", statement: "", description: "Run a raw QuickBooks query such as \"select count(*) from Invoice where Balance > '0'\" or \"select * from Customer startposition 1 maxresults 50\". Supports one entity, no joins.", fields: [realm, s("statement", "query", true)] },
);

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function statementFor(entity: string, input: Record<string, unknown>): string {
  let statement = `select * from ${entity}`;
  if (typeof input.where === "string" && input.where !== "") statement += ` where ${input.where}`;
  if (typeof input.orderBy === "string" && input.orderBy !== "") statement += ` orderby ${input.orderBy}`;
  if (typeof input.startPosition === "number") statement += ` startposition ${input.startPosition}`;
  if (typeof input.maxResults === "number") statement += ` maxresults ${input.maxResults}`;
  return statement;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const api = hosts[account.method].api;
  const authorization = { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" };

  const call = async (row: Row, input: Record<string, unknown>) => {
    let path = row.path;
    const search = new URLSearchParams({ minorversion: minorVersion, ...row.fixed });
    let body: Record<string, unknown> = {};
    for (const [name, , , where] of row.fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") path = path.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else if (name === "body") body = value as Record<string, unknown>;
      else body[name] = value;
    }
    if (row.statement !== undefined) {
      search.set("query", row.statement === "" ? String(input.statement) : statementFor(row.statement, input));
      for (const name of ["where", "orderBy", "startPosition", "maxResults", "statement"]) search.delete(name);
    }
    if (row.sparse === true && body.sparse === undefined) body = { ...body, sparse: true };
    const hasBody = row.method === "POST" && !row.empty;
    const response = await fetcher(`${api}/v3/company/${encodeURIComponent(String(input.realmId))}${path}?${search.toString()}`, {
      method: row.method,
      signal,
      headers: {
        ...authorization,
        ...(hasBody ? { "content-type": "application/json" } : row.empty ? { "content-type": "application/octet-stream" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`QuickBooks answered ${response.status}: ${text.slice(0, 1500)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const options = { description: describe(row.description, row.fields), input: schemaFor(row.fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(row, input);
    const tool = row.method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(row.group) ?? {};
    group[row.action] = tool;
    groups.set(row.group, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { quickbooks: quickbooks.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quickbooks ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "QuickBooks",
        description:
          "QuickBooks Online accounting: customers, vendors, invoices, bills, payments, items, accounts, journal entries, taxes, time tracking, queries and financial reports.",
        instructions:
          "Every tool takes realmId, the id of the QuickBooks company (shown in the QuickBooks URL and on the Intuit developer dashboard for sandbox companies); ask the user for it if unknown. Use the sandbox method for sandbox companies. Updates need the record's Id and latest SyncToken: read it first. Pass dates as YYYY-MM-DD.",
        icons,
      },
    ),
  }),
);

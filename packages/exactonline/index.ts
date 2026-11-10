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
  oauth2,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Exact Online runs one site per country, each with its own sign-in and API host.
// Executor declares OAuth endpoints as static strings, so each country is its own sign-in method.
const regions = {
  nl: ["Netherlands (.nl)", "nl"],
  com: ["International (.com)", "com"],
  be: ["Belgium (.be)", "be"],
  de: ["Germany (.de)", "de"],
  fr: ["France (.fr)", "fr"],
  uk: ["United Kingdom (.co.uk)", "co.uk"],
  es: ["Spain (.es)", "es"],
} as const;
type Region = keyof typeof regions;

const origin = (region: Region) => `https://start.exactonline.${regions[region][1]}`;

// Exact does not use OAuth scopes: the app's rights are set in the App Center.
const signIn = (region: Region) =>
  oauth2({
    authorizationUrl: `${origin(region)}/api/oauth2/auth`,
    tokenUrl: `${origin(region)}/api/oauth2/token`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopes: [],
  });

const exact = defineProvider({
  name: "Exact Online",
  hosts: Object.values(regions).map(([, ext]) => `start.exactonline.${ext}`),
  auth: {
    oauthNl: signIn("nl"),
    oauthCom: signIn("com"),
    oauthBe: signIn("be"),
    oauthDe: signIn("de"),
    oauthFr: signIn("fr"),
    oauthUk: signIn("uk"),
    oauthEs: signIn("es"),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseOf(account.method)}/api/v1/current/Me?$select=UserID,FullName,CurrentDivision`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { d } = await decodeJson(
      response,
      object({ d: object({ results: array(object({ UserID: string(), FullName: json(), CurrentDivision: number() })) }) }),
    );
    const me = d.results[0];
    if (me === undefined) throw new Error("Exact Online returned no current user.");
    return {
      accountInfo: {
        externalId: me.UserID,
        ...(typeof me.FullName === "string" && me.FullName !== "" ? { displayName: me.FullName } : {}),
      },
    };
  },
});

type Account = { method: string; fields: { access_token: string } };

function baseOf(method: string): string {
  const region = method.replace(/^oauth/, "").toLowerCase() as Region;
  if (!(region in regions)) throw new Error(`Unknown Exact Online sign-in method ${method}.`);
  return origin(region);
}

type Row = {
  name: string;
  path: string; // service/Entity under /api/v1/{division}/
  label: string;
  write?: "full" | "noDelete";
  read?: "list";
};

const rows: Row[] = [
  { name: "accounts", path: "crm/Accounts", label: "relations (customers, suppliers, prospects)", write: "full" },
  { name: "contacts", path: "crm/Contacts", label: "contacts", write: "full" },
  { name: "addresses", path: "crm/Addresses", label: "addresses of relations", write: "full" },
  { name: "opportunities", path: "crm/Opportunities", label: "sales opportunities", write: "full" },
  { name: "quotations", path: "crm/Quotations", label: "quotations", write: "full" },
  { name: "salesInvoices", path: "salesinvoice/SalesInvoices", label: "sales invoices (create with SalesInvoiceLines)", write: "noDelete" },
  { name: "salesInvoiceLines", path: "salesinvoice/SalesInvoiceLines", label: "sales invoice lines", write: "noDelete" },
  { name: "salesOrders", path: "salesorder/SalesOrders", label: "sales orders (create with SalesOrderLines)", write: "full" },
  { name: "salesOrderLines", path: "salesorder/SalesOrderLines", label: "sales order lines", write: "full" },
  { name: "purchaseOrders", path: "purchaseorder/PurchaseOrders", label: "purchase orders (create with PurchaseOrderLines)", write: "full" },
  { name: "purchaseEntries", path: "purchaseentry/PurchaseEntries", label: "purchase entries (supplier invoices)", write: "noDelete" },
  { name: "generalJournalEntries", path: "generaljournalentry/GeneralJournalEntries", label: "general journal entries", write: "noDelete" },
  { name: "glAccounts", path: "financial/GLAccounts", label: "general ledger accounts", write: "full" },
  { name: "journals", path: "financial/Journals", label: "journals", write: "noDelete" },
  { name: "bankAccounts", path: "financial/BankAccounts", label: "bank accounts of the company", write: "full" },
  { name: "bankEntries", path: "financialtransaction/BankEntries", label: "bank entries", write: "noDelete" },
  { name: "cashEntries", path: "financialtransaction/CashEntries", label: "cash entries", write: "noDelete" },
  { name: "transactions", path: "financialtransaction/Transactions", label: "financial transactions", read: "list" },
  { name: "transactionLines", path: "financialtransaction/TransactionLines", label: "financial transaction lines", read: "list" },
  { name: "receivables", path: "cashflow/Receivables", label: "open receivables", read: "list" },
  { name: "payables", path: "cashflow/Payables", label: "open payables", read: "list" },
  { name: "payments", path: "cashflow/Payments", label: "payments", read: "list" },
  { name: "vatCodes", path: "vat/VATCodes", label: "VAT codes", read: "list" },
  { name: "items", path: "logistics/Items", label: "items (products and services)", write: "full" },
  { name: "itemGroups", path: "logistics/ItemGroups", label: "item groups", write: "full" },
  { name: "warehouses", path: "inventory/Warehouses", label: "warehouses", read: "list" },
  { name: "stockPositions", path: "inventory/StockPositions", label: "stock positions per item", read: "list" },
  { name: "projects", path: "project/Projects", label: "projects", write: "full" },
  { name: "timeAndBillingEntries", path: "project/TimeAndBillingEntries", label: "time and billing entries", write: "full" },
  { name: "employees", path: "hrm/Employees", label: "employees", read: "list" },
  { name: "departments", path: "hrm/Departments", label: "departments", write: "full" },
  { name: "subscriptions", path: "subscription/Subscriptions", label: "subscriptions", write: "full" },
  { name: "documents", path: "documents/Documents", label: "documents", write: "full" },
  { name: "costCenters", path: "hrm/Costcenters", label: "cost centers", write: "full" },
  { name: "glClassifications", path: "financial/GLClassifications", label: "general ledger classifications", read: "list" },
  { name: "paymentConditions", path: "cashflow/PaymentConditions", label: "payment conditions", read: "list" },
  { name: "currencies", path: "general/Currencies", label: "currencies", read: "list" },
];

const division = { division: number().optional() };

const listInput = object({
  ...division,
  $filter: string().optional(),
  $select: string().optional(),
  $orderby: string().optional(),
  $top: number().optional(),
  $skiptoken: string().optional(),
});
const getInput = object({ ...division, id: string(), $select: string().optional() });
const bodyInput = object({ ...division, body: json() });
const updateInput = object({ ...division, id: string(), body: json() });
const deleteInput = object({ ...division, id: string() });

const listNote =
  "Division defaults to the user's current division. $filter uses OData v3 syntax (Name eq 'Acme', Modified gt datetime'2024-01-01T00:00:00'); $select lists fields; $top is at most 60 for most endpoints; follow __next with $skiptoken. Dates in results look like /Date(1700000000000)/.";

async function send(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined, method: string, url: string, body?: unknown) {
  const response = await fetcher(url, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${account.fields.access_token}`,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Exact Online answered ${response.status}: ${text.slice(0, 1000)}`);
  return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = baseOf(account.method);
  let current: Promise<number> | undefined;
  const currentDivision = () =>
    (current ??= send(account, fetcher, signal, "GET", `${base}/api/v1/current/Me?$select=CurrentDivision`).then((me) => {
      const value = (me as { d?: { results?: { CurrentDivision?: number }[] } }).d?.results?.[0]?.CurrentDivision;
      if (typeof value !== "number") throw new Error("Exact Online did not report a current division.");
      return value;
    }));
  const root = async (input: { division?: number }) => `${base}/api/v1/${input.division ?? (await currentDivision())}`;
  const key = (id: string) => (/^[0-9a-f-]{36}$/i.test(id) ? `guid'${id}'` : id);
  const odata = (input: Record<string, unknown>, names: string[]) => {
    const params = new URLSearchParams();
    for (const name of names) if (input[name] !== undefined) params.set(name, String(input[name]));
    return params.size > 0 ? `?${params.toString()}` : "";
  };

  const entities: Record<string, unknown> = {};
  for (const row of rows) {
    const tools: Record<string, unknown> = {
      list: query(
        { description: `List ${row.label}. ${listNote}`, input: listInput },
        (async (_ctx: unknown, input: Record<string, unknown>) =>
          send(account, fetcher, signal, "GET", `${await root(input as never)}/${row.path}${odata(input, ["$filter", "$select", "$orderby", "$top", "$skiptoken"])}`)) as never,
      ),
    };
    if (row.read !== "list") {
      tools.get = query(
        { description: `Retrieve one of the ${row.label} by its ID (a GUID).`, input: getInput },
        (async (_ctx: unknown, input: Record<string, unknown>) =>
          send(account, fetcher, signal, "GET", `${await root(input as never)}/${row.path}(${key(String(input.id))})${odata(input, ["$select"])}`)) as never,
      );
    }
    if (row.write !== undefined) {
      tools.create = mutation(
        { description: `Create one of the ${row.label}. body is the JSON entity as documented at https://start.exactonline.nl/docs/HlpRestAPIResources.aspx.`, input: bodyInput },
        (async (_ctx: unknown, input: Record<string, unknown>) =>
          send(account, fetcher, signal, "POST", `${await root(input as never)}/${row.path}`, input.body)) as never,
      );
      tools.update = mutation(
        { description: `Update one of the ${row.label} by ID. body holds the fields to change.`, input: updateInput },
        (async (_ctx: unknown, input: Record<string, unknown>) =>
          send(account, fetcher, signal, "PUT", `${await root(input as never)}/${row.path}(${key(String(input.id))})`, input.body)) as never,
      );
    }
    if (row.write === "full") {
      tools.delete = mutation(
        { description: `Delete one of the ${row.label} by ID.`, input: deleteInput },
        (async (_ctx: unknown, input: Record<string, unknown>) =>
          send(account, fetcher, signal, "DELETE", `${await root(input as never)}/${row.path}(${key(String(input.id))})`)) as never,
      );
    }
    entities[row.name] = router(tools as never);
  }

  return router({
    me: query(
      { description: "Retrieve the signed-in user and the current division (CurrentDivision) used when division is omitted.", input: object({}) },
      (async () => send(account, fetcher, signal, "GET", `${base}/api/v1/current/Me`)) as never,
    ),
    divisions: query(
      { description: "List the divisions (administrations) of the current user's company.", input: object({}) },
      (async () =>
        send(account, fetcher, signal, "GET", `${base}/api/v1/${await currentDivision()}/system/Divisions?$select=Code,Description,Name,Country,Currency,Status`)) as never,
    ),
    ...entities,
  } as never);
}

export default defineApp(
  { user: { accounts: { exact: exact.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.exact ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Exact Online",
        description:
          "Exact Online accounting and ERP: relations, contacts, items, sales and purchase documents, general ledger, journals, bank and cash entries, projects, employees and subscriptions.",
        instructions:
          "Every call acts on a division (administration); omit division to use the user's current one (see divisions.list). Lists are OData with $filter/$select/$top (max 60 rows; follow __next via $skiptoken). Responses wrap data in { d: { results } }. Exact Online limits calls to about 60 per minute per division.",
        icons,
      },
    ),
  }),
);

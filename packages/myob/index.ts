import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://api.myob.com/accountright";

// MYOB requires the developer app's API key (its client id) in x-myobapi-key on every request, and Executor does
// not expose an OAuth account's client id to app code, so the key is its own account requirement.
const developerApp = defineProvider({
  name: "MYOB developer app key",
  hosts: [],
  auth: {
    apiKey: secrets({
      label: "API key (client id)",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
});

const myob = defineProvider({
  name: "MYOB",
  hosts: ["api.myob.com"],
  auth: {
    // Register an app at https://my.myob.com/au/Developer (AU/NZ). The connect page asks for its client id and secret.
    oauth: oauth2({
      authorizationUrl: "https://secure.myob.com/oauth2/account/authorize",
      tokenUrl: "https://secure.myob.com/oauth2/v1/authorize",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["CompanyFile"],
      authorizationParams: { prompt: "consent" },
    }),
  },
});

type Params = Record<string, unknown>;
type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Resource {
  /** Tool group name. */
  name: string;
  /** Path under the company file. */
  path: string;
  noun: string;
  /** Operations beyond list and get. */
  write: ("create" | "update" | "delete")[];
}

const crud: Resource["write"] = ["create", "update", "delete"];
const resources: Resource[] = [
  { name: "accounts", path: "GeneralLedger/Account", noun: "general ledger account", write: crud },
  { name: "taxCodes", path: "GeneralLedger/TaxCode", noun: "tax code", write: crud },
  { name: "categories", path: "GeneralLedger/Category", noun: "category", write: crud },
  { name: "jobs", path: "GeneralLedger/Job", noun: "job", write: crud },
  { name: "generalJournals", path: "GeneralLedger/GeneralJournal", noun: "general journal", write: crud },
  { name: "customers", path: "Contact/Customer", noun: "customer", write: crud },
  { name: "suppliers", path: "Contact/Supplier", noun: "supplier", write: crud },
  { name: "employees", path: "Contact/Employee", noun: "employee", write: crud },
  { name: "personalContacts", path: "Contact/Personal", noun: "personal contact", write: crud },
  { name: "salesInvoicesItem", path: "Sale/Invoice/Item", noun: "item sales invoice", write: crud },
  { name: "salesInvoicesService", path: "Sale/Invoice/Service", noun: "service sales invoice", write: crud },
  { name: "salesInvoicesProfessional", path: "Sale/Invoice/Professional", noun: "professional sales invoice", write: crud },
  { name: "salesInvoicesMiscellaneous", path: "Sale/Invoice/Miscellaneous", noun: "miscellaneous sales invoice", write: crud },
  { name: "salesOrdersItem", path: "Sale/Order/Item", noun: "item sales order", write: crud },
  { name: "salesOrdersService", path: "Sale/Order/Service", noun: "service sales order", write: crud },
  { name: "salesQuotesItem", path: "Sale/Quote/Item", noun: "item sales quote", write: crud },
  { name: "salesQuotesService", path: "Sale/Quote/Service", noun: "service sales quote", write: crud },
  { name: "customerPayments", path: "Sale/CustomerPayment", noun: "customer payment", write: ["create", "delete"] },
  { name: "creditRefunds", path: "Sale/CreditRefund", noun: "customer credit refund", write: ["create", "delete"] },
  { name: "purchaseBillsItem", path: "Purchase/Bill/Item", noun: "item purchase bill", write: crud },
  { name: "purchaseBillsService", path: "Purchase/Bill/Service", noun: "service purchase bill", write: crud },
  { name: "purchaseBillsProfessional", path: "Purchase/Bill/Professional", noun: "professional purchase bill", write: crud },
  { name: "purchaseBillsMiscellaneous", path: "Purchase/Bill/Miscellaneous", noun: "miscellaneous purchase bill", write: crud },
  { name: "purchaseOrdersItem", path: "Purchase/Order/Item", noun: "item purchase order", write: crud },
  { name: "purchaseOrdersService", path: "Purchase/Order/Service", noun: "service purchase order", write: crud },
  { name: "supplierPayments", path: "Purchase/SupplierPayment", noun: "supplier payment", write: ["create", "delete"] },
  { name: "debitRefunds", path: "Purchase/DebitRefund", noun: "supplier debit refund", write: ["create", "delete"] },
  { name: "items", path: "Inventory/Item", noun: "inventory item", write: crud },
  { name: "locations", path: "Inventory/Location", noun: "inventory location", write: crud },
  { name: "spendMoney", path: "Banking/SpendMoneyTxn", noun: "spend money transaction", write: crud },
  { name: "receiveMoney", path: "Banking/ReceiveMoneyTxn", noun: "receive money transaction", write: crud },
  { name: "transferMoney", path: "Banking/TransferMoneyTxn", noun: "transfer money transaction", write: crud },
  { name: "bankAccounts", path: "Banking/BankAccount", noun: "bank account", write: [] },
];

const fileInput = {
  companyFileId: string({ minLength: 1 }),
  companyFileToken: string().optional(),
};
const filters = record(json()).optional();
const payload = record(json());

function client(apiKey: () => string, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, input: Params, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const cfToken = input.companyFileToken as string | undefined;
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-myobapi-key": apiKey(),
        "x-myobapi-version": "v2",
        Accept: "application/json",
        ...(cfToken === undefined ? {} : { "x-myobapi-cftoken": cfToken }),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = response.status === 204 ? "" : await response.clone().text();
    // Creates answer 201 with an empty body and the new record's URL in Location.
    if (text === "") return { ok: response.ok, status: response.status, location: response.headers.get("Location") };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

function build(call: Call) {
  const groups = Object.fromEntries(
    resources.map((r) => {
      const at = (input: Params) => `${encodeURIComponent(String(input.companyFileId))}/${r.path}`;
      const tools: Record<string, any> = {
        list: query(
          {
            description: `List ${r.noun} records. Filter with query: {"$filter": "...", "$top": 100, "$skip": 0, "$orderby": "..."} (OData). Responses carry Items and NextPageLink.`,
            input: object({ ...fileInput, query: filters }),
          },
          async (_ctx: unknown, input: Params) => call("GET", at(input), input, (input.query as Params | undefined) ?? {}),
        ),
        get: query(
          { description: `Retrieve one ${r.noun} by UID.`, input: object({ ...fileInput, uid: string({ minLength: 1 }) }) },
          async (_ctx: unknown, input: Params) => call("GET", `${at(input)}/${encodeURIComponent(String(input.uid))}`, input),
        ),
      };
      if (r.write.includes("create"))
        tools.create = mutation(
          { description: `Create a ${r.noun}. body is the ${r.noun} object from the MYOB AccountRight API reference.`, input: object({ ...fileInput, body: payload }) },
          async (_ctx: unknown, input: Params) => call("POST", at(input), input, {}, input.body as Params),
        );
      if (r.write.includes("update"))
        tools.update = mutation(
          { description: `Update a ${r.noun}. body is the full object including its UID and current RowVersion.`, input: object({ ...fileInput, uid: string({ minLength: 1 }), body: payload }) },
          async (_ctx: unknown, input: Params) => call("PUT", `${at(input)}/${encodeURIComponent(String(input.uid))}`, input, {}, input.body as Params),
        );
      if (r.write.includes("delete"))
        tools.delete = mutation(
          { description: `Delete a ${r.noun} by UID.`, input: object({ ...fileInput, uid: string({ minLength: 1 }) }) },
          async (_ctx: unknown, input: Params) => call("DELETE", `${at(input)}/${encodeURIComponent(String(input.uid))}`, input),
        );
      return [r.name, router(tools)];
    }),
  );

  return router({
    companyFiles: router({
      list: query(
        { description: "List the company files the signed-in user can access. Each has an Id (the companyFileId for every other tool), Name, Uri and Country.", input: object({}) },
        async () => call("GET", "", {}),
      ),
      info: query(
        { description: "Company file information: product version, country and links to its resources.", input: object({ ...fileInput }) },
        async (_ctx: unknown, input: Params) => call("GET", encodeURIComponent(String(input.companyFileId)), input),
      ),
    }),
    preferences: query(
      { description: "Company file preferences (lock period, dates, GST settings).", input: object({ ...fileInput }) },
      async (_ctx: unknown, input: Params) => call("GET", `${encodeURIComponent(String(input.companyFileId))}/Company/Preferences`, input),
    ),
    ...groups,
  });
}

export default defineApp(
  { user: { accounts: { myob: myob.many(), developerApp: developerApp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.myob ?? [],
        (account) => {
          const apiKey = () => {
            const key = (user?.accounts.developerApp ?? [])[0]?.fields.apiKey;
            if (key === undefined) throw new Error("Select a MYOB developer app key account: MYOB requires the API key on every request.");
            return key;
          };
          return withApprovals(build(client(apiKey, account.fields.access_token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "MYOB",
        description:
          "MYOB AccountRight accounting: chart of accounts, tax codes, customers, suppliers, sales and purchase invoices, orders, quotes, payments, inventory, banking transactions and journals.",
        instructions:
          "Start with companyFiles.list and pass the chosen Id as companyFileId to every other tool. Records are addressed by UID. Lists accept OData options in query ($filter, $top, $skip, $orderby) and return NextPageLink when more remain. Updates need the full record including RowVersion. Company files with their own user logins also need companyFileToken (base64 of username:password). Writes return 201 with the new record's URL in location.",
        icons,
      },
    ),
  }),
);

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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.accounting.sage.com/v3.1";

type Account = { method: "oauth"; fields: { access_token: string } };

const sage = defineProvider({
  name: "Sage",
  hosts: ["api.accounting.sage.com", "oauth.accounting.sage.com"],
  auth: {
    // Sage Accounting has no personal API keys: apps are registered at developer.sage.com.
    oauth: oauth2({
      authorizationUrl: "https://www.sageone.com/oauth2/auth/central",
      tokenUrl: "https://oauth.accounting.sage.com/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["full_access"],
      authorizationParams: { filter: "apiv3.1" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const user = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: user.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (
    method: string,
    path: string,
    init: { business?: string | undefined; query?: Params; body?: unknown } = {},
  ) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${account.fields.access_token}` };
    if (init.business) headers["X-Business"] = init.business;
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) {
      throw new Error(`Sage responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    const text = await response.text();
    if (text.trim() === "") return { ok: true };
    return JSON.parse(text) as Record<string, unknown>;
  };
}

const enc = encodeURIComponent;
const key = string({ minLength: 1 });
const business = string().optional();
const businessNote =
  "business is the Sage business id sent as X-Business; omit it to use the user's lead business (see business.list).";
const listShape = {
  business,
  page: number().optional(),
  itemsPerPage: number().optional(),
  search: string().optional(),
  updatedOrCreatedSince: string().optional(),
  params: json().optional(),
};
const List = object(listShape);
type ListInput = {
  page?: number | undefined;
  itemsPerPage?: number | undefined;
  search?: string | undefined;
  updatedOrCreatedSince?: string | undefined;
  params?: unknown;
};
const listQuery = (i: ListInput): Params => ({
  ...((i.params as Params | undefined) ?? {}),
  page: i.page,
  items_per_page: i.itemsPerPage,
  search: i.search,
  updated_or_created_since: i.updatedOrCreatedSince,
});

const listNote = `${businessNote} page starts at 1; itemsPerPage is 1-200 (default 20); search matches text fields; updatedOrCreatedSince is an ISO 8601 timestamp; params adds vendor query parameters such as attributes, from_date or to_date.`;

type Ops = "list" | "get" | "create" | "update" | "delete";
type Send = ReturnType<typeof client>;

function resource(
  send: Send,
  path: string,
  noun: string,
  wrapper: string,
  title: string,
  description: string,
  ops: readonly Ops[] = ["list", "get", "create", "update", "delete"],
) {
  const list = !ops.includes("list") ? {} : { list: query({ description: `List ${noun}s. ${listNote}`, input: List }, async (_c, i) =>
      send("GET", `/${path}`, { business: i.business, query: listQuery(i) }),
    ) };
  const get = !ops.includes("get") ? {} : { get: query(
      { description: `Get one ${noun} by key. ${businessNote}`, input: object({ business, key, params: json().optional() }) },
      async (_c, i) => send("GET", `/${path}/${enc(i.key)}`, { business: i.business, query: (i.params as Params | undefined) ?? {} }),
    ) };
  const create = !ops.includes("create") ? {} : { create: mutation(
      {
        description: `Create a ${noun}. body is Sage's JSON document, wrapped as { "${wrapper}": { ... } }. ${businessNote}`,
        input: object({ business, body: json() }),
        approval: always(),
      },
      async (_c, i) => send("POST", `/${path}`, { business: i.business, body: i.body }),
    ) };
  const update = !ops.includes("update") ? {} : { update: mutation(
      {
        description: `Update a ${noun} by key. body is wrapped as { "${wrapper}": { ... } } with only the fields to change. ${businessNote}`,
        input: object({ business, key, body: json() }),
        approval: always(),
      },
      async (_c, i) => send("PUT", `/${path}/${enc(i.key)}`, { business: i.business, body: i.body }),
    ) };
  const del = !ops.includes("delete") ? {} : { delete: mutation(
      { description: `Delete a ${noun} by key. ${businessNote}`, input: object({ business, key }), approval: always() },
      async (_c, i) => send("DELETE", `/${path}/${enc(i.key)}`, { business: i.business }),
    ) };
  const children: Parameters<typeof router>[0] = Object.assign({}, list, get, create, update, del);
  return router(children, { title, description });
}

const readOnly: readonly Ops[] = ["list", "get"];

function build(send: Send) {
  const r = (path: string, noun: string, wrapper: string, title: string, description: string, ops?: readonly Ops[]) =>
    resource(send, path, noun, wrapper, title, description, ops);
  return router({
    account: router(
      {
        user: query({ description: "Get the signed-in Sage user.", input: object({}) }, async () => send("GET", "/user")),
        businesses: query(
          { description: "List the businesses the user can access. Use a business id as the business input of other tools.", input: object({}) },
          async () => send("GET", "/businesses"),
        ),
        business: query(
          { description: `Get the selected business and its settings. ${businessNote}`, input: object({ business }) },
          async (_c, i) => send("GET", "/business", { business: i.business }),
        ),
        financialSettings: query(
          { description: `Get the business's financial settings (year end, base currency, accounting type). ${businessNote}`, input: object({ business }) },
          async (_c, i) => send("GET", "/financial_settings", { business: i.business }),
        ),
        invoiceSettings: query(
          { description: `Get the business's invoice settings. ${businessNote}`, input: object({ business }) },
          async (_c, i) => send("GET", "/invoice_settings", { business: i.business }),
        ),
      },
      { title: "Account", description: "The signed-in user, accessible businesses and business settings." },
    ),
    contacts: r("contacts", "contact (customer or supplier)", "contact", "Contacts", "Customers and suppliers."),
    contactPersons: r("contact_persons", "contact person", "contact_person", "Contact persons", "People attached to customers and suppliers."),
    addresses: r("addresses", "address", "address", "Addresses", "Postal addresses of contacts."),
    salesInvoices: r("sales_invoices", "sales invoice", "sales_invoice", "Sales invoices", "Customer invoices."),
    salesQuotes: r("sales_quotes", "sales quote", "sales_quote", "Sales quotes", "Customer quotes and estimates."),
    salesCreditNotes: r("sales_credit_notes", "sales credit note", "sales_credit_note", "Sales credit notes", "Credit notes issued to customers."),
    purchaseInvoices: r("purchase_invoices", "purchase invoice", "purchase_invoice", "Purchase invoices", "Supplier bills."),
    purchaseCreditNotes: r("purchase_credit_notes", "purchase credit note", "purchase_credit_note", "Purchase credit notes", "Credit notes received from suppliers."),
    products: r("products", "product", "product", "Products", "Products sold or bought."),
    services: r("services", "service", "service", "Services", "Services sold or bought."),
    stockItems: r("stock_items", "stock item", "stock_item", "Stock items", "Inventory items."),
    ledgerAccounts: r("ledger_accounts", "ledger account", "ledger_account", "Ledger accounts", "The chart of accounts.", ["list", "get", "create", "update"]),
    journals: r("journals", "journal", "journal", "Journals", "Manual journal entries.", ["list", "get", "create", "delete"]),
    transactions: r("transactions", "transaction", "transaction", "Transactions", "Posted ledger transactions.", readOnly),
    bankAccounts: r("bank_accounts", "bank account", "bank_account", "Bank accounts", "Bank, cash and credit card accounts."),
    bankDeposits: r("bank_deposits", "bank deposit", "bank_deposit", "Bank deposits", "Money received into a bank account."),
    bankTransfers: r("bank_transfers", "bank transfer", "bank_transfer", "Bank transfers", "Transfers between bank accounts."),
    contactPayments: r("contact_payments", "customer or supplier payment", "contact_payment", "Contact payments", "Payments received from customers and paid to suppliers."),
    contactAllocations: r("contact_allocations", "contact allocation", "contact_allocation", "Contact allocations", "Allocations of payments to invoices and credit notes."),
    otherPayments: r("other_payments", "other payment or receipt", "other_payment", "Other payments", "Bank payments and receipts not tied to an invoice."),
    attachments: r("attachments", "attachment", "attachment", "Attachments", "Documents attached to transactions and contacts."),
    analysisTypes: r("analysis_types", "analysis type", "analysis_type", "Analysis types", "Custom analysis (tracking) types.", ["list", "get", "update"]),
    taxRates: r("tax_rates", "tax rate", "tax_rate", "Tax rates", "Tax rates and VAT codes.", readOnly),
    taxProfiles: r("tax_profiles", "tax profile", "tax_profile", "Tax profiles", "Tax profiles of contacts.", readOnly),
    currencies: r("currencies", "currency", "currency", "Currencies", "Supported currencies.", readOnly),
    exchangeRates: r("exchange_rates", "exchange rate", "exchange_rate", "Exchange rates", "Currency exchange rates.", readOnly),
    countries: r("countries", "country", "country", "Countries", "Supported countries.", readOnly),
    paymentMethods: r("payment_methods", "payment method", "payment_method", "Payment methods", "Payment methods.", readOnly),
    ledgerAccountTypes: r("ledger_account_types", "ledger account type", "ledger_account_type", "Ledger account types", "Categories of ledger accounts.", readOnly),
    invoiceStatuses: r("invoice_statuses", "invoice status", "invoice_status", "Invoice statuses", "Possible invoice statuses.", readOnly),
    contactTypes: r("contact_types", "contact type", "contact_type", "Contact types", "Contact types such as customer and vendor.", readOnly),
  });
}

export default defineApp(
  { user: { accounts: { sage: sage.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.sage ?? [], (account) => build(client(account, fetch, signal)), { signal }),
      {
        title: "Sage",
        description:
          "Sage Accounting (Business Cloud Accounting) API v3.1: customers and suppliers, sales and purchase invoices, quotes, credit notes, payments, products, ledger accounts, banking and journals.",
        instructions:
          "Sage scopes data to a business. Call account.businesses to find business ids and pass one as business when the user has several. Write bodies wrap the document in a key named for the resource, for example { \"contact\": { \"name\": \"...\", \"contact_type_id\": \"CUSTOMER\" } }.",
        icons,
      },
    ),
  }),
);

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

// The Service Layer runs inside each customer's own landscape (typically https://<host>:50000/b1s/v1),
// so there is no fixed host to declare.
function serviceLayerBase(value: string): string {
  const url = new URL(value.trim().startsWith("http") ? value.trim() : `https://${value.trim()}`);
  if (url.protocol !== "https:") throw new Error("The Service Layer URL must use https.");
  const path = url.pathname.replace(/\/+$/, "");
  const base = /\/b1s\/v\d+$/.test(path) ? path : path.replace(/\/b1s(\/.*)?$/, "") + "/b1s/v1";
  return `${url.origin}${base}`;
}

const loginFields = object({
  serviceLayerUrl: plain(string({ minLength: 1 })),
  companyDb: plain(string({ minLength: 1 })),
  username: plain(string({ minLength: 1 })),
  password: string({ minLength: 1 }),
});

const sapBusinessOne = defineProvider({
  name: "SAP Business One",
  auth: {
    login: secrets({ label: "Service Layer user", fields: loginFields }),
  },
  async health({ account, fetch, signal }) {
    const base = serviceLayerBase(account.fields.serviceLayerUrl);
    const response = await fetch(`${base}/Login`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(loginBody(account.fields)),
    });
    const session = await decodeJson(response, object({ SessionId: string() }));
    await fetch(`${base}/Logout`, { method: "POST", signal, headers: { Cookie: `B1SESSION=${session.SessionId}` } }).catch(
      () => undefined,
    );
    return {
      accountInfo: {
        externalId: `${new URL(base).host}/${account.fields.companyDb}/${account.fields.username}`,
        displayName: `${account.fields.companyDb} (${account.fields.username})`,
      },
    };
  },
});

type Fields = { serviceLayerUrl: string; companyDb: string; username: string; password: string };

function loginBody(fields: Fields) {
  return { CompanyDB: fields.companyDb, UserName: fields.username, Password: fields.password };
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = serviceLayerBase(fields.serviceLayerUrl);
  let cookie: Promise<string> | undefined;

  // One Service Layer session per client; B1SESSION is renewed when the server answers 401.
  const login = (): Promise<string> =>
    (cookie ??= (async () => {
      const response = await fetcher(`${base}/Login`, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(loginBody(fields)),
      });
      const session = await decodeJson(response, object({ SessionId: string() }));
      return `B1SESSION=${session.SessionId}`;
    })());

  const send = async (method: Method, url: string, body: unknown, extra: Record<string, string>) =>
    fetcher(url, {
      method,
      signal,
      headers: {
        Cookie: await login(),
        Accept: "application/json",
        ...extra,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    // encodeURIComponent writes spaces as %20; OData would read "+" as a literal plus.
    const query = Object.entries(search)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k).replace(/%24/g, "$")}=${encodeURIComponent(String(v))}`)
      .join("&");
    const url = `${base}/${path.replace(/^\/+/, "")}${query ? `?${query}` : ""}`;
    // Entity updates answer 204 by default; ask for the entity back is not needed.
    const extra: Record<string, string> =
      method === "GET" && typeof search.$maxpagesize === "number" ? { Prefer: `odata.maxpagesize=${search.$maxpagesize}` } : {};
    let response = await send(method, url, body, extra);
    if (response.status === 401) {
      cookie = undefined;
      response = await send(method, url, body, extra);
    }
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return {};
    return decodeJson(response, json());
  };

  const metadata = async (path: string) => {
    const response = await send("GET", `${base}/${path}`, undefined, { Accept: "application/xml" });
    if (!response.ok) throw new Error(`SAP Business One returned ${response.status} for ${path}`);
    return { xml: await response.text() };
  };

  return { call, metadata };
}

type Client = ReturnType<typeof client>;

const odataOptions = {
  filter: string().optional(),
  select: string().optional(),
  orderby: string().optional(),
  top: number().optional(),
  skip: number().optional(),
  count: string().optional(),
};
const optionsDoc =
  "Options are OData: filter (e.g. \"CardType eq 'cCustomer' and Valid eq 'tYES'\"), select (comma-separated properties), orderby, top, skip, and count ('true' adds odata.count). Results carry odata.nextLink when more pages exist (default page size is 20).";

function toSearch(input: Params): Params {
  const out: Params = {};
  for (const key of ["filter", "select", "orderby", "top", "skip", "count"]) {
    if (input[key] !== undefined) out[`$${key}`] = input[key];
  }
  return out;
}

const entitySet = string({ minLength: 1 });

// Keys are the entity's key as written in the URL: 'C20000' (with quotes) for string keys, 15 for DocEntry.
const key = string({ minLength: 1 });

function list(c: Client, name: string, description: string) {
  return query(
    { description: `${description} ${optionsDoc}`, input: object(odataOptions) },
    async (_ctx, input: Params) => c.call("GET", name, toSearch(input)),
  );
}

function get(c: Client, name: string, description: string, keyDoc: string) {
  return query(
    { description: `${description} key is ${keyDoc}.`, input: object({ key, select: string().optional() }) },
    async (_ctx, input) => c.call("GET", `${name}(${input.key})`, toSearch(input)),
  );
}

function create(c: Client, name: string, description: string) {
  return mutation(
    { description: `${description} body is the JSON entity as in the Service Layer API reference.`, input: object({ body: record(json()) }) },
    async (_ctx, input) => c.call("POST", name, {}, input.body),
  );
}

function update(c: Client, name: string, description: string, keyDoc: string) {
  return mutation(
    {
      description: `${description} Only the supplied properties change. key is ${keyDoc}.`,
      input: object({ key, body: record(json()) }),
    },
    async (_ctx, input) => c.call("PATCH", `${name}(${input.key})`, {}, input.body),
  );
}

function action(c: Client, name: string, verb: string, description: string, keyDoc: string) {
  return mutation(
    { description: `${description} key is ${keyDoc}.`, input: object({ key }) },
    async (_ctx, input) => c.call("POST", `${name}(${input.key})/${verb}`),
  );
}

const docKey = "the DocEntry, for example 15";
const partnerKey = "the CardCode in quotes, for example 'C20000'";

function build(c: Client) {
  return router({
    businessPartners: router(
      {
        list: list(c, "BusinessPartners", "List business partners (customers, suppliers and leads)."),
        get: get(c, "BusinessPartners", "Retrieve a business partner.", partnerKey),
        create: create(c, "BusinessPartners", "Create a business partner (CardCode, CardName, CardType cCustomer, cSupplier or cLead)."),
        update: update(c, "BusinessPartners", "Update a business partner.", partnerKey),
      },
      { title: "Business partners", description: "Customers, suppliers and leads." },
    ),
    items: router(
      {
        list: list(c, "Items", "List items (ItemCode, ItemName, prices, stock, warehouses)."),
        get: get(c, "Items", "Retrieve an item.", "the ItemCode in quotes, for example 'A00001'"),
        create: create(c, "Items", "Create an item."),
        update: update(c, "Items", "Update an item.", "the ItemCode in quotes"),
        warehouses: list(c, "Warehouses", "List warehouses."),
        priceLists: list(c, "PriceLists", "List price lists."),
      },
      { title: "Inventory", description: "Items, warehouses and price lists." },
    ),
    sales: router(
      {
        quotations: list(c, "Quotations", "List sales quotations."),
        orders: list(c, "Orders", "List sales orders."),
        getOrder: get(c, "Orders", "Retrieve a sales order with its DocumentLines.", docKey),
        createOrder: create(c, "Orders", "Create a sales order (CardCode, DocDueDate, DocumentLines with ItemCode and Quantity)."),
        updateOrder: update(c, "Orders", "Update a sales order.", docKey),
        closeOrder: action(c, "Orders", "Close", "Close a sales order.", docKey),
        cancelOrder: action(c, "Orders", "Cancel", "Cancel a sales order.", docKey),
        deliveryNotes: list(c, "DeliveryNotes", "List delivery notes."),
        invoices: list(c, "Invoices", "List A/R invoices."),
        getInvoice: get(c, "Invoices", "Retrieve an A/R invoice with its DocumentLines.", docKey),
        createInvoice: create(c, "Invoices", "Create an A/R invoice."),
        cancelInvoice: action(c, "Invoices", "Cancel", "Cancel an A/R invoice (creates a cancellation document).", docKey),
        creditNotes: list(c, "CreditNotes", "List A/R credit memos."),
        returns: list(c, "Returns", "List sales returns."),
        createQuotation: create(c, "Quotations", "Create a sales quotation."),
        createDeliveryNote: create(c, "DeliveryNotes", "Create a delivery note."),
      },
      { title: "Sales", description: "Quotations, orders, deliveries, invoices and credit memos." },
    ),
    purchasing: router(
      {
        purchaseOrders: list(c, "PurchaseOrders", "List purchase orders."),
        getPurchaseOrder: get(c, "PurchaseOrders", "Retrieve a purchase order.", docKey),
        createPurchaseOrder: create(c, "PurchaseOrders", "Create a purchase order."),
        closePurchaseOrder: action(c, "PurchaseOrders", "Close", "Close a purchase order.", docKey),
        goodsReceipts: list(c, "PurchaseDeliveryNotes", "List goods receipt POs."),
        invoices: list(c, "PurchaseInvoices", "List A/P invoices."),
        createInvoice: create(c, "PurchaseInvoices", "Create an A/P invoice."),
      },
      { title: "Purchasing", description: "Purchase orders, goods receipts and A/P invoices." },
    ),
    accounting: router(
      {
        accounts: list(c, "ChartOfAccounts", "List the chart of accounts."),
        journalEntries: list(c, "JournalEntries", "List journal entries."),
        createJournalEntry: create(c, "JournalEntries", "Post a journal entry (ReferenceDate, JournalEntryLines with AccountCode, Debit, Credit)."),
        incomingPayments: list(c, "IncomingPayments", "List incoming payments."),
        createIncomingPayment: create(c, "IncomingPayments", "Create an incoming payment."),
        vendorPayments: list(c, "VendorPayments", "List outgoing (vendor) payments."),
        currencies: list(c, "Currencies", "List currencies."),
        vatGroups: list(c, "VatGroups", "List tax (VAT) groups."),
      },
      { title: "Accounting", description: "Chart of accounts, journal entries and payments." },
    ),
    organization: router(
      {
        employees: list(c, "EmployeesInfo", "List employees."),
        salesPersons: list(c, "SalesPersons", "List sales employees."),
        users: list(c, "Users", "List Business One users."),
        activities: list(c, "Activities", "List CRM activities."),
        createActivity: create(c, "Activities", "Create a CRM activity."),
        projects: list(c, "Projects", "List projects."),
        companyInfo: query(
          { description: "Retrieve company details (name, local currency, versions).", input: object({}) },
          async () => c.call("POST", "CompanyService_GetCompanyInfo"),
        ),
      },
      { title: "Organization", description: "Employees, users, CRM activities and company information." },
    ),
    entities: router(
      {
        list: query(
          {
            description: `List any Service Layer entity collection of the company database, for example UserTables or U_MYTABLE for user-defined tables. ${optionsDoc}`,
            input: object({ entity: entitySet, ...odataOptions }),
          },
          async (_ctx, input) => c.call("GET", input.entity, toSearch(input)),
        ),
        get: query(
          {
            description: "Retrieve one entity by key, e.g. entity BusinessPartners with key 'C20000', or Orders with key 15.",
            input: object({ entity: entitySet, key, select: string().optional() }),
          },
          async (_ctx, input) => c.call("GET", `${input.entity}(${input.key})`, toSearch(input)),
        ),
        nextPage: query(
          {
            description: "Fetch the next page from an odata.nextLink value (the relative path with its query, as returned by list calls).",
            input: object({ nextLink: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("GET", input.nextLink.replace(/^\/?(b1s\/v\d+\/)?/, "")),
        ),
        metadata: query(
          { description: "Fetch the OData $metadata (EDMX XML, returned as { xml }) describing every entity, property and action of the Service Layer.", input: object({}) },
          async () => c.metadata("$metadata"),
        ),
        create: mutation(
          { description: "Create one record in any entity collection. body is the JSON entity.", input: object({ entity: entitySet, body: record(json()) }) },
          async (_ctx, input) => c.call("POST", input.entity, {}, input.body),
        ),
        update: mutation(
          { description: "Update one record (PATCH: only supplied properties change). key as in entities.get.", input: object({ entity: entitySet, key, body: record(json()) }) },
          async (_ctx, input) => c.call("PATCH", `${input.entity}(${input.key})`, {}, input.body),
        ),
        delete: mutation(
          { description: "Delete one record by key. key as in entities.get.", input: object({ entity: entitySet, key }) },
          async (_ctx, input) => c.call("DELETE", `${input.entity}(${input.key})`),
        ),
        action: mutation(
          {
            description:
              "Invoke a Service Layer action or service operation by path, for example Orders(15)/Close, Orders(15)/Cancel, or CompanyService_GetAdminInfo. body is optional JSON parameters.",
            input: object({ path: string({ minLength: 1 }), body: record(json()).optional() }),
          },
          async (_ctx, input) => c.call("POST", input.path, {}, input.body),
        ),
      },
      { title: "Any entity", description: "Generic access to every entity, user-defined table and action the Service Layer exposes." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { sapBusinessOne: sapBusinessOne.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sapBusinessOne ?? [],
        (account) =>
          withApprovals(build(client(account.fields as unknown as Fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SAP Business One",
        description: "Business partners, items, sales and purchasing documents, accounting and any entity of one SAP Business One company database via the Service Layer.",
        icons,
        instructions:
          "Named tools cover common entities; entities.* reaches any collection, user-defined table (U_*) and action. Use entities.metadata to discover properties. String keys need quotes: 'C20000'. Lists return 20 rows per page: use top and odata.nextLink (entities.nextPage). Writes require approval.",
      },
    ),
  }),
);

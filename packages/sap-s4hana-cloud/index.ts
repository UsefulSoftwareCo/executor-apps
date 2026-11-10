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

// API servers: S/4HANA Cloud tenants (myNNNNNN-api.s4hana.cloud.sap, *.s4hana.ondemand.com)
// and SAP BTP application hosts (*.cfapps.<region>.hana.ondemand.com, or *.platform.sapcloud.cn in China).
const hostPattern = /^[a-z0-9][a-z0-9.-]*\.(s4hana\.cloud\.sap|s4hana\.ondemand\.com|hana\.ondemand\.com|sapcloud\.cn)$/;

// A host glob `*.` covers exactly one DNS label, so the multi-label BTP hosts
// (<subdomain>.authentication.<region>.hana.ondemand.com, <app>.cfapps.<region>.hana.ondemand.com)
// are listed per region. Region is the identifier in the service key's authentication URL.
const regions = [
  "eu10", "eu10-002", "eu10-003", "eu10-004", "eu10-005", "eu11", "eu12", "eu20", "eu30",
  "us10", "us10-001", "us10-002", "us11", "us20", "us21", "us30",
  "ap10", "ap11", "ap12", "ap20", "ap21", "ap30", "jp10", "jp20", "jp30",
  "br10", "br20", "br30", "ca10", "ca20", "ch20", "in30", "sa30", "cn40",
];
// China regions live under platform.sapcloud.cn; all others under hana.ondemand.com.
const regionDomain = (region: string) => (region.startsWith("cn") ? `${region}.platform.sapcloud.cn` : `${region}.hana.ondemand.com`);
const btpHosts = regions.flatMap((r) => [`*.authentication.${regionDomain(r)}`, `*.cfapps.${regionDomain(r)}`]);

function apiServer(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter the API server host, for example my300000-api.s4hana.cloud.sap or my-app.cfapps.eu10.hana.ondemand.com.");
  return host;
}

const label = /^[a-z0-9][a-z0-9_-]*$/;
function authLabel(value: string, what: string): string {
  const v = value.trim().toLowerCase();
  if (!label.test(v)) throw new Error(`Enter the ${what} exactly as shown in your SAP BTP service key (letters, digits, - and _).`);
  return v;
}

function authRegion(value: string): string {
  const region = authLabel(value, "region");
  if (!regions.includes(region))
    throw new Error(`Unsupported BTP region "${region}". Use the region from your service key's authentication URL, one of: ${regions.join(", ")}.`);
  return region;
}

const server = plain(string({ minLength: 1 }));

const sapS4 = defineProvider({
  name: "SAP S/4HANA Cloud",
  hosts: ["*.s4hana.cloud.sap", "*.s4hana.ondemand.com", "*.hana.ondemand.com", ...btpHosts],
  auth: {
    basic: secrets({
      label: "Communication user (basic authentication)",
      fields: object({
        apiServer: server,
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
    clientCredentials: secrets({
      label: "OAuth 2.0 client credentials (SAP BTP / XSUAA service key)",
      fields: object({
        apiServer: server,
        subdomain: plain(string({ minLength: 1 })),
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const c = client(account as unknown as AccountFields, fetch, signal);
    if (account.method === "clientCredentials") {
      // Minting a token proves the client id and secret; which APIs are reachable depends on scopes and roles.
      await c.authenticate();
    } else {
      // 401 means bad credentials. 403/404 prove the user authenticated but this tenant's communication
      // arrangement does not expose API_BUSINESS_PARTNER (SAP_COM_0008), which is not a credential failure.
      const status = await c.probe("sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner", { $top: 1, $select: "BusinessPartner" });
      if (status !== 403 && status !== 404 && (status < 200 || status >= 300)) throw new Error(`SAP returned ${status} for the account check.`);
    }
    const host = apiServer(account.fields.apiServer);
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

type AccountFields =
  | { method: "basic"; fields: { apiServer: string; username: string; password: string } }
  | {
      method: "clientCredentials";
      fields: { apiServer: string; subdomain: string; region: string; clientId: string; clientSecret: string };
    };

function base64Utf8(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "MERGE";
type Params = Record<string, unknown>;

function client(account: AccountFields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const host = apiServer(account.fields.apiServer);
  const base = `https://${host}`;
  let cached: string | undefined;

  // Basic uses the communication user directly. Client credentials mint a bearer token at
  // https://<subdomain>.authentication.<region domain>/oauth/token (client_secret_basic).
  const authorization = async (): Promise<string> => {
    if (account.method === "basic") return `Basic ${base64Utf8(`${account.fields.username}:${account.fields.password}`)}`;
    if (cached === undefined) {
      const f = account.fields;
      const tokenUrl = `https://${authLabel(f.subdomain, "subdomain")}.authentication.${regionDomain(authRegion(f.region))}/oauth/token`;
      const response = await fetcher(tokenUrl, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Basic ${base64Utf8(`${f.clientId}:${f.clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: "grant_type=client_credentials",
      });
      const token = await decodeJson(response, object({ access_token: string() }));
      cached = token.access_token;
    }
    return `Bearer ${cached}`;
  };

  const url = (path: string, search: Params) => {
    const pairs = [["$format", "json"], ...Object.entries(search).filter(([, v]) => v !== undefined && v !== null)];
    // %20 not "+": OData reads "+" as the add operator.
    const qs = pairs.map(([k, v]) => `${encodeURIComponent(k).replace(/%24/g, "$")}=${encodeURIComponent(String(v))}`).join("&");
    return `${base}/${path.replace(/^\/+/, "")}?${qs}`;
  };

  // Writes need an X-CSRF-Token fetched with a GET to the service root (e.g.
  // sap/opu/odata/sap/API_BUSINESS_PARTNER/, possibly with ";v=0002"), plus the session cookie it sets.
  const csrf = async (service: string, auth: string) => {
    const response = await fetcher(`${base}/${service.replace(/^\/+|\/+$/g, "")}/`, {
      signal,
      headers: { Authorization: auth, "x-csrf-token": "fetch", Accept: "application/json" },
    });
    const token = response.headers.get("x-csrf-token") ?? undefined;
    const cookie = (response.headers.get("set-cookie") ?? "")
      .split(/,(?=\s*[A-Za-z0-9_.-]+=)/)
      .map((c) => c.split(";")[0]?.trim())
      .filter((c): c is string => !!c)
      .join("; ");
    return { token, cookie };
  };

  // Writes must say which service root to fetch the CSRF token from. PATCH/DELETE send If-Match
  // (an entity ETag, or "*" to skip the optimistic-lock check) because Gateway answers 428 without it.
  const call = async (
    method: Method,
    path: string,
    search: Params = {},
    body?: unknown,
    write?: { service: string; ifMatch?: string },
  ) => {
    const auth = await authorization();
    const extra: Record<string, string> = {};
    if (method !== "GET") {
      if (!write) throw new Error("A write needs its service root for the CSRF token.");
      const { token, cookie } = await csrf(write.service, auth);
      if (token) extra["x-csrf-token"] = token;
      if (cookie) extra.Cookie = cookie;
      if (write.ifMatch !== undefined) extra["If-Match"] = write.ifMatch;
    }
    const response = await fetcher(url(path, search), {
      method,
      signal,
      headers: {
        Authorization: auth,
        Accept: "application/json",
        ...extra,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return {};
    return decodeJson(response, json());
  };

  const metadata = async (path: string) => {
    const response = await fetcher(`${base}/${path.replace(/^\/+/, "")}`, {
      signal,
      headers: { Authorization: await authorization() },
    });
    if (!response.ok) throw new Error(`SAP returned ${response.status} for ${path}`);
    return { xml: await response.text() };
  };
  const authenticate = async () => {
    await authorization();
  };

  // Status of a GET, without decoding the body; for account checks.
  const probe = async (path: string, search: Params = {}) => {
    const response = await fetcher(url(path, search), {
      signal,
      headers: { Authorization: await authorization(), Accept: "application/json" },
    });
    return response.status;
  };
  return { call, metadata, authenticate, probe };
}

type Client = ReturnType<typeof client>;

const odataOptions = {
  filter: string().optional(),
  select: string().optional(),
  expand: string().optional(),
  orderby: string().optional(),
  top: number().optional(),
  skip: number().optional(),
};
const optionsDoc =
  "Options are OData v2: filter (e.g. \"CreationDate ge datetime'2024-01-01T00:00:00'\"), select, expand, orderby, top (page size) and skip. Results carry d.__next when more pages exist.";

function toSearch(input: Params): Params {
  const out: Params = {};
  for (const key of ["filter", "select", "expand", "orderby", "top", "skip"]) {
    if (input[key] !== undefined) out[`$${key}`] = input[key];
  }
  return out;
}

const etagDoc = "etag is the entity ETag (the __metadata.etag from a read) sent as If-Match; omit it to send If-Match: * and skip the concurrency check.";

const odata = (service: string) => `sap/opu/odata/sap/${service}`;

function list(c: Client, service: string, entity: string, description: string) {
  return query(
    { description: `${description} ${optionsDoc}`, input: object(odataOptions) },
    async (_ctx, input: Params) => c.call("GET", `${odata(service)}/${entity}`, toSearch(input)),
  );
}

function get(c: Client, service: string, entity: string, description: string, keyName: string) {
  return query(
    {
      description: `${description} key is the ${keyName} value.`,
      input: object({ key: string({ minLength: 1 }), select: string().optional(), expand: string().optional() }),
    },
    async (_ctx, input) =>
      c.call("GET", `${odata(service)}/${entity}('${input.key.replace(/'/g, "''")}')`, toSearch(input)),
  );
}

function create(c: Client, service: string, entity: string, description: string) {
  return mutation(
    { description, input: object({ body: record(json()) }) },
    async (_ctx, input) => c.call("POST", `${odata(service)}/${entity}`, {}, input.body, { service: odata(service) }),
  );
}

function update(c: Client, service: string, entity: string, description: string, keyName: string) {
  return mutation(
    {
      description: `${description} key is the ${keyName} value; body holds the properties to change (PATCH). ${etagDoc}`,
      input: object({ key: string({ minLength: 1 }), body: record(json()), etag: string().optional() }),
    },
    async (_ctx, input) =>
      c.call("PATCH", `${odata(service)}/${entity}('${input.key.replace(/'/g, "''")}')`, {}, input.body, {
        service: odata(service),
        ifMatch: input.etag ?? "*",
      }),
  );
}

const path = string({ minLength: 1 });

function build(c: Client) {
  return router({
    businessPartners: router(
      {
        list: list(c, "API_BUSINESS_PARTNER", "A_BusinessPartner", "List business partners."),
        get: get(c, "API_BUSINESS_PARTNER", "A_BusinessPartner", "Retrieve a business partner.", "BusinessPartner"),
        create: create(c, "API_BUSINESS_PARTNER", "A_BusinessPartner", "Create a business partner. body is the A_BusinessPartner JSON."),
        update: update(c, "API_BUSINESS_PARTNER", "A_BusinessPartner", "Update a business partner.", "BusinessPartner"),
        customers: list(c, "API_BUSINESS_PARTNER", "A_Customer", "List customers."),
        suppliers: list(c, "API_BUSINESS_PARTNER", "A_Supplier", "List suppliers."),
        addresses: list(c, "API_BUSINESS_PARTNER", "A_BusinessPartnerAddress", "List business partner addresses."),
      },
      { title: "Business partners", description: "Business partners, customers and suppliers (API_BUSINESS_PARTNER)." },
    ),
    sales: router(
      {
        orders: list(c, "API_SALES_ORDER_SRV", "A_SalesOrder", "List sales orders."),
        order: get(c, "API_SALES_ORDER_SRV", "A_SalesOrder", "Retrieve a sales order.", "SalesOrder"),
        createOrder: create(c, "API_SALES_ORDER_SRV", "A_SalesOrder", "Create a sales order. body is the A_SalesOrder JSON, including to_Item."),
        updateOrder: update(c, "API_SALES_ORDER_SRV", "A_SalesOrder", "Update a sales order.", "SalesOrder"),
        billingDocuments: list(c, "API_BILLING_DOCUMENT_SRV", "A_BillingDocument", "List billing documents."),
        deliveries: list(c, "API_OUTBOUND_DELIVERY_SRV;v=0002", "A_OutbDeliveryHeader", "List outbound deliveries."),
      },
      { title: "Sales", description: "Sales orders, billing documents and outbound deliveries." },
    ),
    procurement: router(
      {
        purchaseOrders: list(c, "API_PURCHASEORDER_PROCESS_SRV", "A_PurchaseOrder", "List purchase orders."),
        purchaseOrder: get(c, "API_PURCHASEORDER_PROCESS_SRV", "A_PurchaseOrder", "Retrieve a purchase order.", "PurchaseOrder"),
        createPurchaseOrder: create(c, "API_PURCHASEORDER_PROCESS_SRV", "A_PurchaseOrder", "Create a purchase order. body is the A_PurchaseOrder JSON, including to_PurchaseOrderItem."),
        supplierInvoices: list(c, "API_SUPPLIERINVOICE_PROCESS_SRV", "A_SupplierInvoice", "List supplier invoices."),
      },
      { title: "Procurement", description: "Purchase orders and supplier invoices." },
    ),
    products: router(
      {
        list: list(c, "API_PRODUCT_SRV", "A_Product", "List products (materials)."),
        get: get(c, "API_PRODUCT_SRV", "A_Product", "Retrieve a product.", "Product"),
        descriptions: list(c, "API_PRODUCT_SRV", "A_ProductDescription", "List product descriptions."),
        plants: list(c, "API_PRODUCT_SRV", "A_ProductPlant", "List product-plant data."),
      },
      { title: "Products", description: "Product master data (API_PRODUCT_SRV)." },
    ),
    inventory: router(
      {
        materialDocuments: list(c, "API_MATERIAL_DOCUMENT_SRV", "A_MaterialDocumentHeader", "List material documents (goods movements)."),
        productionOrders: list(c, "API_PRODUCTION_ORDER_2_SRV", "A_ProductionOrder_2", "List production orders."),
      },
      { title: "Inventory and production", description: "Material documents and production orders." },
    ),
    odata: router(
      {
        list: query(
          {
            description: `List any entity set of any OData v2 service on the API server. service is the path under the host, e.g. sap/opu/odata/sap/API_BUSINESS_PARTNER (or the path of your BTP application); entity is the entity set. ${optionsDoc}`,
            input: object({ service: path, entity: path, ...odataOptions }),
          },
          async (_ctx, input) => c.call("GET", `${input.service}/${input.entity}`, toSearch(input)),
        ),
        get: query(
          {
            description:
              "Retrieve one entity. key is the OData key expression without parentheses, e.g. 'ABC' (quoted) or SalesOrder='1',Item='10'.",
            input: object({ service: path, entity: path, key: path, select: string().optional(), expand: string().optional() }),
          },
          async (_ctx, input) => c.call("GET", `${input.service}/${input.entity}(${input.key})`, toSearch(input)),
        ),
        metadata: query(
          {
            description: "Fetch the service $metadata (EDMX XML, returned as { xml }) listing entity sets, properties and function imports.",
            input: object({ service: path }),
          },
          async (_ctx, input) => c.metadata(`${input.service}/$metadata`),
        ),
        create: mutation(
          {
            description: "Create an entity in an entity set. body is the JSON entity.",
            input: object({ service: path, entity: path, body: record(json()) }),
          },
          async (_ctx, input) => c.call("POST", `${input.service}/${input.entity}`, {}, input.body, { service: input.service }),
        ),
        update: mutation(
          {
            description: `Update an entity (PATCH: only supplied properties change). key as in odata.get. ${etagDoc}`,
            input: object({ service: path, entity: path, key: path, body: record(json()), etag: string().optional() }),
          },
          async (_ctx, input) =>
            c.call("PATCH", `${input.service}/${input.entity}(${input.key})`, {}, input.body, {
              service: input.service,
              ifMatch: input.etag ?? "*",
            }),
        ),
        delete: mutation(
          {
            description: `Delete an entity by key. key as in odata.get. ${etagDoc}`,
            input: object({ service: path, entity: path, key: path, etag: string().optional() }),
          },
          async (_ctx, input) =>
            c.call("DELETE", `${input.service}/${input.entity}(${input.key})`, {}, undefined, {
              service: input.service,
              ifMatch: input.etag ?? "*",
            }),
        ),
        callFunction: mutation(
          {
            description: "Call an OData function import or action with POST, e.g. a release or cancel action. params are sent as query options.",
            input: object({ service: path, name: path, params: record(string()).optional() }),
          },
          async (_ctx, input) => c.call("POST", `${input.service}/${input.name}`, input.params ?? {}, undefined, { service: input.service }),
        ),
      },
      { title: "Any OData service", description: "Generic OData v2 access to every released API your communication user can reach." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { sapS4: sapS4.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sapS4 ?? [],
        (account) =>
          withApprovals(build(client(account as unknown as AccountFields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SAP S/4HANA Cloud",
        description: "Business partners, sales, procurement, products and any released OData API of one S/4HANA Cloud tenant.",
        icons,
        instructions:
          "Named tools cover common released APIs under /sap/opu/odata/sap; odata.* reaches any service and entity set (use odata.metadata to discover). Page with top/skip. Writes require approval.",
      },
    ),
  }),
);

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

// Acumatica is hosted per customer, so the instance URL is part of the account. The provider declares
// `hosts: ["*.acumatica.com"]` so the password reaches app code only as a handle that Executor
// substitutes on requests to Acumatica cloud hosts. Every request is built from the validated https
// instance origin below, which must be a single-level subdomain of acumatica.com.
function instanceBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Acumatica URL, for example https://mycompany.acumatica.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Acumatica instance must use https.");
  if (!/^[a-z0-9-]+\.acumatica\.com$/i.test(url.hostname) || url.port !== "") {
    throw new Error("The Acumatica instance must be a cloud address such as https://mycompany.acumatica.com; on-premises and custom domains are not supported.");
  }
  if (url.search !== "" || url.hash !== "") throw new Error("The Acumatica URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

type Fields = { instance: string; username: string; password: string; tenant: string };
type Fetch = typeof fetch;

// Acumatica's cookie sign-in: POST /entity/auth/login sets session cookies; /entity/auth/logout frees
// the licensed session. Each call signs in, does its work and signs out so sessions never pile up.
async function withSession<T>(
  fields: Fields,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  work: (call: (path: string, init?: RequestInit) => Promise<Response>) => Promise<T>,
): Promise<T> {
  const base = instanceBase(fields.instance);
  const login = await fetcher(`${base}/entity/auth/login`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: fields.username,
      password: fields.password,
      ...(fields.tenant.trim() === "" ? {} : { tenant: fields.tenant.trim() }),
    }),
  });
  if (!login.ok) throw new Error(`Acumatica sign-in failed with HTTP ${login.status}.`);
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  try {
    return await work((path, init) =>
      fetcher(`${base}${path}`, {
        ...init,
        signal,
        headers: { Accept: "application/json", Cookie: cookie, ...(init?.headers as Record<string, string> | undefined) },
      }),
    );
  } finally {
    // Deliberately unsignalled: logout must still run when the call is cancelled, or the licensed API
    // session would stay open until it times out.
    await fetcher(`${base}/entity/auth/logout`, { method: "POST", headers: { Cookie: cookie } }).catch(() => undefined);
  }
}

const acumatica = defineProvider({
  name: "Acumatica",
  hosts: ["*.acumatica.com"],
  auth: {
    // Acumatica's OAuth endpoints and client registrations are per instance, so the connection uses
    // the account's own user name and password with the contract-based REST API sign-in.
    password: secrets({
      label: "User name and password",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        tenant: plain(string()),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields;
    await withSession(fields, fetch, signal, async (call) => {
      const response = await call("/entity");
      await decodeJson(response, object({}));
    });
    const base = instanceBase(fields.instance);
    return { accountInfo: { externalId: `${base}:${fields.username}`, displayName: `${fields.username} @ ${base}` } };
  },
});

type Params = Record<string, unknown>;

const endpointDefault = "Default/24.200.001";
const endpoint = string().optional();
const odata = {
  endpoint,
  filter: string().optional(),
  select: string().optional(),
  expand: string().optional(),
  top: number().optional(),
  skip: number().optional(),
  custom: string().optional(),
};

function entityPath(input: Params, entity: string): string {
  const name = String(input.entity ?? entity);
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error("entity must be an entity name such as Customer.");
  const ep = String(input.endpoint ?? endpointDefault);
  if (!/^[A-Za-z0-9_.\-]+\/[0-9.]+$/.test(ep)) throw new Error("endpoint must look like Default/24.200.001.");
  return `/entity/${ep}/${name}`;
}

function search(input: Params): string {
  const url = new URLSearchParams();
  const map: Record<string, string> = { filter: "$filter", select: "$select", expand: "$expand", top: "$top", skip: "$skip", custom: "$custom" };
  for (const [key, name] of Object.entries(map)) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") url.set(name, String(value));
  }
  const text = url.toString();
  return text === "" ? "" : `?${text}`;
}

function recordKey(key: unknown): string {
  const parts = String(key).split("/");
  if (parts.length === 0 || parts.some((part) => part === "")) throw new Error("key must be a record id (GUID) or key segments joined by '/'.");
  return parts.map(encodeURIComponent).join("/");
}

async function send(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, path: string, init: RequestInit = {}) {
  return withSession(fields, fetcher, signal, async (call) => {
    const response = await call(path, {
      ...init,
      headers: init.body === undefined ? {} : { "Content-Type": "application/json" },
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  });
}

const payload = record(json());

function crud(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, entity: string, noun: string) {
  const dynamic = entity === "";
  const entityInput: Record<string, ReturnType<typeof string>> = dynamic ? { entity: string() } : {};
  return {
    list: query(
      {
        description: `List ${noun} records. Use filter (OData, e.g. "Status eq 'Active'"), select, expand, top and skip; pages are not cursor based, so page with top and skip.`,
        input: object({ ...entityInput, ...odata }),
      },
      async (_ctx, input: Params) => send(fields, fetcher, signal, `${entityPath(input, entity)}${search(input)}`),
    ),
    get: query(
      {
        description: `Retrieve one ${noun} by its id (GUID) or its key segments joined by '/' (for example a sales order's type and number: SO/000123).`,
        input: object({ ...entityInput, key: string(), endpoint, select: string().optional(), expand: string().optional(), custom: string().optional() }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${entityPath(input, entity)}/${recordKey(input.key)}${search({ ...input, filter: undefined })}`),
    ),
    createOrUpdate: mutation(
      {
        description: `Create or update a ${noun}. Acumatica's PUT creates a record when the key fields are new and updates it when they exist. body uses Acumatica's wrapped values, e.g. {"CustomerID": {"value": "ABARTENDE"}}.`,
        input: object({ ...entityInput, endpoint, body: payload, select: string().optional(), expand: string().optional() }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${entityPath(input, entity)}${search({ ...input, filter: undefined })}`, {
          method: "PUT",
          body: JSON.stringify(input.body),
        }),
    ),
    delete: mutation(
      {
        description: `Delete a ${noun} by id (GUID) or key segments joined by '/'.`,
        input: object({ ...entityInput, key: string(), endpoint }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${entityPath(input, entity)}/${recordKey(input.key)}`, { method: "DELETE" }),
    ),
  };
}

const entities: ReadonlyArray<[string, string, string]> = [
  ["customers", "Customer", "customer"],
  ["vendors", "Vendor", "vendor"],
  ["contacts", "Contact", "contact"],
  ["leads", "Lead", "lead"],
  ["opportunities", "Opportunity", "opportunity"],
  ["cases", "Case", "support case"],
  ["employees", "Employee", "employee"],
  ["stockItems", "StockItem", "stock item"],
  ["nonStockItems", "NonStockItem", "non-stock item"],
  ["salesOrders", "SalesOrder", "sales order"],
  ["salesInvoices", "SalesInvoice", "sales invoice"],
  ["shipments", "Shipment", "shipment"],
  ["purchaseOrders", "PurchaseOrder", "purchase order"],
  ["purchaseReceipts", "PurchaseReceipt", "purchase receipt"],
  ["bills", "Bill", "bill"],
  ["payments", "Payment", "payment"],
  ["checks", "Check", "check"],
  ["journalTransactions", "JournalTransaction", "journal transaction"],
  ["accounts", "Account", "general ledger account"],
  ["projects", "Project", "project"],
  ["projectTasks", "ProjectTask", "project task"],
  ["expenseReceipts", "ExpenseReceipt", "expense receipt"],
  ["expenseClaims", "ExpenseClaim", "expense claim"],
  ["warehouses", "Warehouse", "warehouse"],
];

export default defineApp(
  { user: { accounts: { acumatica: acumatica.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.acumatica ?? [],
        (account) => {
          const fields = account.fields;
          const named = Object.fromEntries(
            entities.map(([key, entity, noun]) => [key, router(crud(fields, fetch, signal, entity, noun), { title: noun, description: `Acumatica ${entity} entity.` })]),
          );
          return withApprovals(
            router({
              endpoints: query(
                { description: "List the web service endpoints and versions the instance exposes (name and version go into every tool's endpoint input as Name/Version).", input: object({}) },
                async () => send(fields, fetch, signal, "/entity"),
              ),
              schema: query(
                { description: "Retrieve an endpoint's entity schema or OpenAPI document (Default/24.200.001 by default) to discover entities and fields, including customizations.", input: object({ endpoint }) },
                async (_ctx, input: Params) => {
                  const ep = String(input.endpoint ?? endpointDefault);
                  if (!/^[A-Za-z0-9_.\-]+\/[0-9.]+$/.test(ep)) throw new Error("endpoint must look like Default/24.200.001.");
                  return send(fields, fetch, signal, `/entity/${ep}/swagger.json`);
                },
              ),
              entity: router(crud(fields, fetch, signal, "", "record of any entity"), {
                title: "Any entity",
                description: "The same operations for any entity of the endpoint, including customized ones: pass entity (for example Customer) and the operation's other inputs.",
              }),
              action: mutation(
                {
                  description: "Invoke an entity action, for example ReleaseInvoice or ConfirmShipment. body is {\"entity\": {...key fields with wrapped values}}. Returns when the action starts; Acumatica answers 202 for long-running actions.",
                  input: object({ entity: string(), action: string(), endpoint, body: payload }),
                },
                async (_ctx, input: Params) => {
                  const action = String(input.action);
                  if (!/^[A-Za-z0-9_]+$/.test(action)) throw new Error("action must be an action name such as ReleaseInvoice.");
                  return send(fields, fetch, signal, `${entityPath(input, "")}/${action}`, { method: "POST", body: JSON.stringify(input.body) });
                },
              ),
              inquiry: query(
                {
                  description: "Read a generic inquiry published for OData (Generic Inquiry > Expose via OData) by its name, with optional OData filter, select, top and skip.",
                  input: object({ name: string(), filter: string().optional(), select: string().optional(), top: number().optional(), skip: number().optional() }),
                },
                async (_ctx, input: Params) => {
                  const name = String(input.name);
                  if (!/^[A-Za-z0-9_\- ]+$/.test(name)) throw new Error("name must be the generic inquiry's name.");
                  const tenant = fields.tenant.trim() || "";
                  const segment = tenant === "" ? "" : `/${encodeURIComponent(tenant)}`;
                  return send(fields, fetch, signal, `/odata${segment}/${encodeURIComponent(name)}${search(input)}`);
                },
              ),
              ...named,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Acumatica",
        description:
          "Acumatica cloud ERP: customers, vendors, sales orders, invoices, bills, payments, inventory, purchasing, projects, plus any entity, entity actions and generic inquiries.",
        instructions:
          "Acumatica's contract-based REST API wraps every field as {\"value\": ...} in requests and responses. The default endpoint is Default/24.200.001; call endpoints to see which versions the instance serves and pass endpoint to use another. Use filter (OData $filter), select, expand, top and skip on list tools. A record's key is its id (GUID) or key segments joined by '/'. createOrUpdate is an upsert. Custom entities and fields appear under the entity.* tools; call schema to discover them.",
        icons,
      },
    ),
  }),
);

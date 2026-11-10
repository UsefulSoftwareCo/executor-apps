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

// WooCommerce is self-hosted: every store has its own domain, so the store URL is part of the account.
// The provider declares no `hosts` (store domains are arbitrary and the framework only accepts static lists),
// so the consumer secret is not host-restricted by the framework. Mitigation: requests are always built from the
// account's own store URL, and only https is accepted (WooCommerce sends keys by HTTP Basic only over https).
// Sub-directory installs (https://example.com/shop) keep their path.
function storeBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your store URL, for example https://shop.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The store must use https; WooCommerce accepts API keys over HTTP Basic only on https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The store URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const woocommerce = defineProvider({
  name: "WooCommerce",
  auth: {
    // Create keys in WooCommerce > Settings > Advanced > REST API (Add key). WooCommerce has no OAuth for the REST API
    // that users can set up themselves (the legacy /wc-auth/v1/authorize flow only hands back keys).
    apiKey: secrets({
      label: "REST API keys",
      fields: object({
        storeUrl: plain(string({ minLength: 1 })),
        consumerKey: string({ minLength: 1 }),
        consumerSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = storeBase(account.fields.storeUrl);
    const basic = btoa(`${account.fields.consumerKey}:${account.fields.consumerSecret}`);
    const response = await fetch(`${base}/wp-json/wc/v3/system_status/tools`, {
      signal,
      headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: base, displayName: base } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(account: { fields: { storeUrl: string; consumerKey: string; consumerSecret: string } }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = `${storeBase(account.fields.storeUrl)}/wp-json/wc/v3`;
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) url.searchParams.set(key, value.map(String).join(","));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const basic = btoa(`${account.fields.consumerKey}:${account.fields.consumerSecret}`);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

function pathInputs(ids: readonly string[]) {
  return Object.fromEntries(ids.map((id) => [id, number()]));
}

function fill(path: string, ids: readonly string[], input: Params): string {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function read(call: Call, path: string, description: string, ids: readonly string[] = [], stringIds: readonly string[] = []) {
  return query(
    {
      description,
      input: object({
        ...pathInputs(ids.filter((id) => !stringIds.includes(id))),
        ...Object.fromEntries(stringIds.map((id) => [id, string()])),
        query: filters,
      }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(
  call: Call,
  method: Exclude<Method, "GET">,
  path: string,
  description: string,
  ids: readonly string[] = [],
  hasBody: boolean | "optional" = true,
  stringIds: readonly string[] = [],
) {
  return mutation(
    {
      description,
      input: object({
        ...pathInputs(ids.filter((id) => !stringIds.includes(id))),
        ...Object.fromEntries(stringIds.map((id) => [id, string()])),
        query: filters,
        ...(hasBody === "optional" ? { body: optionalPayload } : hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, ids, input), (input.query as Params | undefined) ?? {}, hasBody ? (input.body as Params | undefined) : undefined),
  );
}

interface Crud {
  segment: string;
  noun: string;
  plural: string;
  /** Parent path ids, e.g. product_id for /products/{product_id}/variations. */
  parents?: readonly string[];
  parentPath?: string;
  create?: boolean;
  update?: boolean;
  remove?: boolean;
  batch?: boolean;
  listHint?: string;
}

function crud(call: Call, options: Crud) {
  const { segment, noun, plural, parents = [], parentPath = "", listHint } = options;
  const collection = `${parentPath}/${segment}`;
  const item = `${collection}/{id}`;
  const itemIds = [...parents, "id"];
  const tools: Record<string, ReturnType<typeof read> | ReturnType<typeof write>> = {
    list: read(
      call,
      collection,
      `List ${plural}. Filters go in query (page, per_page up to 100, search, orderby, order${listHint ? `, ${listHint}` : ""}). Page totals are not returned, so keep paging until a page is short.`,
      parents,
    ),
    get: read(call, item, `Retrieve one ${noun} by id.`, itemIds),
  };
  if (options.create !== false) tools.create = write(call, "POST", collection, `Create a ${noun}. body is the ${noun} object from the WooCommerce REST API reference.`, parents);
  if (options.update !== false) tools.update = write(call, "PUT", item, `Update a ${noun}. body holds the fields to change.`, itemIds);
  if (options.remove !== false) {
    tools.delete = write(
      call,
      "DELETE",
      item,
      `Delete a ${noun}. Pass query { force: true } to delete permanently; most resources require it.`,
      itemIds,
      false,
    );
  }
  if (options.batch !== false && options.create !== false) {
    tools.batch = write(
      call,
      "POST",
      `${collection}/batch`,
      `Create, update and delete several ${plural} in one request. body: { create: [...], update: [{ id, ... }], delete: [ids] }.`,
      parents,
    );
  }
  return tools;
}

function build(call: Call) {
  const orderIds = ["order_id"] as const;
  const productIds = ["product_id"] as const;
  return router({
    products: router(
      {
        ...crud(call, { segment: "products", noun: "product", plural: "products", listHint: "status, type, sku, category, tag, stock_status, on_sale, min_price, max_price" }),
        variations: router(
          crud(call, { segment: "variations", noun: "product variation", plural: "product variations", parents: productIds, parentPath: "/products/{product_id}" }),
          { title: "Product variations", description: "Variations of a variable product." },
        ),
        categories: router(crud(call, { segment: "products/categories", noun: "product category", plural: "product categories", listHint: "parent, hide_empty, slug" }), {
          title: "Product categories",
          description: "Product category tree.",
        }),
        tags: router(crud(call, { segment: "products/tags", noun: "product tag", plural: "product tags", listHint: "hide_empty, slug" }), {
          title: "Product tags",
          description: "Product tags.",
        }),
        shippingClasses: router(crud(call, { segment: "products/shipping_classes", noun: "product shipping class", plural: "product shipping classes" }), {
          title: "Shipping classes",
          description: "Product shipping classes.",
        }),
        attributes: router(
          {
            ...crud(call, { segment: "products/attributes", noun: "product attribute", plural: "product attributes" }),
            terms: router(
              crud(call, { segment: "terms", noun: "attribute term", plural: "attribute terms", parents: ["attribute_id"], parentPath: "/products/attributes/{attribute_id}" }),
              { title: "Attribute terms", description: "Terms of a global product attribute." },
            ),
          },
          { title: "Product attributes", description: "Global product attributes and their terms." },
        ),
        reviews: router(crud(call, { segment: "products/reviews", noun: "product review", plural: "product reviews", listHint: "product, status, reviewer" }), {
          title: "Product reviews",
          description: "Customer reviews on products.",
        }),
      },
      { title: "Products", description: "Catalog products, variations, categories, tags, attributes and reviews." },
    ),
    orders: router(
      {
        ...crud(call, { segment: "orders", noun: "order", plural: "orders", listHint: "status, customer, product, after, before, dates_are_gmt" }),
        notes: router(
          crud(call, { segment: "notes", noun: "order note", plural: "order notes", parents: orderIds, parentPath: "/orders/{order_id}", update: false, batch: false }),
          { title: "Order notes", description: "Private and customer notes on an order. create body: { note, customer_note }." },
        ),
        refunds: router(
          crud(call, { segment: "refunds", noun: "order refund", plural: "order refunds", parents: orderIds, parentPath: "/orders/{order_id}", update: false, batch: false }),
          { title: "Order refunds", description: "Refunds on an order. create body: { amount, reason, api_refund, line_items }." },
        ),
      },
      { title: "Orders", description: "Orders, their notes and refunds." },
    ),
    customers: router(
      {
        ...crud(call, { segment: "customers", noun: "customer", plural: "customers", listHint: "email, role" }),
        downloads: read(call, "/customers/{id}/downloads", "List a customer's downloadable products.", ["id"]),
      },
      { title: "Customers", description: "Customer accounts." },
    ),
    coupons: router(crud(call, { segment: "coupons", noun: "coupon", plural: "coupons", listHint: "code" }), { title: "Coupons", description: "Discount coupons." }),
    shipping: router(
      {
        zones: router(
          {
            ...crud(call, { segment: "shipping/zones", noun: "shipping zone", plural: "shipping zones", batch: false }),
            locations: router(
              {
                list: read(call, "/shipping/zones/{zone_id}/locations", "List the locations (countries, states, postcodes) of a shipping zone.", ["zone_id"]),
                update: mutation(
                  { description: "Replace a zone's locations. locations: array of { code, type } where type is postcode, state, country or continent.", input: object({ zone_id: number(), locations: array(record(json())) }) },
                  async (_ctx, input: Params) => call("PUT", `/shipping/zones/${String(input.zone_id)}/locations`, {}, input.locations as unknown as Params),
                ),
              },
              { title: "Zone locations", description: "Where a shipping zone applies." },
            ),
            methods: router(
              {
                list: read(call, "/shipping/zones/{zone_id}/methods", "List shipping methods enabled on a zone.", ["zone_id"]),
                get: read(call, "/shipping/zones/{zone_id}/methods/{id}", "Retrieve one shipping method instance on a zone.", ["zone_id", "id"]),
                create: write(call, "POST", "/shipping/zones/{zone_id}/methods", "Add a shipping method to a zone. body: { method_id: 'flat_rate' | 'free_shipping' | 'local_pickup', ... }.", ["zone_id"]),
                update: write(call, "PUT", "/shipping/zones/{zone_id}/methods/{id}", "Update a zone shipping method (order, enabled, settings).", ["zone_id", "id"]),
                delete: write(call, "DELETE", "/shipping/zones/{zone_id}/methods/{id}", "Remove a shipping method from a zone. Pass query { force: true }.", ["zone_id", "id"], false),
              },
              { title: "Zone methods", description: "Shipping methods configured on a zone." },
            ),
          },
          { title: "Shipping zones", description: "Shipping zones, their locations and methods." },
        ),
        methods: router(
          {
            list: read(call, "/shipping_methods", "List shipping method types available in the store."),
            get: read(call, "/shipping_methods/{id}", "Retrieve one shipping method type.", [], ["id"]),
          },
          { title: "Shipping method types", description: "Installed shipping method types." },
        ),
      },
      { title: "Shipping", description: "Shipping zones and methods." },
    ),
    taxes: router(
      {
        rates: router(crud(call, { segment: "taxes", noun: "tax rate", plural: "tax rates", listHint: "class" }), { title: "Tax rates", description: "Tax rates." }),
        classes: router(
          {
            list: read(call, "/taxes/classes", "List tax classes."),
            create: write(call, "POST", "/taxes/classes", "Create a tax class. body: { name }."),
            delete: write(call, "DELETE", "/taxes/classes/{slug}", "Delete a tax class by slug. Pass query { force: true }.", ["slug"], false, ["slug"]),
          },
          { title: "Tax classes", description: "Tax classes." },
        ),
      },
      { title: "Taxes", description: "Tax rates and classes." },
    ),
    paymentGateways: router(
      {
        list: read(call, "/payment_gateways", "List payment gateways and whether they are enabled."),
        get: read(call, "/payment_gateways/{id}", "Retrieve one payment gateway by id (for example bacs, cheque, cod, paypal).", [], ["id"]),
        update: mutation(
          { description: "Update a payment gateway (enabled, title, order, settings). body holds the fields to change.", input: object({ id: string(), body: payload }) },
          async (_ctx, input: Params) => call("PUT", `/payment_gateways/${encodeURIComponent(String(input.id))}`, {}, input.body as Params),
        ),
      },
      { title: "Payment gateways", description: "Installed payment gateways." },
    ),
    webhooks: router(
      crud(call, { segment: "webhooks", noun: "webhook", plural: "webhooks", listHint: "status" }),
      { title: "Webhooks", description: "Webhook subscriptions. create body: { name, topic (e.g. order.created), delivery_url, secret }." },
    ),
    settings: router(
      {
        groups: read(call, "/settings", "List setting groups (general, products, tax, shipping, ...)."),
        group: read(call, "/settings/{group_id}", "List all options in a setting group.", [], ["group_id"]),
        option: read(call, "/settings/{group_id}/{id}", "Retrieve one setting option.", [], ["group_id", "id"]),
        update: mutation(
          { description: "Update a setting option's value. body: { value }.", input: object({ group_id: string(), id: string(), body: payload }) },
          async (_ctx, input: Params) =>
            call("PUT", `/settings/${encodeURIComponent(String(input.group_id))}/${encodeURIComponent(String(input.id))}`, {}, input.body as Params),
        ),
      },
      { title: "Settings", description: "Store settings." },
    ),
    reports: router(
      {
        list: read(call, "/reports", "List available reports."),
        sales: read(call, "/reports/sales", "Sales report. Query: period (week, month, last_month, year) or date_min/date_max (YYYY-MM-DD)."),
        topSellers: read(call, "/reports/top_sellers", "Top selling products. Query: period or date_min/date_max."),
        couponsTotals: read(call, "/reports/coupons/totals", "Coupon counts by type."),
        customersTotals: read(call, "/reports/customers/totals", "Customer counts by type."),
        ordersTotals: read(call, "/reports/orders/totals", "Order counts by status."),
        productsTotals: read(call, "/reports/products/totals", "Product counts by type."),
        reviewsTotals: read(call, "/reports/reviews/totals", "Review counts by rating."),
      },
      { title: "Reports", description: "Legacy sales and totals reports." },
    ),
    system: router(
      {
        status: read(call, "/system_status", "Environment, database, theme, plugin and settings status of the store."),
        tools: read(call, "/system_status/tools", "List system maintenance tools."),
        runTool: write(call, "PUT", "/system_status/tools/{id}", "Run a system tool (for example clear_transients).", ["id"], "optional", ["id"]),
        data: read(call, "/data", "List data endpoints (continents, countries, currencies)."),
        countries: read(call, "/data/countries", "List countries and their states."),
        currencies: read(call, "/data/currencies", "List currencies."),
        currentCurrency: read(call, "/data/currencies/current", "The store's current currency."),
      },
      { title: "System", description: "System status and reference data." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { woocommerce: woocommerce.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.woocommerce ?? [],
        (account) => withApprovals(build(client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "WooCommerce",
        description:
          "Manage a WooCommerce store: products and variations, categories, orders with notes and refunds, customers, coupons, shipping zones, taxes, payment gateways, webhooks, settings and reports. Pass filters in query and fields in body.",
        icons,
      },
    ),
  }),
);

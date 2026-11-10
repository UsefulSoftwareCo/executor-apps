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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every MerchantPro store serves the API from its own domain under /api/v2. Store domains are
// arbitrary (custom domains), so the provider declares no `hosts`: the framework only accepts
// static lists. Consequence: the apiSecret is readable by app code (not injected by the host).
// Removing that exposure needs per-account hosts in the framework. Mitigations: https is
// required, redirects are never followed, and every request is pinned to the account's own origin.
function origin(account: { fields: { store: string } }) {
  const text = account.fields.store.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your MerchantPro store domain, for example www.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The MerchantPro store must use https.");
  return url.origin;
}

function authHeader(account: { fields: { apiUser: string; apiSecret: string } }) {
  return `Basic ${btoa(`${account.fields.apiUser}:${account.fields.apiSecret}`)}`;
}

const merchantpro = defineProvider({
  name: "MerchantPro",
  auth: {
    // Created in the store admin under Settings > API and webhooks > API Users.
    apiUser: secrets({
      label: "API user",
      fields: object({
        store: plain(string({ minLength: 1 })),
        apiUser: plain(string({ minLength: 1 })),
        apiSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/v2/taxonomy/currencies`, {
      signal,
      redirect: "manual",
      headers: { Authorization: authHeader(account), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

type Params = Record<string, string | number | undefined>;

function client(base: string, authorization: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#") || path.includes(".."))
      throw new Error("path must not contain ?, # or ..; use the query field");
    const url = new URL(`${base}/api/v2/${path.replace(/^\/+/, "")}`);
    if (url.origin !== base || !url.pathname.startsWith("/api/v2/"))
      throw new Error("path must stay under /api/v2 on the store host");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        redirect: "manual",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    let response = await send();
    for (let attempt = 0; attempt < 3 && method === "GET" && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1), 10_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Filter = record(string());

const listDoc =
  "Offset-paged (start, default 0; limit, default 20, max 100); the response meta.links.next is null on the last page. filters maps filter names to values, for example {\"customer_email\": \"a@b.com\"}; fields limits the returned fields; include loads extra data in the same request (for example \"description,variants\"); sort is a field, with an optional .desc suffix. Valid filters are listed on the resource's docs page.";

type Ops = "list" | "get" | "create" | "update" | "delete";

// One MerchantPro resource: https://docs.merchantpro.com/api/endpoints/<docs>
function resourceTools(call: Call, path: string, docs: string, ops: readonly Ops[], noun: string) {
  const tools: Record<string, any> = {};
  const ref = `https://docs.merchantpro.com/api/endpoints/${docs}`;
  if (ops.includes("list"))
    tools.list = query(
      {
        description: `List ${noun}. ${listDoc}`,
        input: object({
          filters: Filter.optional(),
          fields: string().optional(),
          include: string().optional(),
          sort: string().optional(),
          start: number().optional(),
          limit: number().optional(),
        }),
      },
      (_c, { filters, fields, include, sort, start, limit }) =>
        call("GET", path, { ...(filters ?? {}), fields, include, sort, start, limit }),
    );
  if (ops.includes("get"))
    tools.get = query(
      {
        description: `Get one of ${noun} by id. fields and include behave as in list.`,
        input: object({ id: id(), fields: string().optional(), include: string().optional() }),
      },
      (_c, { id: i, fields, include }) => call("GET", `${path}/${seg(i)}`, { fields, include }),
    );
  if (ops.includes("create"))
    tools.create = mutation(
      {
        description: `Create a record in ${noun}. body is the JSON object described at ${ref}.`,
        input: object({ body: json() }),
        approval: always(),
      },
      (_c, { body }) => call("POST", path, {}, body),
    );
  if (ops.includes("update"))
    tools.update = mutation(
      {
        description: `Update a record in ${noun} (PATCH): body holds only the fields to change, see ${ref}.`,
        input: object({ id: id(), body: json() }),
        approval: always(),
      },
      (_c, { id: i, body }) => call("PATCH", `${path}/${seg(i)}`, {}, body),
    );
  if (ops.includes("delete"))
    tools.delete = mutation(
      { description: `Delete a record from ${noun}.`, input: object({ id: id() }), approval: always() },
      (_c, { id: i }) => call("DELETE", `${path}/${seg(i)}`),
    );
  return tools;
}

const all: Ops[] = ["list", "get", "create", "update", "delete"];
const read: Ops[] = ["list", "get"];

function metaFields(call: Call, path: string, noun: string) {
  return {
    getMetaFields: query(
      { description: `Read the meta fields of a record in ${noun}.`, input: object({ id: id() }) },
      (_c, { id: i }) => call("GET", `${path}/${seg(i)}/meta_fields`),
    ),
    updateMetaFields: mutation(
      {
        description: `Modify the meta fields of a record in ${noun}. body maps meta field keys to values; see the resource's docs page.`,
        input: object({ id: id(), body: json() }),
        approval: always(),
      },
      (_c, { id: i, body }) => call("PATCH", `${path}/${seg(i)}/meta_fields`, {}, body),
    ),
  };
}

const orderAction = (call: Call, action: string, description: string) =>
  mutation(
    {
      description,
      input: object({ id: id(), sendEmail: string().optional() }),
      approval: always(),
    },
    (_c, { id: i, sendEmail }) =>
      call("PATCH", `orders/${seg(i)}/${action}`, sendEmail === undefined ? {} : { "opt[send_email]": sendEmail }, {}),
  );

const orderBodyAction = (call: Call, action: string, description: string, verb = "PATCH") =>
  mutation(
    { description, input: object({ id: id(), body: json() }), approval: always() },
    (_c, { id: i, body }) => call(verb, `orders/${seg(i)}/${action}`, {}, body),
  );

const taxonomy = (call: Call, name: string, noun: string) =>
  query({ description: `List the shop's ${noun}.`, input: object({}) }, () => call("GET", `taxonomy/${name}`));

function build(call: Call) {
  const t = (path: string, docs: string, ops: readonly Ops[], noun: string) => resourceTools(call, path, docs, ops, noun);
  const r = (path: string, docs: string, ops: readonly Ops[], noun: string) => router(t(path, docs, ops, noun));

  return router({
    products: router({
      ...t("products", "products", all, "products"),
      updateVariant: mutation(
        {
          description:
            "Update one variant of a product (PATCH /products/{id}/variants/{variantId}): sku, ean, erp_id, ext_ref, weight, dimensions or visibility.",
          input: object({ id: id(), variantId: id(), body: json() }),
          approval: always(),
        },
        (_c, { id: i, variantId, body }) => call("PATCH", `products/${seg(i)}/variants/${seg(variantId)}`, {}, body),
      ),
      listImages: query(
        { description: "List a product's images.", input: object({ id: id() }) },
        (_c, { id: i }) => call("GET", `products/${seg(i)}/images`),
      ),
      addImages: mutation(
        {
          description: "Add images to a product by url or base64 (POST /products/{id}/images). URL imports are queued. body follows the docs page.",
          input: object({ id: id(), body: json() }),
          approval: always(),
        },
        (_c, { id: i, body }) => call("POST", `products/${seg(i)}/images`, {}, body),
      ),
    }),
    categories: router({
      ...t("categories", "categories", all, "categories"),
      ...metaFields(call, "categories", "categories"),
    }),
    orders: router({
      ...t("orders", "orders", ["list", "get", "create", "update"], "orders"),
      inProcess: orderAction(call, "in_process", "Mark an order in process. sendEmail \"1\" sends the customer notification, \"0\" suppresses it."),
      shipped: orderAction(call, "shipped", "Mark an order shipped. sendEmail \"1\" sends the customer notification, \"0\" suppresses it."),
      delivered: orderAction(call, "delivered", "Mark an order delivered. sendEmail \"1\" sends the customer notification, \"0\" suppresses it."),
      cancelled: orderAction(call, "cancelled", "Cancel an order. sendEmail \"1\" sends the customer notification, \"0\" suppresses it."),
      returned: orderAction(call, "returned", "Mark an order returned. sendEmail \"1\" sends the customer notification, \"0\" suppresses it."),
      attachInvoice: orderBodyAction(call, "attach_invoice", "Attach an invoice PDF: body has prefix, number and base64."),
      createInvoice: orderBodyAction(call, "create_invoice", "Create an invoice through a billing app: body has app (for example \"billing\") and prefix."),
      reverseInvoice: orderBodyAction(call, "reverse_invoice", "Reverse an invoice: body has invoice_id."),
      shippingAwb: orderBodyAction(call, "shipping_awb", "Set the shipping AWB: body has shipping_awb, optional base64 (PDF) and carrier_id."),
      createFulfillment: orderBodyAction(call, "create_fulfillment", "Create a carrier fulfillment: body has carrier_id and parcel details; see the orders docs page."),
      addInternalNote: orderBodyAction(call, "internal_notes", "Add an internal note: body is {\"text\": \"...\"}.", "POST"),
      addTag: orderBodyAction(call, "tags", "Tag an order: body is {\"name\": \"...\"}.", "POST"),
    }),
    customers: router({
      ...t("customers", "customers", all, "customers"),
      ...metaFields(call, "customers", "customers"),
    }),
    inventory: router({
      get: query(
        { description: "Fetch one inventory unit by id.", input: object({ id: id() }) },
        (_c, { id: i }) => call("GET", `inventory/id/${seg(i)}`),
      ),
      update: mutation(
        {
          description: "Modify an inventory unit looked up by id, sku or ean (PATCH /inventory/{by}/{value}). body holds the fields to change.",
          input: object({ by: string({ minLength: 1 }), value: id(), body: json() }),
          approval: always(),
        },
        (_c, { by, value, body }) => {
          if (!["id", "sku", "ean"].includes(by)) throw new Error("by must be id, sku or ean");
          return call("PATCH", `inventory/${by}/${seg(value)}`, {}, body);
        },
      ),
      setStock: mutation(
        {
          description: "Set stock for one unit; body identifies the unit by id, sku or ean and carries the stock values.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("PATCH", "inventory/stock", {}, body),
      ),
      setStockBatch: mutation(
        { description: "Set stock for up to 20 units at once.", input: object({ body: json() }), approval: always() },
        (_c, { body }) => call("PATCH", "inventory/stock/batch", {}, body),
      ),
      setPrices: mutation(
        {
          description: "Set prices for one unit; body identifies the unit by id, sku or ean and carries the prices.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("PATCH", "inventory/prices", {}, body),
      ),
      setPricesBatch: mutation(
        { description: "Set prices for up to 20 units at once.", input: object({ body: json() }), approval: always() },
        (_c, { body }) => call("PATCH", "inventory/prices/batch", {}, body),
      ),
    }),
    discountRules: router({
      list: query(
        {
          description: "List discount rules in a scope (cart, coupon, price or product). Needs the discounts permission. start and limit page the results.",
          input: object({ scope: id(), sort: string().optional(), start: number().optional(), limit: number().optional() }),
        },
        (_c, { scope, sort, start, limit }) => call("GET", `discount_rules/${seg(scope)}`, { sort, start, limit }),
      ),
      get: query(
        { description: "Fetch one discount rule.", input: object({ scope: id(), id: id() }) },
        (_c, { scope, id: i }) => call("GET", `discount_rules/${seg(scope)}/${seg(i)}`),
      ),
      create: mutation(
        {
          description: "Create a discount rule in a scope; body per https://docs.merchantpro.com/api/endpoints/discount_rules.",
          input: object({ scope: id(), body: json() }),
          approval: always(),
        },
        (_c, { scope, body }) => call("POST", `discount_rules/${seg(scope)}`, {}, body),
      ),
      update: mutation(
        { description: "Modify a discount rule (PATCH).", input: object({ scope: id(), id: id(), body: json() }), approval: always() },
        (_c, { scope, id: i, body }) => call("PATCH", `discount_rules/${seg(scope)}/${seg(i)}`, {}, body),
      ),
      delete: mutation(
        { description: "Remove a discount rule.", input: object({ scope: id(), id: id() }), approval: always() },
        (_c, { scope, id: i }) => call("DELETE", `discount_rules/${seg(scope)}/${seg(i)}`),
      ),
      duplicate: mutation(
        {
          description:
            "Copy a discount rule; the copy lands right after the original. body requires a unique internal_name and may carry external_code and status (active or inactive), for example {\"internal_name\": \"Summer sale copy\"}.",
          input: object({ scope: id(), id: id(), body: json() }),
          approval: always(),
        },
        (_c, { scope, id: i, body }) => call("POST", `discount_rules/${seg(scope)}/${seg(i)}/duplicate`, {}, body),
      ),
      listCoupons: query(
        { description: "List coupon codes of a coupon-scope rule.", input: object({ ruleId: id() }) },
        (_c, { ruleId }) => call("GET", `discount_rules/${seg(ruleId)}/coupons`),
      ),
      addCoupon: mutation(
        { description: "Add a coupon code to a coupon-scope rule.", input: object({ ruleId: id(), body: json() }), approval: always() },
        (_c, { ruleId, body }) => call("POST", `discount_rules/${seg(ruleId)}/coupons`, {}, body),
      ),
      removeCoupon: mutation(
        { description: "Remove a coupon by its id (not its code).", input: object({ ruleId: id(), couponId: id() }), approval: always() },
        (_c, { ruleId, couponId }) => call("DELETE", `discount_rules/${seg(ruleId)}/coupons/${seg(couponId)}`),
      ),
    }),
    brands: r("brands", "brands", read, "brands"),
    suppliers: r("suppliers", "suppliers", read, "suppliers"),
    attributes: r("attributes", "attributes", read, "product attributes"),
    attributeGroups: r("attribute_groups", "attribute_groups", read, "attribute groups"),
    productLines: r("product_lines", "product-lines", read, "product lines"),
    productTags: r("product_tags", "product-tags", read, "product tags"),
    productReviews: r("product_reviews", "product_reviews", read, "product reviews"),
    productPriceChanges: r("product_price_changes", "product_price_changes", ["list"], "product price changes"),
    productStockChanges: r("product_stock_changes", "product_stock_changes", ["list"], "product stock changes"),
    priceLists: r("price_lists", "price_lists", read, "price lists"),
    customerGroups: r("customer_groups", "customer_groups", read, "customer groups"),
    customerSubscriptions: r("customer_subscriptions", "customer_subscriptions", read, "customer subscriptions"),
    newsletterSubscribers: r("newsletter_subscribers", "newsletter_subscribers", read, "newsletter subscribers"),
    abandonedCarts: r("abandoned_carts", "abandoned_carts", read, "abandoned carts"),
    articles: r("articles", "articles", read, "blog articles"),
    blogCategories: r("blog_categories", "blog-categories", read, "blog categories"),
    sitePages: r("site_pages", "site-pages", read, "site pages"),
    locations: router({
      countries: router(t("locations/countries", "locations", read, "countries")),
      states: router(t("locations/states", "locations", read, "states (needs country_id or country_code in filters)")),
      cities: router(t("locations/cities", "locations", read, "cities (needs country_id or country_code in filters)")),
    }),
    shippingPackages: r("shipping_packages", "shipping-packages", ["list"], "shipping packages"),
    taxonomy: router({
      currencies: taxonomy(call, "currencies", "storefront currencies"),
      languages: taxonomy(call, "languages", "languages"),
      measurementUnits: taxonomy(call, "measurement_units", "measurement units"),
      orderStatuses: taxonomy(call, "order_statuses", "order statuses"),
      paymentMethods: taxonomy(call, "payment_methods", "payment methods"),
      shippingCarriers: taxonomy(call, "shipping_carriers", "shipping carriers"),
      shippingMethods: taxonomy(call, "shipping_methods", "shipping methods"),
      shippingZones: taxonomy(call, "shipping_zones", "shipping zones"),
      taxes: taxonomy(call, "taxes", "tax rates"),
      warehouses: taxonomy(call, "warehouses", "active warehouses"),
      metaFields: query(
        { description: "List custom (meta) fields for an entity type such as product, category or customer.", input: object({ type: id() }) },
        (_c, { type }) => call("GET", `taxonomy/meta_fields/${seg(type)}`),
      ),
    }),
    api: router({
      request: mutation(
        {
          description:
            "Escape hatch for any MerchantPro API v2 endpoint without a dedicated tool (see https://docs.merchantpro.com/api/). path is relative to /api/v2 (for example \"suppliers/12\"), with no query string; query holds query parameters; body is the JSON body for POST and PATCH.",
          input: object({
            method: string({ minLength: 1 }),
            path: string({ minLength: 1 }),
            query: Filter.optional(),
            body: json().optional(),
          }),
          approval: always(),
        },
        (_c, { method, path, query: q, body }) => {
          const verb = method.toUpperCase();
          if (!["GET", "POST", "PATCH", "DELETE"].includes(verb))
            throw new Error("method must be GET, POST, PATCH or DELETE");
          return call(verb, path, q ?? {}, body);
        },
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { merchantpro: merchantpro.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.merchantpro ?? [],
        (account) => build(client(origin(account), authHeader(account), fetch, signal)),
        { signal },
      ),
      {
        title: "MerchantPro",
        description:
          "Manage a MerchantPro store: products, categories, orders, customers, inventory, discount rules, content and taxonomy.",
        icons,
      },
    ),
  }),
);

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

// Every CloudCart store serves its API from its own host under /api/v2. Hosted stores live on
// *.cloudcart.com or *.cloudcart.net; custom store domains are not supported.
const hostPattern = /^[a-z0-9][a-z0-9.-]*\.cloudcart\.(com|net)$/;

function origin(account: { fields: { store: string } }) {
  const host = account.fields.store
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error(
      "Enter your CloudCart store domain, for example mystore.cloudcart.com. Only *.cloudcart.com and *.cloudcart.net hosts are supported.",
    );
  return `https://${host}`;
}

const cloudcart = defineProvider({
  name: "CloudCart",
  hosts: ["*.cloudcart.com", "*.cloudcart.net"],
  auth: {
    // Created in the store admin under Settings > API keys ({store}/admin/settings/api_keys).
    apiKey: secrets({
      label: "API key",
      fields: object({
        store: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/v2/stores?page[size]=1`, {
      signal,
      redirect: "manual",
      headers: { "X-CloudCart-ApiKey": account.fields.token, Accept: "application/vnd.api+json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

type Params = Record<string, string | number | undefined>;

function client(base: string, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
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
          "X-CloudCart-ApiKey": token,
          Accept: "application/vnd.api+json",
          ...(body === undefined ? {} : { "Content-Type": "application/vnd.api+json" }),
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
    if (response.status === 204 || (method === "DELETE" && response.ok)) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Filter = record(string());

const listDoc =
  "Paged JSON:API list (page size 20 by default, max 100). filter maps attribute names to exact values, for example {\"category_id\": \"13\"}; include is a comma-separated list of relationships to embed (a resource's docs list the allowed ones); sort is the attribute to order by (prefix with - for descending).";

type Ops = "list" | "get" | "create" | "update" | "delete";

// One CloudCart resource: path is both the URL segment and the JSON:API resource type.
// Every resource follows https://developers.cloudcart.com/2.0/<path>.
function resourceTools(call: Call, path: string, ops: readonly Ops[], noun: string) {
  const tools: Record<string, any> = {};
  if (ops.includes("list"))
    tools.list = query(
      {
        description: `List ${noun}. ${listDoc}`,
        input: object({
          filter: Filter.optional(),
          include: string().optional(),
          sort: string().optional(),
          page: number().optional(),
          pageSize: number().optional(),
        }),
      },
      (_c, { filter, include, sort, page, pageSize }) =>
        call("GET", path, {
          ...Object.fromEntries(Object.entries(filter ?? {}).map(([k, v]) => [`filter[${k}]`, v])),
          include,
          sort,
          "page[number]": page,
          "page[size]": pageSize,
        }),
    );
  if (ops.includes("get"))
    tools.get = query(
      {
        description: `Get one of ${noun} by id. include is a comma-separated list of relationships to embed.`,
        input: object({ id: id(), include: string().optional() }),
      },
      (_c, { id: i, include }) => call("GET", `${path}/${seg(i)}`, { include }),
    );
  if (ops.includes("create"))
    tools.create = mutation(
      {
        description: `Create a record in ${noun}. attributes and relationships follow the resource's page at https://developers.cloudcart.com/2.0/${path}; relationships look like {"category": {"data": {"type": "categories", "id": "5"}}}.`,
        input: object({ attributes: json().optional(), relationships: json().optional() }),
        approval: always(),
      },
      (_c, { attributes, relationships }) =>
        call("POST", path, {}, {
          data: { type: path, ...(attributes === undefined ? {} : { attributes }), ...(relationships === undefined ? {} : { relationships }) },
        }),
    );
  if (ops.includes("update"))
    tools.update = mutation(
      {
        description: `Update a record in ${noun} (PATCH): send only the attributes and relationships to change.`,
        input: object({ id: id(), attributes: json().optional(), relationships: json().optional() }),
        approval: always(),
      },
      (_c, { id: i, attributes, relationships }) =>
        call("PATCH", `${path}/${seg(i)}`, {}, {
          data: { type: path, id: i, ...(attributes === undefined ? {} : { attributes }), ...(relationships === undefined ? {} : { relationships }) },
        }),
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

function build(call: Call) {
  const r = (_name: string, path: string, ops: readonly Ops[], noun: string) => router(resourceTools(call, path, ops, noun));
  const t = (path: string, ops: readonly Ops[], noun: string) => resourceTools(call, path, ops, noun);

  return router({
    products: router({
      ...t("products", all, "products"),
      linkedProducts: mutation(
        {
          description:
            "Replace or add linked products of a product: POST /products/{id}/relationships/linked-products. data is a JSON:API array of {type: \"products\", id} identifiers.",
          input: object({ id: id(), data: json() }),
          approval: always(),
        },
        (_c, { id: i, data }) => call("POST", `products/${seg(i)}/relationships/linked-products`, {}, { data }),
      ),
      listLinkedProducts: query(
        { description: "List the linked products of a product.", input: object({ id: id() }) },
        (_c, { id: i }) => call("GET", `products/${seg(i)}/relationships/linked-products`),
      ),
    }),
    categories: r("Categories", "categories", all, "product categories"),
    vendors: r("Vendors", "vendors", all, "vendors (brands)"),
    images: r("Images", "images", ["list", "get", "create", "delete"], "product images"),
    variants: r("Variants", "variants", all, "product variants"),
    variantParameters: r("Variant parameters", "variant-parameters", all, "variant parameters (for example Size, Color)"),
    variantOptions: r("Variant options", "variant-options", all, "variant options (values of a variant parameter)"),
    properties: r("Properties", "properties", all, "product properties"),
    propertyOptions: r("Property options", "property-options", all, "property options"),
    productOptions: r("Product options", "product-options", read, "product options (read only)"),
    stores: r("Stores", "stores", read, "physical stores / locations (read only)"),
    storeQuantity: r("Store quantity", "store-quantity", all, "stock quantities per store"),
    discounts: r("Discounts", "discounts", ["create", "delete"], "discounts"),
    discountCodes: router({
      ...t("discount-codes", ["list", "create", "update", "delete"], "discount codes"),
      generate: mutation(
        {
          description:
            "Generate discount codes in bulk (POST /discount-codes/generate). body is the full JSON:API document described at https://developers.cloudcart.com/2.0/discount-codes-generate.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("POST", "discount-codes/generate", {}, body),
      ),
    }),
    discountCodesPro: router({
      ...t("discount-codes-pro", ["list", "create", "update", "delete"], "Pro discount codes"),
      generate: mutation(
        {
          description:
            "Generate Pro discount codes in bulk (POST /discount-codes-pro/generate). body is the full JSON:API document described at https://developers.cloudcart.com/2.0/discount-codes-pro-generate.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("POST", "discount-codes-pro/generate", {}, body),
      ),
    }),
    productToDiscount: r("Product to discount", "product-to-discount", ["create", "delete"], "product-to-discount links"),
    orders: router({
      ...t("orders", ["list", "get", "update"], "orders"),
      products: query(
        { description: "List the line items of an order.", input: object({ id: id() }) },
        (_c, { id: i }) => call("GET", `orders/${seg(i)}/products`),
      ),
    }),
    orderFulfillment: r("Order fulfillment", "order-fulfillment", ["create", "delete"], "order fulfillments (shipments)"),
    orderProducts: r("Order products", "order-products", read, "order line items (read only)"),
    orderProductsOptions: r("Order product options", "order-products-options", read, "order line item options (read only)"),
    orderPayment: r("Order payment", "order-payment", read, "order payments (read only)"),
    orderShipping: r("Order shipping", "order-shipping", read, "order shipping details (read only)"),
    orderShippingAddress: r("Order shipping address", "order-shipping-address", read, "order shipping addresses (read only)"),
    orderBillingAddress: r("Order billing address", "order-billing-address", read, "order billing addresses (read only)"),
    orderStatus: r("Order status", "order-status", read, "order statuses (read only)"),
    shippingProviders: r("Shipping providers", "shipping-providers", read, "shipping providers (read only)"),
    paymentProviders: r("Payment providers", "payment-providers", read, "payment providers (read only)"),
    customers: r("Customers", "customers", all, "customers"),
    customerGroups: r("Customer groups", "customer-groups", all, "customer groups"),
    customerShippingAddress: r("Customer shipping addresses", "customer-shipping-address", all, "customer shipping addresses"),
    customerBillingAddress: r("Customer billing addresses", "customer-billing-address", all, "customer billing addresses"),
    customerTags: r("Customer tags", "customer-tags", all, "customer tags"),
    redirects: r("Redirects", "redirects", ["list", "create", "delete"], "URL redirects"),
    blogPosts: r("Blog posts", "posts", all, "blog posts"),
    blogCategories: r("Blog categories", "blogs", all, "blog categories"),
    blogTags: r("Blog tags", "tags", all, "blog tags"),
    blogAuthors: r("Blog authors", "authors", read, "blog authors (read only)"),
    webhooks: r("Webhooks", "webhooks", all, "webhooks"),
    subscribers: r("Subscribers", "subscribers", all, "newsletter subscribers"),
    subscriberChannels: r("Subscriber channels", "subscribers-channels", all, "subscriber channels"),
    subscriberTags: r("Subscriber tags", "subscribers-tags", all, "subscriber tags"),
    segments: r("Segments", "segments", read, "subscriber segments (read only)"),
    api: router({
      request: mutation(
        {
          description:
            "Escape hatch for any CloudCart API v2 endpoint not covered by a dedicated tool (see https://developers.cloudcart.com/2.0/overview). path is relative to /api/v2 (for example \"customers/207/billing-address\"), with no query string; query holds the query parameters, keyed exactly as the API expects (for example {\"filter[sku]\": \"A1\"}); body is the full JSON:API document for POST and PATCH.",
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
          if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(verb))
            throw new Error("method must be GET, POST, PATCH, PUT or DELETE");
          return call(verb, path, q ?? {}, body);
        },
      ),
    }),
  });
}


export default defineApp(
  { user: { accounts: { cloudcart: cloudcart.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudcart ?? [],
        (account) => build(client(origin(account), account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "CloudCart",
        description:
          "Manage a CloudCart store: products, categories, variants, orders, customers, discounts, blog, subscribers and webhooks.",
        icons,
      },
    ),
  }),
);

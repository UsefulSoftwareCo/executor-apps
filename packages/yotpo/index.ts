import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://api.yotpo.com";

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

// Yotpo access tokens come from POST /core/v3/stores/{app_key}/access_tokens with the API secret.
async function mintToken(storeId: string, secret: string, fetcher: Fetch, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(`${base}/core/v3/stores/${encodeURIComponent(storeId)}/access_tokens`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const decoded = await decodeJson(response, object({ access_token: string({ minLength: 1 }) }));
  return decoded.access_token;
}

const yotpo = defineProvider({
  name: "Yotpo",
  hosts: ["api.yotpo.com"],
  auth: {
    apiKey: secrets({
      label: "App key and API secret",
      fields: object({
        storeId: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting a token validates both the app key and the secret without touching store data.
  async health({ account, fetch, signal }) {
    await mintToken(account.fields.storeId, account.fields.secret, fetch, signal);
  },
});

function client(storeId: string, secret: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  let token: Promise<string> | undefined;
  const call = async (method: Method, path: string, search: Params = {}, body?: Params, retry = true): Promise<unknown> => {
    token ??= mintToken(storeId, secret, fetcher, signal);
    const access = await token;
    const url = new URL(`${base}/core/v3/stores/${encodeURIComponent(storeId)}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-Yotpo-Token": access,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Tokens expire; Yotpo answers 401 and the docs say to generate a new one.
    if (response.status === 401 && retry) {
      token = undefined;
      return call(method, path, search, body, false);
    }
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const payload = record(json());
const filters = record(json()).optional();

function fill(path: string, ids: readonly string[], input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function idShape(ids: readonly string[]) {
  return Object.fromEntries(ids.map((id) => [id, string()]));
}

function read(c: Client, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description: `${description} Filters go in query.`, input: object({ ...idShape(ids), query: filters }) },
    async (_ctx, input: Params) => c.call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(c: Client, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody = true) {
  return mutation(
    { description, input: object({ ...idShape(ids), ...(hasBody ? { body: payload } : {}) }) },
    async (_ctx, input: Params) => c.call(method, fill(path, ids, input), {}, hasBody ? (input.body as Params) : undefined),
  );
}

function build(c: Client) {
  const page = "Cursor pagination: pass the page_info token from the previous response in query.page_info; query.limit sets the page size.";
  return router({
    products: router(
      {
        list: read(c, "/products", `List products. query: external_ids, limit, page_info. ${page}`),
        get: read(c, "/products/{yotpo_product_id}", "Retrieve a product by Yotpo product ID.", ["yotpo_product_id"]),
        create: write(c, "POST", "/products", "Create a product. body: { product: { external_id, name, url, ... } } per the Core API reference."),
        update: write(c, "PATCH", "/products/{yotpo_product_id}", "Update a product. body holds the fields to change.", ["yotpo_product_id"]),
        collections: read(c, "/products/{yotpo_product_id}/collections", "List the collections a product belongs to.", ["yotpo_product_id"]),
      },
      { title: "Products", description: "Product catalog." },
    ),
    variants: router(
      {
        list: read(c, "/products/{yotpo_product_id}/variants", "List variants of a product.", ["yotpo_product_id"]),
        get: read(c, "/products/{yotpo_product_id}/variants/{yotpo_variant_id}", "Retrieve a product variant.", ["yotpo_product_id", "yotpo_variant_id"]),
        create: write(c, "POST", "/products/{yotpo_product_id}/variants", "Create a product variant.", ["yotpo_product_id"]),
        update: write(c, "PATCH", "/products/{yotpo_product_id}/variants/{yotpo_variant_id}", "Update a product variant.", ["yotpo_product_id", "yotpo_variant_id"]),
      },
      { title: "Product variants", description: "Variants of catalog products." },
    ),
    collections: router(
      {
        list: read(c, "/collections", "List collections. query: external_ids, names, limit, page_info."),
        create: write(c, "POST", "/collections", "Create a collection."),
        update: write(c, "PATCH", "/collections/{yotpo_collection_id}", "Update a collection.", ["yotpo_collection_id"]),
        products: read(c, "/collections/{yotpo_collection_id}/products", "List products in a collection.", ["yotpo_collection_id"]),
        addProduct: write(c, "POST", "/collections/{yotpo_collection_id}/products", "Add a product to a collection. body identifies the product.", ["yotpo_collection_id"]),
        removeProduct: write(c, "DELETE", "/collections/{yotpo_collection_id}/products", "Remove a product from a collection. body identifies the product.", ["yotpo_collection_id"]),
      },
      { title: "Collections", description: "Product collections." },
    ),
    orders: router(
      {
        list: read(c, "/orders", "List orders. query: external_ids, order_date_min, order_date_max, limit, page_info."),
        get: read(c, "/orders/{yotpo_order_id}", "Retrieve an order.", ["yotpo_order_id"]),
        create: write(c, "POST", "/orders", "Create an order. Orders older than six months do not trigger automatic review requests."),
        update: write(c, "PATCH", "/orders/{yotpo_order_id}", "Update an order.", ["yotpo_order_id"]),
        sendAggregated: write(c, "POST", "/register_purchase", "Send an order with its products and related data in one batch."),
      },
      { title: "Orders", description: "Store orders." },
    ),
    fulfillments: router(
      {
        list: read(c, "/orders/{yotpo_order_id}/fulfillments", "List fulfillments of an order. query: external_ids, limit, page_info.", ["yotpo_order_id"]),
        get: read(c, "/orders/{yotpo_order_id}/fulfillments/{yotpo_fulfillment_id}", "Retrieve an order fulfillment.", ["yotpo_order_id", "yotpo_fulfillment_id"]),
        create: write(c, "POST", "/orders/{yotpo_order_id}/fulfillments", "Create an order fulfillment.", ["yotpo_order_id"]),
        update: write(c, "PATCH", "/orders/{yotpo_order_id}/fulfillments/{yotpo_fulfillment_id}", "Update an order fulfillment.", ["yotpo_order_id", "yotpo_fulfillment_id"]),
      },
      { title: "Order fulfillments", description: "Shipping and fulfillment records." },
    ),
    customers: router(
      {
        list: read(c, "/customers", "List customers. query: email, phone_number, external_ids, updated_at_min, expand, limit, page_info."),
        upsert: write(c, "PATCH", "/customers", "Create or update a customer."),
      },
      { title: "Customers", description: "Store customers." },
    ),
    webhooks: router(
      {
        targets: router({
          list: read(c, "/webhooks/targets", "List webhook targets."),
          get: read(c, "/webhooks/targets/{yotpo_target_id}", "Retrieve a webhook target.", ["yotpo_target_id"]),
          create: write(c, "POST", "/webhooks/targets", "Create a webhook target."),
          update: write(c, "PATCH", "/webhooks/targets/{yotpo_target_id}", "Update a webhook target.", ["yotpo_target_id"]),
          delete: write(c, "DELETE", "/webhooks/targets/{yotpo_target_id}", "Delete a webhook target (only if unused).", ["yotpo_target_id"], false),
        }),
        filters: router({
          list: read(c, "/webhooks/filters", "List webhook filters."),
          get: read(c, "/webhooks/filters/{yotpo_filter_id}", "Retrieve a webhook filter.", ["yotpo_filter_id"]),
          create: write(c, "POST", "/webhooks/filters", "Create a webhook filter."),
          update: write(c, "PATCH", "/webhooks/filters/{yotpo_filter_id}", "Update a webhook filter.", ["yotpo_filter_id"]),
          delete: write(c, "DELETE", "/webhooks/filters/{yotpo_filter_id}", "Delete a webhook filter (only if unused).", ["yotpo_filter_id"], false),
        }),
        subscriptions: router({
          list: read(c, "/webhooks/subscriptions", "List webhook subscriptions."),
          get: read(c, "/webhooks/subscriptions/{yotpo_subscription_id}", "Retrieve a webhook subscription.", ["yotpo_subscription_id"]),
          create: write(c, "POST", "/webhooks/subscriptions", "Create a subscription joining a target and a filter."),
          update: write(c, "PATCH", "/webhooks/subscriptions/{yotpo_subscription_id}", "Update a webhook subscription.", ["yotpo_subscription_id"]),
          delete: write(c, "DELETE", "/webhooks/subscriptions/{yotpo_subscription_id}", "Delete a webhook subscription.", ["yotpo_subscription_id"], false),
        }),
      },
      { title: "Webhooks", description: "Webhook targets, filters and subscriptions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { yotpo: yotpo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.yotpo ?? [],
        (account) =>
          withApprovals(build(client(account.fields.storeId, account.fields.secret, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Yotpo",
        description:
          "Yotpo Core API for a store: products, variants, collections, orders, fulfillments, customers and webhooks. Ids are Yotpo ids; pass filters in query and fields in body.",
        icons,
      },
    ),
  }),
);

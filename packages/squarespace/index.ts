import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  number,
  boolean,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.squarespace.com";
const userAgent = "executor.sh squarespace app";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const squarespace = defineProvider({
  name: "Squarespace",
  hosts: ["api.squarespace.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Squarespace OAuth clients come from account.squarespace.com/developer-apps (approved apps only).
    oauth: oauth2({
      authorizationUrl: "https://login.squarespace.com/api/1/login/oauth/provider/authorize",
      tokenUrl: "https://login.squarespace.com/api/1/login/oauth/provider/tokens",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "website.orders",
        "website.products",
        "website.inventory",
        "website.contacts",
        "website.discounts",
        "website.transactions.read",
      ],
      scopeSeparator: ",",
      authorizationParams: { access_type: "offline" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/1.0/authorization/website`, {
      signal,
      headers: headers(account),
    });
    const site = await decodeJson(response, object({ id: string(), title: string() }));
    return { accountInfo: { externalId: site.id, displayName: site.title } };
  },
});

function headers(account: Account): Record<string, string> {
  const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
  return { Authorization: `Bearer ${token}`, "User-Agent": userAgent };
}

type Fetch = typeof fetch;
type Call = (
  method: string,
  path: string,
  options?: { query?: Record<string, unknown>; body?: unknown; idempotent?: boolean; contentType?: string },
) => Promise<unknown>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, options = {}) => {
    const url = new URL(base + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const requestHeaders: Record<string, string> = headers(account);
    if (options.body !== undefined) requestHeaders["Content-Type"] = options.contentType ?? "application/json";
    if (options.idempotent) requestHeaders["Idempotency-Key"] = crypto.randomUUID();
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: requestHeaders,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const id = string({ minLength: 1 });
const cursor = string().optional();
const Money = object({ currency: string(), value: string() });
const Address = object({
  firstName: string().optional(),
  lastName: string().optional(),
  line1: string().optional(),
  line2: string().optional(),
  city: string().optional(),
  region: string().optional(),
  postalCode: string().optional(),
  countryCode: string().optional(),
  phoneNumber: string().optional(),
});
const Shipment = object({
  carrierName: string().optional(),
  service: string().optional(),
  shipDate: string().optional(),
  trackingNumber: string().optional(),
  trackingUrl: string().optional(),
});
const Operation = object({ variantId: id, quantity: number() });

function build(call: Call) {
  return router({
    site: query(
      {
        description:
          "Basic information about the site the credentials belong to: id, title, url, currency, language, time zone.",
        input: object({}),
      },
      async () => call("GET", "/1.0/authorization/website"),
    ),
    orders: router(
      {
        list: query(
          {
            description:
              "List orders (50 per page, by modifiedOn). Filter by customerId, fulfillmentStatus (PENDING, FULFILLED, CANCELED), paymentStates, or modifiedAfter plus modifiedBefore (ISO 8601 UTC; pass both). A cursor (pagination.nextPageCursor) cannot be combined with any other parameter.",
            input: object({
              cursor,
              customerId: string().optional(),
              modifiedAfter: string().optional(),
              modifiedBefore: string().optional(),
              fulfillmentStatus: string().optional(),
              paymentStates: array(string()).optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/1.0/commerce/orders", { query: input }),
        ),
        get: query(
          { description: "Get one order by id.", input: object({ orderId: id }) },
          async (_ctx, { orderId }) => call("GET", `/1.0/commerce/orders/${encodeURIComponent(orderId)}`),
        ),
        import: mutation(
          {
            description:
              "Import an order from a third-party sales channel. Required: channelName (max 30 chars), createdOn, externalOrderReference, grandTotal, lineItems, priceTaxInterpretation (INCLUSIVE or EXCLUSIVE), fulfillments. Optional fields (customerEmail, addresses, discountLines, shippingLines, totals, fulfillmentStatus, inventoryBehavior DEDUCT or SKIP) go in the same object. Sent with a fresh Idempotency-Key.",
            input: object({ order: json() }),
          },
          async (_ctx, { order }) => call("POST", "/1.0/commerce/orders", { body: order, idempotent: true }),
        ),
        fulfill: mutation(
          {
            description: "Mark an order fulfilled, optionally with shipment tracking and a customer notification.",
            input: object({
              orderId: id,
              shipments: array(Shipment).optional(),
              shouldSendNotification: boolean().optional(),
            }),
          },
          async (_ctx, { orderId, ...body }) =>
            call("POST", `/1.0/commerce/orders/${encodeURIComponent(orderId)}/fulfillments`, { body }),
        ),
      },
      { title: "Orders", description: "Order history and importing or fulfilling orders." },
    ),
    products: router(
      {
        list: query(
          {
            description:
              "List products (50 per page). Filter by modifiedAfter plus modifiedBefore, query text, or type (PHYSICAL, SERVICE, GIFT_CARD, DIGITAL). Cursor cannot be combined with other filters.",
            input: object({
              cursor,
              modifiedAfter: string().optional(),
              modifiedBefore: string().optional(),
              query: string().optional(),
              type: array(string()).optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/v2/commerce/products", { query: input }),
        ),
        get: query(
          {
            description: "Get up to 50 products by id.",
            input: object({ productIds: array(id) }),
          },
          async (_ctx, { productIds }) =>
            call("GET", `/v2/commerce/products/${productIds.map(encodeURIComponent).join(",")}`),
        ),
        create: mutation(
          {
            description:
              "Create a product. The product object needs type (PHYSICAL, SERVICE, GIFT_CARD) and storePageId plus name; physical and service products need variants (sku, pricing.basePrice {currency, value}). Also accepts description, isVisible, tags, urlSlug.",
            input: object({ product: json() }),
          },
          async (_ctx, { product }) => call("POST", "/v2/commerce/products", { body: product }),
        ),
        update: mutation(
          {
            description:
              "Partially update a product. Each changed field is wrapped as {\"present\": true, \"value\": ...}, for example name, description, isVisible, pricing, tags, urlSlug, seoData.",
            input: object({ productId: id, changes: json() }),
          },
          async (_ctx, { productId, changes }) =>
            call("POST", `/v2/commerce/products/${encodeURIComponent(productId)}`, { body: changes }),
        ),
        delete: mutation(
          { description: "Delete a product.", input: object({ productId: id }) },
          async (_ctx, { productId }) => call("DELETE", `/v2/commerce/products/${encodeURIComponent(productId)}`),
        ),
        updateImage: mutation(
          {
            description: "Update the alt text of a product image. Wrapped as {\"altText\": {\"present\": true, \"value\": \"...\"}}.",
            input: object({ productId: id, imageId: id, altText: string() }),
          },
          async (_ctx, { productId, imageId, altText }) =>
            call(
              "POST",
              `/v2/commerce/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
              { body: { altText: { present: true, value: altText } } },
            ),
        ),
        deleteImage: mutation(
          { description: "Delete a product image.", input: object({ productId: id, imageId: id }) },
          async (_ctx, { productId, imageId }) =>
            call("DELETE", `/v2/commerce/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`),
        ),
        reorderImage: mutation(
          {
            description: "Move a product image to after another image (omit afterImageId to move it first).",
            input: object({ productId: id, imageId: id, afterImageId: string().optional() }),
          },
          async (_ctx, { productId, imageId, afterImageId }) =>
            call(
              "POST",
              `/v2/commerce/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/order`,
              { body: { afterImageId } },
            ),
        ),
        imageStatus: query(
          {
            description: "Processing status of an uploaded product image: QUEUED, PROCESSING, READY or ERROR.",
            input: object({ productId: id, imageId: id }),
          },
          async (_ctx, { productId, imageId }) =>
            call(
              "GET",
              `/v2/commerce/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/status`,
            ),
        ),
        createVariant: mutation(
          {
            description:
              "Create a variant. The variant object needs sku (max 60 chars) and pricing {basePrice {currency, value}}; physical products also take attributes, gtin, mpn, shippingMeasurements, stock.",
            input: object({ productId: id, variant: json() }),
          },
          async (_ctx, { productId, variant }) =>
            call("POST", `/v2/commerce/products/${encodeURIComponent(productId)}/variants`, { body: variant }),
        ),
        updateVariant: mutation(
          {
            description:
              "Partially update a variant. Each changed field (sku, pricing, attributes, gtin, mpn, shippingMeasurements) is wrapped as {\"present\": true, \"value\": ...}.",
            input: object({ productId: id, variantId: id, changes: json() }),
          },
          async (_ctx, { productId, variantId, changes }) =>
            call(
              "POST",
              `/v2/commerce/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
              { body: changes },
            ),
        ),
        deleteVariant: mutation(
          { description: "Delete a variant.", input: object({ productId: id, variantId: id }) },
          async (_ctx, { productId, variantId }) =>
            call(
              "DELETE",
              `/v2/commerce/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
            ),
        ),
        setVariantImage: mutation(
          {
            description: "Associate an image with a variant; a null imageId removes the association.",
            input: object({ productId: id, variantId: id, imageId: string().optional() }),
          },
          async (_ctx, { productId, variantId, imageId }) =>
            call(
              "POST",
              `/v2/commerce/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/image`,
              { body: { imageId: imageId ?? null } },
            ),
        ),
      },
      {
        title: "Products",
        description: "Products, variants and images. Image upload (multipart) is not supported.",
      },
    ),
    inventory: router(
      {
        list: query(
          { description: "List inventory items (50 per page).", input: object({ cursor }) },
          async (_ctx, input) => call("GET", "/1.0/commerce/inventory", { query: input }),
        ),
        get: query(
          { description: "Get inventory for up to 50 variant ids.", input: object({ variantIds: array(id) }) },
          async (_ctx, { variantIds }) =>
            call("GET", `/1.0/commerce/inventory/${variantIds.map(encodeURIComponent).join(",")}`),
        ),
        adjust: mutation(
          {
            description:
              "Adjust stock: increment, decrement or set exact quantities per variant, or mark variants unlimited. Sent with a fresh Idempotency-Key.",
            input: object({
              incrementOperations: array(Operation).optional(),
              decrementOperations: array(Operation).optional(),
              setFiniteOperations: array(Operation).optional(),
              setUnlimitedOperations: array(string()).optional(),
            }),
          },
          async (_ctx, body) => call("POST", "/1.0/commerce/inventory/adjustments", { body, idempotent: true }),
        ),
      },
      { title: "Inventory", description: "Read and adjust stock for product variants." },
    ),
    contacts: router(
      {
        list: query(
          {
            description: "List contacts (customers, subscribers, donors).",
            input: object({ pageSize: number().optional(), cursor }),
          },
          async (_ctx, input) => call("GET", "/v1/contacts", { query: input }),
        ),
        search: query(
          {
            description:
              "Query contacts. The filter object may hold searchString, acceptsMarketingWithDate, date ranges (firstOrderOn, lastOrderOn, firstDonationOn, lastDonationOn: before/after), number ranges (orderCount, orderAmount, donationCount, donationAmount: min/max), pageSize, cursor, sortField and sortDirection (ASCENDING, DESCENDING).",
            input: object({ filter: json() }),
          },
          async (_ctx, { filter }) => call("POST", "/v1/contacts/query", { body: filter }),
        ),
        get: query(
          { description: "Get a contact.", input: object({ contactId: id }) },
          async (_ctx, { contactId }) => call("GET", `/v1/contacts/${encodeURIComponent(contactId)}`),
        ),
        create: mutation(
          {
            description: "Create a contact.",
            input: object({
              firstName: string(),
              lastName: string(),
              locale: string(),
              primaryEmail: object({ email: string(), acceptsMarketing: boolean().optional() }),
            }),
          },
          async (_ctx, body) => call("POST", "/v1/contacts", { body }),
        ),
        update: mutation(
          {
            description: "Update a contact (merge patch; only the given fields change).",
            input: object({
              contactId: id,
              firstName: string().optional(),
              lastName: string().optional(),
              locale: string().optional(),
              primaryEmail: object({ email: string(), acceptsMarketing: boolean().optional() }).optional(),
            }),
          },
          async (_ctx, { contactId, ...body }) =>
            call("PATCH", `/v1/contacts/${encodeURIComponent(contactId)}`, {
              body,
              contentType: "application/merge-patch+json",
            }),
        ),
        delete: mutation(
          { description: "Delete a contact.", input: object({ contactId: id }) },
          async (_ctx, { contactId }) => call("DELETE", `/v1/contacts/${encodeURIComponent(contactId)}`),
        ),
        listAddresses: query(
          {
            description: "List a contact's address book.",
            input: object({ contactId: id, pageSize: number().optional(), cursor }),
          },
          async (_ctx, { contactId, ...rest }) =>
            call("GET", `/v1/contacts/${encodeURIComponent(contactId)}/address-book`, { query: rest }),
        ),
        getAddress: query(
          { description: "Get one address book entry.", input: object({ contactId: id, addressBookEntryId: id }) },
          async (_ctx, { contactId, addressBookEntryId }) =>
            call(
              "GET",
              `/v1/contacts/${encodeURIComponent(contactId)}/address-book/${encodeURIComponent(addressBookEntryId)}`,
            ),
        ),
        addAddress: mutation(
          {
            description: "Add an address to a contact's address book.",
            input: object({ contactId: id, address: Address, defaultShipping: boolean().optional() }),
          },
          async (_ctx, { contactId, ...body }) =>
            call("POST", `/v1/contacts/${encodeURIComponent(contactId)}/address-book`, { body }),
        ),
        updateAddress: mutation(
          {
            description: "Replace an address book entry.",
            input: object({
              contactId: id,
              addressBookEntryId: id,
              address: Address,
              defaultShipping: boolean().optional(),
            }),
          },
          async (_ctx, { contactId, addressBookEntryId, ...body }) =>
            call(
              "PUT",
              `/v1/contacts/${encodeURIComponent(contactId)}/address-book/${encodeURIComponent(addressBookEntryId)}`,
              { body },
            ),
        ),
        deleteAddress: mutation(
          { description: "Delete an address book entry.", input: object({ contactId: id, addressBookEntryId: id }) },
          async (_ctx, { contactId, addressBookEntryId }) =>
            call(
              "DELETE",
              `/v1/contacts/${encodeURIComponent(contactId)}/address-book/${encodeURIComponent(addressBookEntryId)}`,
            ),
        ),
      },
      { title: "Contacts", description: "Customers, subscribers and donors with their address books." },
    ),
    discounts: router(
      {
        list: query(
          {
            description:
              "List discounts. Filter by status (ALL, ACTIVE, EXPIRED, SCHEDULED), search, trigger (AUTO, CODE), sortBy (CREATED_ON, PROMO_CODE, USES_COUNT), sortDirection; page with offset and limit (1-1000).",
            input: object({
              status: string().optional(),
              search: string().optional(),
              trigger: string().optional(),
              sortBy: string().optional(),
              sortDirection: string().optional(),
              offset: number().optional(),
              limit: number().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/v1/commerce/discounts", { query: input }),
        ),
        get: query(
          { description: "Get a discount.", input: object({ discountId: id }) },
          async (_ctx, { discountId }) => call("GET", `/v1/commerce/discounts/${encodeURIComponent(discountId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a discount. The discount object needs criteria, name, template, trigger and validFrom; optional isLimitedUses, maxUsesAllowed, isOncePerCustomer, validTo.",
            input: object({ discount: json() }),
          },
          async (_ctx, { discount }) => call("POST", "/v1/commerce/discounts", { body: discount }),
        ),
        update: mutation(
          {
            description: "Replace a discount (full PUT: send every field as for create).",
            input: object({ discountId: id, discount: json() }),
          },
          async (_ctx, { discountId, discount }) =>
            call("PUT", `/v1/commerce/discounts/${encodeURIComponent(discountId)}`, { body: discount }),
        ),
        delete: mutation(
          { description: "Delete a discount.", input: object({ discountId: id }) },
          async (_ctx, { discountId }) => call("DELETE", `/v1/commerce/discounts/${encodeURIComponent(discountId)}`),
        ),
      },
      { title: "Discounts", description: "Promo codes and automatic discounts." },
    ),
    fulfillmentOptions: query(
      { description: "List the site's fulfillment options and carrier services.", input: object({}) },
      async () => call("GET", "/v1/fulfillments/fulfillment-options"),
    ),
    transactions: router(
      {
        list: query(
          {
            description: "List financial transactions (50 per page). Filter by orderId or modifiedAfter plus modifiedBefore.",
            input: object({
              cursor,
              orderId: string().optional(),
              modifiedAfter: string().optional(),
              modifiedBefore: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/1.0/commerce/transactions", { query: input }),
        ),
        get: query(
          { description: "Get up to 50 transaction documents by id.", input: object({ documentIds: array(id) }) },
          async (_ctx, { documentIds }) =>
            call("GET", `/1.0/commerce/transactions/${documentIds.map(encodeURIComponent).join(",")}`),
        ),
      },
      { title: "Transactions", description: "Payments and refunds for orders and donations (read only)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { squarespace: squarespace.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.squarespace ?? [],
        (account) =>
          withApprovals(build(client(account, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Squarespace",
        description: "Orders, products, inventory, contacts, discounts and transactions for a Squarespace commerce site.",
        icons,
      },
    ),
  }),
);

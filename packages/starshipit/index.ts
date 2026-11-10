import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.starshipit.com";

const starshipit = defineProvider({
  name: "Starshipit",
  hosts: ["api.starshipit.com"],
  auth: {
    apiKey: secrets({
      label: "API keys",
      fields: object({
        apiKey: string({ minLength: 1 }),
        subscriptionKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/orders/unshipped?limit=1`, {
      signal,
      headers: headers(account.fields),
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

type Keys = { apiKey: string; subscriptionKey: string };
type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function headers(keys: Keys, contentType: string | undefined = "application/json") {
  return {
    ...(contentType === undefined ? {} : { "Content-Type": contentType }),
    "StarShipIT-Api-Key": keys.apiKey,
    "Ocp-Apim-Subscription-Key": keys.subscriptionKey,
  };
}

function client(keys: Keys, fetcher: Fetch, signal: AbortSignal | undefined) {
  const urlFor = (path: string, params?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  };
  const call = async (method: string, path: string, params?: Params, body?: unknown) => {
    const url = urlFor(path, params);
    const response = await fetcher(url, {
      method,
      signal,
      headers: headers(keys),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  const text = async (method: string, path: string) => {
    const response = await fetcher(urlFor(path), { method, signal, headers: headers(keys, undefined) });
    const content = await response.text();
    if (!response.ok) throw new Error(`Starshipit ${method} ${path} failed with ${response.status}: ${content.slice(0, 500)}`);
    return { content };
  };
  const upload = async (method: string, path: string, file: string, filename: string, mimeType: string | undefined, documentType: string | undefined) => {
    const binary = atob(file);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: mimeType ?? "application/octet-stream" }), filename);
    if (documentType !== undefined) form.append("document_type", documentType);
    // No Content-Type header: fetch sets the multipart boundary itself.
    const response = await fetcher(urlFor(path), { method, signal, headers: headers(keys, undefined), body: form });
    return decodeJson(response, json());
  };
  return Object.assign(call, { text, upload });
}

type Call = ReturnType<typeof client>;

const fileInput = {
  file_base64: string({ minLength: 1 }),
  filename: string({ minLength: 1 }),
  mime_type: string().optional(),
  document_type: string().optional(),
};

const page = {
  limit: number().optional(),
  page: number().optional(),
};

const body = (_name: string) => object({ body: json() });

function build(call: Call) {
  return router({
    orders: router(
      {
        listUnshipped: query(
          {
            description:
              "List unshipped orders (default: updated in the last 24 hours). Dates are RFC3339 UTC. limit max 250.",
            input: object({
              since_order_date: string().optional(),
              since_last_updated: string().optional(),
              ids_only: boolean().optional(),
              ...page,
            }),
          },
          async (_ctx, input) => call("GET", "/api/orders/unshipped", input),
        ),
        listShipped: query(
          {
            description: "List shipped orders (default: updated in the last 24 hours). limit max 250.",
            input: object({ since_last_updated: string().optional(), ids_only: boolean().optional(), ...page }),
          },
          async (_ctx, input) => call("GET", "/api/orders/shipped", input),
        ),
        listShipments: query(
          {
            description:
              "List recently printed or unmanifested shipments. status is recently_printed or unmanifested. limit max 250.",
            input: object({ status: string({ minLength: 1 }), since_created_date: string().optional(), ...page }),
          },
          async (_ctx, input) => call("GET", "/api/orders/shipments", input),
        ),
        listDelivered: query(
          {
            description: "List delivered orders matching an order reference.",
            input: object({ order_ref: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("GET", "/api/orders/delivered", input),
        ),
        summary: query(
          {
            description:
              "Summary of orders by status. order_status is new, shipped, printed or archived. page_size max 500. filter uses Starshipit filter syntax such as Order:::1419.",
            input: object({
              order_status: string({ minLength: 1 }),
              page: number().optional(),
              page_size: number().optional(),
              filter: string().optional(),
              sort: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/api/orders/summary", input),
        ),
        search: query(
          {
            description:
              "Find orders by order number, tracking number, reference or receiver name. Use status All and fields All to include unshipped, shipped and archived orders.",
            input: object({
              phrase: string({ minLength: 1 }),
              status: string().optional(),
              fields: string().optional(),
              ...page,
            }),
          },
          async (_ctx, input) => call("GET", "/api/orders/search", input),
        ),
        get: query(
          {
            description:
              "Get one order by order_id or order_number, or list orders matching status, filter and paging criteria.",
            input: object({
              order_id: number().optional(),
              order_number: string().optional(),
              status: string().optional(),
              filter: string().optional(),
              include: string().optional(),
              sort_column: string().optional(),
              sort_direction: string().optional(),
              page_number: number().optional(),
              page_size: number().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/api/orders", input),
        ),
        mergeable: query(
          { description: "Get suggested order merges.", input: object({}) },
          async () => call("GET", "/api/orders/mergeable"),
        ),
        create: mutation(
          {
            description: 'Create an order. Body: { "order": { ...order fields } } as in the Starshipit Create Order docs.',
            input: body("order"),
          },
          async (_ctx, { body }) => call("POST", "/api/orders", undefined, body),
        ),
        import: mutation(
          {
            description: 'Create several orders. Body: { "orders": [ ...order objects ] } as in the Create Orders docs.',
            input: body("orders"),
          },
          async (_ctx, { body }) => call("POST", "/api/orders/import", undefined, body),
        ),
        update: mutation(
          {
            description: 'Update an order. Body: { "order": { order_id or order_number, ...fields to change } }.',
            input: body("order"),
          },
          async (_ctx, { body }) => call("PUT", "/api/orders", undefined, body),
        ),
        updateMany: mutation(
          {
            description: 'Update several orders. Body: { "orders": [ ...order objects ] }.',
            input: body("orders"),
          },
          async (_ctx, { body }) => call("PUT", "/api/orders/update", undefined, body),
        ),
        batchUpdate: mutation(
          {
            description: "Apply one update to a list of orders. Body includes order_ids plus the fields to set.",
            input: body("batch"),
          },
          async (_ctx, { body }) => call("PUT", "/api/orders/batchupdate", undefined, body),
        ),
        delete: mutation(
          {
            description: "Delete an unshipped order.",
            input: object({ order_id: number() }),
          },
          async (_ctx, { order_id }) => call("DELETE", "/api/orders/delete", undefined, { order_id }),
        ),
        archive: mutation(
          { description: "Archive an order.", input: object({ order_id: number() }) },
          async (_ctx, input) => call("POST", "/api/orders/archive", input),
        ),
        restore: mutation(
          { description: "Restore an archived order.", input: object({ order_id: number() }) },
          async (_ctx, input) => call("POST", "/api/orders/restore", input),
        ),
        merge: mutation(
          { description: "Merge orders. Body as in the Merge Orders docs.", input: body("merge") },
          async (_ctx, { body }) => call("POST", "/api/orders/merge", undefined, body),
        ),
        assign: mutation(
          { description: "Assign orders. Body as in the Assign Orders docs.", input: body("assign") },
          async (_ctx, { body }) => call("POST", "/api/orders/assign", undefined, body),
        ),
        createTrackingOnly: mutation(
          {
            description:
              "Register externally generated tracking as a shipped order. Body as in the Create Tracking Only Order docs.",
            input: body("tracking"),
          },
          async (_ctx, { body }) => call("POST", "/api/orders/shipped", undefined, body),
        ),
      },
      { title: "Orders", description: "Create, find, update, archive and delete orders before and after shipping." },
    ),
    shipments: router(
      {
        printLabel: mutation(
          {
            description:
              "Create the shipment and label for one order. Body identifies the order (order_id or order_number) and may set weight, height, width and length.",
            input: body("label"),
          },
          async (_ctx, { body }) => call("POST", "/api/orders/shipment", undefined, body),
        ),
        printLabels: mutation(
          { description: "Create shipments and labels for several orders. Body includes order_ids.", input: body("labels") },
          async (_ctx, { body }) => call("POST", "/api/orders/shipments", undefined, body),
        ),
        printPackingSlips: mutation(
          { description: "Create packing slips. Body includes order_ids.", input: body("slips") },
          async (_ctx, { body }) => call("POST", "/api/orders/packingslips", undefined, body),
        ),
        manifestOrders: mutation(
          { description: "Manifest shipped orders. Body includes order_ids.", input: body("manifest") },
          async (_ctx, { body }) => call("POST", "/api/orders/manifest", undefined, body),
        ),
        clone: mutation(
          {
            description: "Clone a shipment. Body includes order_id. to_return_shipment (query) makes a return shipment.",
            input: object({ to_return_shipment: boolean().optional(), body: json() }),
          },
          async (_ctx, { to_return_shipment, body }) =>
            call("POST", "/api/orders/shipment/clone", { to_return_shipment }, body),
        ),
        replace: mutation(
          { description: "Replace a shipment. Body includes order_id.", input: body("replace") },
          async (_ctx, { body }) => call("POST", "/api/orders/shipment/replace", undefined, body),
        ),
        commercialInvoices: mutation(
          { description: "Create commercial invoices. Body as in the docs.", input: body("invoices") },
          async (_ctx, { body }) => call("POST", "/api/orders/commercialinvoices", undefined, body),
        ),
      },
      { title: "Shipments", description: "Print labels, packing slips and commercial invoices; clone and replace shipments." },
    ),
    tracking: router(
      {
        get: query(
          {
            description: "Tracking details for a shipped order, by tracking_number or order_number.",
            input: object({ tracking_number: string().optional(), order_number: string().optional() }),
          },
          async (_ctx, input) => call("GET", "/api/track", input),
        ),
      },
      { title: "Tracking", description: "Delivery tracking for shipped orders." },
    ),
    rates: router(
      {
        get: query(
          {
            description:
              "Get carrier rates from the couriers and rules configured in Starshipit. Read-only: it prices a shipment. Body is the rate request (destination, packages) from the Get Rates docs.",
            input: body("rates"),
          },
          async (_ctx, { body }) => call("POST", "/api/rates", undefined, body),
        ),
        deliveryServices: query(
          {
            description:
              "List delivery services for an order or destination. Read-only. Body per the Delivery Services docs.",
            input: object({ order_id: number().optional(), body: json() }),
          },
          async (_ctx, { order_id, body }) => call("POST", "/api/deliveryservices", { order_id }, body),
        ),
      },
      { title: "Rates", description: "Checkout rates and delivery services." },
    ),
    addressBook: router(
      {
        list: query(
          {
            description: "List address book records.",
            input: object({
              page: number().optional(),
              page_size: number().optional(),
              sort: string().optional(),
              sort_direction: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/api/addressbook/filtered", input),
        ),
        add: mutation(
          { description: "Add an address book record. Body per the Add Address docs.", input: body("address") },
          async (_ctx, { body }) => call("POST", "/api/addressbook/", undefined, body),
        ),
        update: mutation(
          { description: "Update an address book record. Body per the Update Address docs.", input: body("address") },
          async (_ctx, { body }) => call("POST", "/api/addressbook/update", undefined, body),
        ),
        delete: mutation(
          { description: "Remove address book records. Body includes address_ids.", input: body("address_ids") },
          async (_ctx, { body }) => call("POST", "/api/addressbook/delete", undefined, body),
        ),
      },
      { title: "Address book", description: "Saved sender and receiver addresses." },
    ),
    manifests: router(
      {
        list: query(
          {
            description: "List manifests.",
            input: object({ page: number().optional(), limit: number().optional() }),
          },
          async (_ctx, input) => call("GET", "/api/manifests", input),
        ),
        files: query(
          {
            description: "Manifest files (base64 PDF data) for a manifest_id.",
            input: object({ manifest_id: number() }),
          },
          async (_ctx, input) => call("GET", "/api/manifests/files/", input),
        ),
        create: mutation(
          { description: "Manifest specific orders. Body per the docs.", input: body("manifest") },
          async (_ctx, { body }) => call("POST", "/api/manifests/shipments", undefined, body),
        ),
        createByCarrier: mutation(
          { description: "Manifest all eligible orders for a carrier. Body per the docs.", input: body("manifest") },
          async (_ctx, { body }) => call("POST", "/api/manifests/carrier", undefined, body),
        ),
      },
      { title: "Manifests", description: "Carrier manifests for handover." },
    ),
    products: router(
      {
        list: query(
          {
            description: "List Product Catalogue records.",
            input: object({
              search_term: string().optional(),
              page_number: number().optional(),
              page_size: number().optional(),
              skip_records: number().optional(),
              sort_column: string().optional(),
              sort_direction: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/api/products", input),
        ),
        template: query(
          {
            description: "Download the Product Catalogue import template. Returns { content }: the CSV file as text.",
            input: object({}),
          },
          async () => call.text("GET", "/api/products/template"),
        ),
        export: query(
          {
            description:
              "Export Product Catalogue records. The vendor does not document the response format; it is returned as { content } text (likely CSV).",
            input: object({}),
          },
          async () => call.text("GET", "/api/products/export"),
        ),
        add: mutation(
          { description: "Add a product. Body per the Add Product docs.", input: body("product") },
          async (_ctx, { body }) => call("POST", "/api/products", undefined, body),
        ),
        update: mutation(
          { description: "Update a product. Body per the Update Product docs.", input: body("product") },
          async (_ctx, { body }) => call("PUT", "/api/products/update", undefined, body),
        ),
        import: mutation(
          { description: "Import products in bulk. Body per the Import Products docs.", input: body("products") },
          async (_ctx, { body }) => call("POST", "/api/products/import", undefined, body),
        ),
        delete: mutation(
          {
            description:
              "Delete products. Body per the Delete Product docs; the Delete All Products form uses the same endpoint with its documented body.",
            input: body("products"),
          },
          async (_ctx, { body }) => call("DELETE", "/api/products/delete", undefined, body),
        ),
      },
      { title: "Products", description: "Product Catalogue: SKUs, dimensions, weights and customs data." },
    ),
    pickups: router(
      {
        list: query(
          {
            description: "List courier pickups.",
            input: object({ page_number: number().optional(), page_size: number().optional() }),
          },
          async (_ctx, input) => call("GET", "/api/pickup", input),
        ),
        book: mutation(
          { description: "Book a courier pickup. Body per the Book Pickup docs.", input: body("pickup") },
          async (_ctx, { body }) => call("POST", "/api/pickup/book", undefined, body),
        ),
      },
      { title: "Pickups", description: "Courier pickup requests." },
    ),
    documents: router(
      {
        list: query(
          { description: "List documents attached to an order.", input: object({ orderId: number() }) },
          async (_ctx, { orderId }) => call("GET", `/api/orders/${orderId}/documents`),
        ),
        upload: mutation(
          {
            description:
              "Upload a document or image to an order (sent as multipart/form-data). file_base64 is the base64-encoded file; document_type is optional (vendor example: OrderDocument).",
            input: object({ orderId: number(), ...fileInput }),
          },
          async (_ctx, { orderId, file_base64, filename, mime_type, document_type }) =>
            call.upload("POST", `/api/orders/${orderId}/documents`, file_base64, filename, mime_type, document_type),
        ),
        update: mutation(
          {
            description:
              "Replace an order document (sent as multipart/form-data). file_base64 is the base64-encoded file; document_type is optional.",
            input: object({ orderId: number(), documentId: number(), ...fileInput }),
          },
          async (_ctx, { orderId, documentId, file_base64, filename, mime_type, document_type }) =>
            call.upload("PUT", `/api/orders/${orderId}/documents/${documentId}`, file_base64, filename, mime_type, document_type),
        ),
        delete: mutation(
          {
            description: "Delete an order document.",
            input: object({ orderId: number(), documentId: number() }),
          },
          async (_ctx, { orderId, documentId }) =>
            call("DELETE", `/api/orders/${orderId}/documents/${documentId}`),
        ),
      },
      { title: "Order documents", description: "Documents attached to orders, such as invoices and packing slips." },
    ),
    tags: router(
      {
        list: query(
          {
            description: "List tags.",
            input: object({
              filter: string().optional(),
              page_number: number().optional(),
              page_size: number().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/api/tags", input),
        ),
        addToOrder: mutation(
          { description: "Add tags to an order (created if missing). Body per the docs.", input: body("tags") },
          async (_ctx, { body }) => call("POST", "/api/tags/order", undefined, body),
        ),
        removeFromOrder: mutation(
          { description: "Remove tags from an order. Body per the docs.", input: body("tags") },
          async (_ctx, { body }) => call("DELETE", "/api/tags/order", undefined, body),
        ),
      },
      { title: "Tags", description: "Order tags for filtering and automation." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { starshipit: starshipit.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.starshipit ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Starshipit",
        description:
          "Shipping with Starshipit: orders, labels, rates, tracking, manifests, products, pickups, order documents and tags.",
        icons,
      },
    ),
  }),
);

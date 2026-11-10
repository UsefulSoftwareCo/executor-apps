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
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.orderdesk.me/api/v2";

const orderdesk = defineProvider({
  name: "Order Desk",
  hosts: ["app.orderdesk.me"],
  auth: {
    apiKey: secrets({
      label: "Store ID and API key",
      fields: object({ storeId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/test`, { signal, headers: headers(account) });
    await decodeJson(response, object({ status: string() }));
    return { accountInfo: { externalId: account.fields.storeId, displayName: `Store ${account.fields.storeId}` } };
  },
});

type Account = { fields: { storeId: string; token: string } };

const headers = (account: Account, body = false): Record<string, string> => ({
  "ORDERDESK-STORE-ID": account.fields.storeId,
  "ORDERDESK-API-KEY": account.fields.token,
  ...(body ? { "content-type": "application/json" } : {}),
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const id = (value: string | number) => encodeURIComponent(String(value));

const fullRecord =
  " Updates replace the record: send the complete resource (fetch it first, change the fields you need), because omitted fields are blanked.";

const orderdeskTools = (account: Account, signal: AbortSignal) => {
  const send = async (
    fetch: typeof globalThis.fetch,
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: headers(account, body !== undefined),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      }),
      json(),
    );

  const orderId = object({ orderId: number() });

  return router({
    store: query(
      {
        description:
          "Get the store ID, name and folder list (folder ID to name). Use it to find folder IDs, which are specific to each store. The vendor's settings object is not returned because it holds the API key and SMTP credentials.",
        input: object({}),
      },
      async ({ fetch }) => {
        const { store } = await decodeJson(
          await fetch(`${base}/store`, { signal, headers: headers(account) }),
          object({ store: object({ id: string(), name: string(), folders: json() }) }),
        );
        return { store: { id: store.id, name: store.name, folders: store.folders } };
      },
    ),
    orders: router(
      {
        list: query(
          {
            description:
              "Search orders; filters combine with AND. Returns the 50 most recent orders by default. limit is at most 500; use offset to page and total_records to see what remains. folder_id may hold several comma-separated IDs. Dates are UTC as 'YYYY-MM-DD HH:MM:SS'; the *_local variants use store time. order_by defaults to date_added, order is ASC or DESC.",
            input: object({
              folder_id: string().optional(),
              folder_name: string().optional(),
              source_id: string().optional(),
              source_name: string().optional(),
              search_start_date: string().optional(),
              search_end_date: string().optional(),
              search_start_date_local: string().optional(),
              search_end_date_local: string().optional(),
              modified_start_date: string().optional(),
              modified_end_date: string().optional(),
              email: string().optional(),
              customer_id: string().optional(),
              customer_first_name: string().optional(),
              customer_last_name: string().optional(),
              customer_company: string().optional(),
              customer_address1: string().optional(),
              customer_phone: string().optional(),
              shipping_first_name: string().optional(),
              shipping_last_name: string().optional(),
              shipping_company: string().optional(),
              shipping_address1: string().optional(),
              shipping_phone: string().optional(),
              get_order_history: number().optional(),
              order_by: string().optional(),
              order: string().optional(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${base}/orders${search(input)}`, { signal, headers: headers(account) }), json()),
        ),
        get: query(
          {
            description:
              "Get one order by Order Desk's internal order ID, with its items, shipments, notes and discounts. To find an order by your own ID, use orders.list with source_id.",
            input: orderId,
          },
          async ({ fetch }, { orderId }) =>
            decodeJson(await fetch(`${base}/orders/${id(orderId)}`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description:
              "Create an order. order is the JSON order body: order_items (array of {name, price, quantity, code, weight, ...}) plus at least one customer or shipping name/company field. Common fields: source_id, source_name, email, folder_id, shipping_method, shipping_total, tax_total, payment_type, payment_status, customer {first_name, last_name, address1, city, state, postal_code, country, phone}, shipping {same fields}, discount_list, order_notes, order_metadata. If only one of customer or shipping is given the other is copied. A duplicate returns 400 with existing_order_id.",
            input: object({ order: json() }),
            approval: always(),
          },
          async ({ fetch }, { order }) => send(fetch, "POST", "/orders", order),
        ),
        update: mutation(
          {
            description: `Replace an order with the supplied record.${fullRecord} order_items with an id are updated, without an id are added, and omitted items are removed. Shipments cannot be changed here; use orders.shipments. Omitting folder_id keeps the current folder.`,
            input: object({ orderId: number(), order: json() }),
            approval: always(),
          },
          async ({ fetch }, { orderId, order }) => send(fetch, "PUT", `/orders/${id(orderId)}`, order),
        ),
        delete: mutation(
          {
            description:
              "Permanently delete an order with its items, shipments, notes and history. This cannot be undone; moving it to a Canceled or Closed folder with orders.move keeps the record.",
            input: orderId,
            approval: always(),
          },
          async ({ fetch }, { orderId }) => send(fetch, "DELETE", `/orders/${id(orderId)}`),
        ),
        move: mutation(
          {
            description:
              "Move one or more orders to a folder. Give exactly one of destinationFolderId or destinationFolderName (exact match). Triggers the destination folder's rules and adds a history entry. Returns per-order results including each previous folder.",
            input: object({
              orderIds: array(number()),
              destinationFolderId: number().optional(),
              destinationFolderName: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { orderIds, destinationFolderId, destinationFolderName }) => {
            if ((destinationFolderId === undefined) === (destinationFolderName === undefined))
              throw new Error("Pass exactly one of destinationFolderId or destinationFolderName, not both and not neither.");
            return send(fetch, "POST", "/move-orders", {
              order_id_list: orderIds,
              ...(destinationFolderId !== undefined ? { destination_folder_id: destinationFolderId } : {}),
              ...(destinationFolderName !== undefined ? { destination_folder_name: destinationFolderName } : {}),
            });
          },
        ),
        addHistory: mutation(
          {
            description:
              "Append an entry to an order's history (append-only, at most 250 entries per order, then 403). source_name defaults to API.",
            input: object({ orderId: number(), note: string(), sourceName: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { orderId, note, sourceName }) =>
            send(fetch, "POST", `/orders/${id(orderId)}/order-history`, {
              note,
              ...(sourceName !== undefined ? { source_name: sourceName } : {}),
            }),
        ),
        items: router(
          {
            list: query(
              { description: "List all line items of an order.", input: orderId },
              async ({ fetch }, { orderId }) =>
                decodeJson(
                  await fetch(`${base}/orders/${id(orderId)}/order-items`, { signal, headers: headers(account) }),
                  json(),
                ),
            ),
            get: query(
              { description: "Get one line item of an order.", input: object({ orderId: number(), itemId: number() }) },
              async ({ fetch }, { orderId, itemId }) =>
                decodeJson(
                  await fetch(`${base}/orders/${id(orderId)}/order-items/${id(itemId)}`, {
                    signal,
                    headers: headers(account),
                  }),
                  json(),
                ),
            ),
            create: mutation(
              {
                description:
                  "Add a line item to an order and recalculate totals. item fields: name, price, quantity, code (SKU), weight, category_code, fulfillment_method, variation_list, metadata. To add several at once, pass order_items to orders.update.",
                input: object({ orderId: number(), item: json() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, item }) => send(fetch, "POST", `/orders/${id(orderId)}/order-items`, item),
            ),
            update: mutation(
              {
                description: `Update an order line item.${fullRecord}`,
                input: object({ orderId: number(), itemId: number(), item: json() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, itemId, item }) =>
                send(fetch, "PUT", `/orders/${id(orderId)}/order-items/${id(itemId)}`, item),
            ),
            delete: mutation(
              {
                description: "Delete a line item from an order.",
                input: object({ orderId: number(), itemId: number() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, itemId }) =>
                send(fetch, "DELETE", `/orders/${id(orderId)}/order-items/${id(itemId)}`),
            ),
          },
          { title: "Order items", description: "Line items on an order." },
        ),
        shipments: router(
          {
            list: query(
              { description: "List all shipments of an order.", input: orderId },
              async ({ fetch }, { orderId }) =>
                decodeJson(
                  await fetch(`${base}/orders/${id(orderId)}/shipments`, { signal, headers: headers(account) }),
                  json(),
                ),
            ),
            get: query(
              {
                description: "Get one shipment of an order.",
                input: object({ orderId: number(), shipmentId: number() }),
              },
              async ({ fetch }, { orderId, shipmentId }) =>
                decodeJson(
                  await fetch(`${base}/orders/${id(orderId)}/shipments/${id(shipmentId)}`, {
                    signal,
                    headers: headers(account),
                  }),
                  json(),
                ),
            ),
            create: mutation(
              {
                description:
                  "Record a shipment (one per parcel; several mean a partial fulfillment). shipment fields: tracking_number (use 'n/a' if none), carrier_code, shipment_method, weight, cost, status, tracking_url (derived from carrier and number when omitted).",
                input: object({ orderId: number(), shipment: json() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, shipment }) =>
                send(fetch, "POST", `/orders/${id(orderId)}/shipments`, shipment),
            ),
            update: mutation(
              {
                description: `Update a shipment.${fullRecord}`,
                input: object({ orderId: number(), shipmentId: number(), shipment: json() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, shipmentId, shipment }) =>
                send(fetch, "PUT", `/orders/${id(orderId)}/shipments/${id(shipmentId)}`, shipment),
            ),
            delete: mutation(
              {
                description: "Delete a shipment from an order.",
                input: object({ orderId: number(), shipmentId: number() }),
                approval: always(),
              },
              async ({ fetch }, { orderId, shipmentId }) =>
                send(fetch, "DELETE", `/orders/${id(orderId)}/shipments/${id(shipmentId)}`),
            ),
            createBatch: mutation(
              {
                description:
                  "Add shipments to many orders in one request (one rate-limit token). Each entry carries order_id plus the shipment fields (tracking_number, carrier_code, shipment_method, weight, cost, status, tracking_url). The response has one result per entry; individual entries can fail while the request returns 200.",
                input: object({ shipments: array(json()) }),
                approval: always(),
              },
              async ({ fetch }, { shipments }) => send(fetch, "POST", "/batch-shipments", shipments),
            ),
          },
          { title: "Shipments", description: "Shipments and tracking for an order." },
        ),
      },
      { title: "Orders", description: "Search, create, update, move and delete orders." },
    ),
    inventory: router(
      {
        list: query(
          {
            description:
              "Search inventory items. search matches name, code and metadata together; use code for an exact SKU. update_source_not excludes items last updated by the named integration slug. updated_start_date is UTC. Paging is not documented by the vendor; the response reports total_records and records_returned.",
            input: object({
              id: number().optional(),
              search: string().optional(),
              name: string().optional(),
              code: string().optional(),
              metadata: string().optional(),
              manufacturer_sku: string().optional(),
              location: string().optional(),
              update_source_not: string().optional(),
              updated_start_date: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/inventory-items${search(input)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        get: query(
          { description: "Get one inventory item by Order Desk's internal ID.", input: object({ inventoryItemId: number() }) },
          async ({ fetch }, { inventoryItemId }) =>
            decodeJson(
              await fetch(`${base}/inventory-items/${id(inventoryItemId)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        create: mutation(
          {
            description:
              "Create an inventory item. item needs name and code (SKU, which must match the code orders arrive with); optional price, cost, weight, stock, variation_list, metadata, manufacturer_sku, location, update_source.",
            input: object({ item: json() }),
            approval: always(),
          },
          async ({ fetch }, { item }) => send(fetch, "POST", "/inventory-items", item),
        ),
        update: mutation(
          {
            description: `Update an inventory item.${fullRecord}`,
            input: object({ inventoryItemId: number(), item: json() }),
            approval: always(),
          },
          async ({ fetch }, { inventoryItemId, item }) =>
            send(fetch, "PUT", `/inventory-items/${id(inventoryItemId)}`, item),
        ),
        updateBatch: mutation(
          {
            description: `Update many inventory items in one request (one rate-limit token). Every entry must include its id.${fullRecord}`,
            input: object({ items: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { items }) => send(fetch, "PUT", "/batch-inventory-items", items),
        ),
        delete: mutation(
          {
            description: "Delete an inventory item.",
            input: object({ inventoryItemId: number() }),
            approval: always(),
          },
          async ({ fetch }, { inventoryItemId }) => send(fetch, "DELETE", `/inventory-items/${id(inventoryItemId)}`),
        ),
      },
      { title: "Inventory", description: "Inventory items and stock levels." },
    ),
  });
};

export default defineApp({ user: { accounts: { orderdesk: orderdesk.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.orderdesk ?? [], (account) => orderdeskTools(account, signal), { signal }), {
    title: "Order Desk",
    description: "Manage Order Desk ecommerce orders, line items, shipments, folders and inventory.",
    icons,
  }),
}));

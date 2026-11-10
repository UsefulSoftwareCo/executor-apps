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

const base = "https://api.shipday.com";

const shipday = defineProvider({
  name: "Shipday",
  hosts: ["api.shipday.com"],
  auth: {
    // The key is under Dashboard > My Account > API Key, sent as `Authorization: Basic <key>` exactly as shown.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/carriers`, { signal, headers: authorization(account.fields.token) });
    await decodeJson(response, json());
  },
});

function authorization(token: string) {
  return { Authorization: `Basic ${token}` };
}

type Params = Record<string, unknown>;

type Op = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  query?: boolean;
  body?: boolean;
};

const operations: Op[] = [
  { group: "orders", name: "listActive", method: "GET", path: "/orders", description: "List the active delivery orders of the account." },
  {
    group: "orders",
    name: "insert",
    method: "POST",
    path: "/orders",
    body: true,
    description:
      "Create a delivery order. Pass the order as body. Required: orderNumber, customerName, customerAddress, customerPhoneNumber (with country code), restaurantName, restaurantAddress. Optional: customerEmail, restaurantPhoneNumber, expectedDeliveryDate (yyyy-mm-dd), expectedPickupTime and expectedDeliveryTime (hh:mm:ss, UTC), pickupLatitude/pickupLongitude, deliveryLatitude/deliveryLongitude, orderItem (array), tips, tax, discountAmount, deliveryFee, totalOrderCost, pickupInstruction, deliveryInstruction, orderSource, additionalId, clientRestaurantId, paymentMethod, creditCardType, creditCardId, isCatering.",
  },
  {
    group: "orders",
    name: "edit",
    method: "PUT",
    path: "/order/edit/{orderId}",
    body: true,
    description:
      "Edit a delivery order by the orderId Shipday returned when it was created. Pass the full order as body. Required: orderNo, customerName, customerAddress, customerEmail, customerPhoneNumber, restaurantName, restaurantAddress; other fields match orders.insert (with orderItems, tip and totalCost).",
  },
  { group: "orders", name: "unassign", method: "PUT", path: "/orders/unassign/{orderId}", description: "Unassign a delivery order from its driver." },
  {
    group: "orders",
    name: "deliveryProgress",
    method: "GET",
    path: "/order/progress/{trackingId}",
    query: true,
    description:
      "Real-time delivery progress and ETA for an order, by tracking id. Pass query.isStaticDataRequired as true or false to include static order data.",
  },
  { group: "pickupOrders", name: "get", method: "GET", path: "/pickup-orders/{orderId}", description: "Get the details of a takeout (pickup) order." },
  {
    group: "pickupOrders",
    name: "insert",
    method: "POST",
    path: "/pickup-orders",
    body: true,
    description:
      "Create a takeout (pickup) order. Pass the order as body. Required: orderNumber, restaurant { name, address, phone? }, customer { name, phone, email? }. Optional: additionalId, tips, tax, discountAmount, totalOrderCost, orderItem (array), paymentMethod, pickupInstruction, expectedPickupDate (yyyy-mm-dd), expectedPickupTime (hh:mm:ss, UTC), orderSource.",
  },
  {
    group: "pickupOrders",
    name: "edit",
    method: "PUT",
    path: "/pickup-orders/{orderId}",
    body: true,
    description: "Edit a takeout (pickup) order. Pass the full order as body, with the same fields as pickupOrders.insert (restaurant may also carry latitude and longitude).",
  },
  { group: "pickupOrders", name: "delete", method: "DELETE", path: "/pickup-orders/{orderId}", description: "Delete a takeout (pickup) order." },
  { group: "carriers", name: "list", method: "GET", path: "/carriers", description: "List the carriers (drivers) of the account." },
  {
    group: "carriers",
    name: "add",
    method: "POST",
    path: "/carriers",
    body: true,
    description: "Add a carrier (driver). Pass body { name, email, phoneNumber }; all three are required.",
  },
  {
    group: "onDemand",
    name: "availability",
    method: "POST",
    path: "/on-demand/availability",
    body: true,
    description:
      "Get on-demand delivery estimates from third-party providers. Pass body { pickupAddress, deliveryAddress } (required) and optionally pickUpTime and deliveryTime as UTC ISO 8601 timestamps.",
  },
  {
    group: "onDemand",
    name: "assign",
    method: "POST",
    path: "/on-demand/assign",
    body: true,
    description:
      "Assign an order to a third-party delivery provider, usually after onDemand.availability. Pass body { name, orderId } (required) and optionally tip, estimateReference, contactlessDelivery, podType (PHOTO, SIGNATURE, PIN, NONE) or podTypes (array).",
  },
];

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Op, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const ids = pathParams(op.path);
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.query ? { query: record(json()) } : {}),
    ...(op.body ? { body: record(json()) } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries((args.query as Params | undefined) ?? {})) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: { ...authorization(token), ...(op.body ? { "Content-Type": "application/json" } : {}) },
      ...(op.body ? { body: JSON.stringify(args.body) } : {}),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return op.method === "GET" ? query({ description: op.description, input }, run) : mutation({ description: op.description, input }, run);
}

function rest(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, token, fetcher, signal);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { shipday: shipday.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shipday ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Shipday",
        description: "Shipday local delivery management: delivery and takeout orders, carriers (drivers), assignment and on-demand delivery estimates.",
        icons,
      },
    ),
  }),
);

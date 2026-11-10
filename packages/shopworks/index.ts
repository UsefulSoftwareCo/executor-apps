import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://manageordersapi.com/v1/manageorders";

const shopworks = defineProvider({
  name: "ShopWorks",
  hosts: ["manageordersapi.com"],
  auth: {
    // ManageOrders API access is granted by ShopWorks support; there is no OAuth.
    apiKey: secrets({
      label: "ManageOrders API credentials",
      fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  // A successful sign-in proves the credentials; the id_token is always present.
  async health({ account, fetch, signal }) {
    await signIn(fetch, signal, account.fields);
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username } };
  },
});

type Fetch = typeof fetch;

async function signIn(fetcher: Fetch, signal: AbortSignal | undefined, fields: { username: string; password: string }) {
  const response = await fetcher(`${base}/signin`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: fields.username, password: fields.password }),
  });
  const { id_token } = await decodeJson(response, object({ id_token: string() }));
  return id_token;
}

function build(fields: { username: string; password: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  // The id_token is valid for about an hour; renew it a little early.
  let session: { token: string; expires: number } | undefined;
  const token = async () => {
    if (session === undefined || session.expires < Date.now()) {
      session = { token: await signIn(fetcher, signal, fields), expires: Date.now() + 50 * 60 * 1000 };
    }
    return session.token;
  };
  const get = async (path: string, params: Record<string, unknown> = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { signal, headers: { Authorization: await token() } });
    return decodeJson(response, json());
  };
  const dates = (...names: string[]) =>
    Object.fromEntries(names.flatMap((n) => [[`${n}_start`, string().optional()], [`${n}_end`, string().optional()]]));
  const orderNo = { order_no: string() };

  return router({
    orders: router({
      list: query(
        {
          description:
            "List orders. Filter by customer (id_Customer) and by date range; dates are YYYY-MM-DD. Each date filter has _start and _end: date_Ordered, date_RequestedToShip, date_Produced, date_Shipped, date_Invoiced.",
          input: object({
            id_Customer: number().optional(),
            ...dates("date_RequestedToShip", "date_Produced", "date_Shipped", "date_Ordered", "date_Invoiced"),
          }),
        },
        (_ctx, args) => get("/orders", args),
      ),
      get: query(
        { description: "Get one order by its ManageOrders order number.", input: object(orderNo) },
        (_ctx, args) => get(`/orders/${encodeURIComponent(args.order_no)}`),
      ),
      getOrderNumber: query(
        {
          description: "Find the ManageOrders order number that matches an external order id.",
          input: object({ ext_order_id: string() }),
        },
        (_ctx, args) => get(`/getorderno/${encodeURIComponent(args.ext_order_id)}`),
      ),
    }),
    lineItems: router({
      list: query(
        { description: "List the line items of an order.", input: object(orderNo) },
        (_ctx, args) => get(`/lineitems/${encodeURIComponent(args.order_no)}`),
      ),
    }),
    payments: router({
      list: query(
        {
          description: "List web and OnSite payments applied in a date range (YYYY-MM-DD).",
          input: object(dates("date_PaymentApplied")),
        },
        (_ctx, args) => get("/payments", args),
      ),
      listForOrder: query(
        { description: "List the payments of an order.", input: object(orderNo) },
        (_ctx, args) => get(`/payments/${encodeURIComponent(args.order_no)}`),
      ),
    }),
    tracking: router({
      list: query(
        {
          description: "List tracking numbers imported or created in a date range (YYYY-MM-DD).",
          input: object(dates("date_Imported", "date_Creation")),
        },
        (_ctx, args) => get("/tracking", args),
      ),
      listForOrder: query(
        { description: "List the tracking numbers of an order.", input: object(orderNo) },
        (_ctx, args) => get(`/tracking/${encodeURIComponent(args.order_no)}`),
      ),
    }),
    inventoryLevels: router({
      list: query(
        {
          description:
            "List inventory levels, optionally filtered by modification date range (YYYY-MM-DD) or by part number, color, SKU, vendor and the other fields.",
          input: object({
            ...dates("date_Modification"),
            PartNumber: string().optional(),
            ColorRange: string().optional(),
            Color: string().optional(),
            GLAccount: string().optional(),
            SKU: string().optional(),
            PreprintGroup: string().optional(),
            ProductType: string().optional(),
            FindCode: string().optional(),
            id_Vendor: number().optional(),
            VendorName: string().optional(),
          }),
        },
        (_ctx, args) => get("/inventorylevels", args),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { shopworks: shopworks.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.shopworks ?? [], (account) => build(account.fields, fetch, signal), { signal }),
      {
        title: "ShopWorks",
        description:
          "Read-only access to ShopWorks ManageOrders: orders, line items, payments, tracking numbers and inventory levels.",
        icons,
      },
    ),
  }),
);

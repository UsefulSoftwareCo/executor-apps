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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.getdpd.com/v2";

const dpd = defineProvider({
  name: "DPD",
  hosts: ["api.getdpd.com"],
  auth: {
    apiKey: secrets({
      label: "Account username and API password",
      fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  // The storefront list is read-only and requires valid credentials (the root ping does not).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/storefronts`, { signal, headers: headers(account) });
    await decodeJson(response, json());
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username } };
  },
});

type Account = { fields: { username: string; password: string } };

// HTTP Basic: account username and the API password from the DPD profile page.
const basic = (value: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const headers = (account: Account) => ({
  Authorization: `Basic ${basic(`${account.fields.username}:${account.fields.password}`)}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const page = number().optional();

const dpdTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Record<string, string | number | boolean | undefined> = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers: headers(account) }), json());
  return router({
    ping: query(
      { description: "Ping the DPD API. Returns {status: SUCCESS}; does not check credentials.", input: object({}) },
      async ({ fetch }) => get("/")({ fetch }),
    ),
    listStorefronts: query(
      {
        description:
          "List storefronts (also called stores or websites) in the account, with id, name, url, currency, type (cart, subscription or clickbank) and subdomain.",
        input: object({}),
      },
      async ({ fetch }) => get("/storefronts")({ fetch }),
    ),
    getStorefront: query(
      { description: "Get one storefront by id.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => get(`/storefronts/${id}`)({ fetch }),
    ),
    listProducts: query(
      {
        description:
          "List products, optionally filtered to one storefront. Collections hold 100 records per page; page from 1 until the API answers {status: NOTFOUND}.",
        input: object({ storefront_id: number().optional(), page }),
      },
      async ({ fetch }, input) => get("/products", input)({ fetch }),
    ),
    getProduct: query(
      {
        description:
          "Get one product: name, descriptions, price, SKU, price options, file details, weight and visibility (0 hidden, 1 displayed).",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) => get(`/products/${id}`)({ fetch }),
    ),
    listPurchases: query(
      {
        description:
          "List purchases. status is ACT (active, paid), PND (pending), RFD (refunded), ERR (error), CAN (canceled) or HLD (held). customer_email, customer_first_name and customer_last_name are case-insensitive starts-with matches. date_min and date_max accept any strtotime format (account time zone unless an offset is given). total_op is eq, ne, gt or lt. ship=true returns purchases with unshipped tangible goods. 100 records per page; page from 1 until {status: NOTFOUND}.",
        input: object({
          status: string().optional(),
          product_id: number().optional(),
          storefront_id: number().optional(),
          customer_id: number().optional(),
          subscriber_id: number().optional(),
          customer_email: string().optional(),
          customer_first_name: string().optional(),
          customer_last_name: string().optional(),
          date_min: string().optional(),
          date_max: string().optional(),
          total: string().optional(),
          total_op: string().optional(),
          ship: boolean().optional(),
          page,
        }),
      },
      async ({ fetch }, input) => get("/purchases", input)({ fetch }),
    ),
    getPurchase: query(
      {
        description:
          "Get one purchase with buyer, billing and shipping details, line items (download counts, product keys), coupons, custom fields and payment transactions.",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) => get(`/purchases/${id}`)({ fetch }),
    ),
    reactivatePurchase: mutation(
      {
        description:
          "Reactivate a purchase, as the DPD web admin does: re-sends the delivery email. customer_email overrides the address on the purchase; refulfill=true fulfills the purchase again (sent form-encoded as the string 'true'; the vendor does not document the encoding). Returns {status: OK}.",
        input: object({ id: number(), customer_email: string().optional(), refulfill: boolean().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...input }) => {
        const form = new URLSearchParams();
        for (const [key, value] of Object.entries(input)) if (value !== undefined) form.set(key, String(value));
        return decodeJson(
          await fetch(`${base}/purchases/${id}/reactivate`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
          }),
          json(),
        );
      },
    ),
    listCustomers: query(
      {
        description:
          "List customers. email, first_name and last_name are case-insensitive starts-with matches. product_id filters to buyers of a product; receives_newsletters filters by email opt-in; date_min and date_max filter by creation time. 100 records per page.",
        input: object({
          email: string().optional(),
          first_name: string().optional(),
          last_name: string().optional(),
          product_id: number().optional(),
          receives_newsletters: boolean().optional(),
          date_min: string().optional(),
          date_max: string().optional(),
          page,
        }),
      },
      async ({ fetch }, input) => get("/customers", input)({ fetch }),
    ),
    getCustomer: query(
      { description: "Get one customer: name, email and newsletter opt-in.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => get(`/customers/${id}`)({ fetch }),
    ),
    listSubscribers: query(
      {
        description:
          "List subscribers of a subscription storefront, optionally by username (the subscriber's email address).",
        input: object({ storefront_id: number(), username: string().optional(), page }),
      },
      async ({ fetch }, { storefront_id, ...input }) => get(`/storefronts/${storefront_id}/subscribers`, input)({ fetch }),
    ),
    getSubscriber: query(
      {
        description:
          "Get one subscriber with their subscription (status NEW, TRIAL, ACTIVE, CANCELED, CLOSED or PAST_DUE; price, period, trial and payment dates).",
        input: object({ storefront_id: number(), id: number() }),
      },
      async ({ fetch }, { storefront_id, id }) => get(`/storefronts/${storefront_id}/subscribers/${id}`)({ fetch }),
    ),
    verifySubscriber: query(
      {
        description:
          "Look up a subscriber's subscription status by username (email) or subscriber id. ACTIVE, TRIAL and PAST_DUE are receiving service. Provide username, or a subscriber id. The vendor docs name the id parameter both id and subscriber_id, so each input is sent under its own name; use username when unsure.",
        input: object({
          storefront_id: number(),
          username: string().optional(),
          id: number().optional(),
          subscriber_id: number().optional(),
        }),
      },
      async ({ fetch }, { storefront_id, ...input }) =>
        get(`/storefronts/${storefront_id}/subscribers/verify`, input)({ fetch }),
    ),
  });
};

export default defineApp({ user: { accounts: { dpd: dpd.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.dpd ?? [], (account) => dpdTools(account, signal), { signal }), {
    title: "DPD",
    description: "Digital Product Delivery: storefronts, products, purchases, customers and subscription subscribers.",
    icons,
  }),
}));

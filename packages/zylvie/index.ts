import {
  accountRouter,
  array,
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

const base = "https://api.zylvie.com";

const zylvie = defineProvider({
  name: "Zylvie",
  hosts: ["api.zylvie.com"],
  auth: {
    apiKey: secrets({
      label: "API key (Settings > API)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ email: string(), brand: string() }));
    return { accountInfo: { externalId: me.email, displayName: me.brand, email: me.email } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account, body?: boolean) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  ...(body === true ? { "content-type": "application/json" } : {}),
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const display = "One of featured, listed, unlisted or unpublished.";
const pricing = "One of one-time, subscription or delayed (card pre-authorization).";

const productFields = {
  title: string().optional(),
  url: string().optional(),
  currency: string().optional(),
  price: number().optional(),
  pricing_model: string().optional(),
  display: string().optional(),
  subtitle: string().optional(),
  description: string().optional(),
  summary: string().optional(),
  interval: string().optional(),
  interval_count: number().optional(),
  trial_period_days: number().optional(),
  collect_address_and_phone: boolean().optional(),
  shipping_fee: number().optional(),
  shipping_type: string().optional(),
  categories: array(string()).optional(),
  tags: array(string()).optional(),
  productimages: array(string()).optional(),
  productfiles: array(string()).optional(),
  download_email_subject: string().optional(),
  download_email_body: string().optional(),
  success_url: string().optional(),
  success_email_subject: string().optional(),
  success_email_body: string().optional(),
  gated_page_url: string().optional(),
  gated_page_body: string().optional(),
  is_licensed: boolean().optional(),
  use_uploaded_license_codes: boolean().optional(),
  redemption_instructions: string().optional(),
  exclude_from_automations: boolean().optional(),
};

const couponFields = {
  is_storewide: boolean().optional(),
  products: array(string()).optional(),
  is_live: boolean().optional(),
  limit: number().optional(),
  limit_one_per_email: boolean().optional(),
  valid_for_days: number().optional(),
  duration_in_months: number().optional(),
  start: string().optional(),
  end: string().optional(),
  affiliate: string().optional(),
  requires_subscription_product: string().optional(),
};

const zylvieTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | boolean | undefined> = {}) =>
    decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers: headers(account) }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, { method, signal, headers: headers(account, true), body: JSON.stringify(body) }),
      json(),
    );

  return router({
    me: query(
      { description: "Get the authenticated Zylvie account: the email and brand name the API key belongs to.", input: object({}) },
      async ({ fetch }) => get(fetch, "/me"),
    ),
    createProduct: mutation(
      {
        description: `Create a product. Required: title, url (unique vanity slug of letters, digits, _, - and .), currency (lowercase ISO code such as usd), price, pricing_model and display. interval and interval_count are required when pricing_model is subscription. pricing_model: ${pricing} display: ${display} Categories and tags that do not exist are created. productimages and productfiles are public URLs. Returns the product, including its id.`,
        input: object({
          ...productFields,
          title: string(),
          url: string(),
          currency: string(),
          price: number(),
          pricing_model: string(),
          display: string(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/products/create", input),
    ),
    updateProduct: mutation(
      {
        description: `Update a product by id; fields you leave out keep their values. categories, tags, productimages and productfiles replace the existing lists. pricing_model: ${pricing} display: ${display} Returns the product.`,
        input: object({ id: string(), ...productFields }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "PUT", "/products/update", input),
    ),
    deleteProduct: mutation(
      {
        description:
          "Delete a product by id. A product with paid transactions or active subscriptions is archived instead (unpublished, unlisted, unfeatured); the message says which happened.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "DELETE", "/products/delete", input),
    ),
    listCoupons: query(
      {
        description:
          "List all coupons of the brand (no pagination). Active coupons by default; set archived to true for archived ones. Fetch both for the full set.",
        input: object({ archived: boolean().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/coupons/list", input),
    ),
    createCoupon: mutation(
      {
        description:
          "Create a coupon. code is unique, case-insensitive, at least 2 characters. type is percentage (amount 0.1-100) or fixed (amount 0.1-999999.99). is_storewide defaults to true; when false, products (product ids) is required. is_live defaults to false. limit is the total redemption cap. valid_for_days counts from the per-email grant date (see grantCoupon). duration_in_months limits how many subscription charges are discounted. start and end are ISO 8601 datetimes. Returns the coupon, including its id.",
        input: object({ code: string(), type: string(), amount: number(), ...couponFields }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/coupons/create", input),
    ),
    updateCoupon: mutation(
      {
        description:
          "Update a coupon by id; fields you leave out keep their values. products replaces the whole list. Same field rules as createCoupon. Returns the coupon.",
        input: object({
          id: string(),
          code: string().optional(),
          type: string().optional(),
          amount: number().optional(),
          ...couponFields,
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "PUT", "/coupons/update", input),
    ),
    deleteCoupon: mutation(
      {
        description: "Delete a coupon by id. A coupon used in paid transactions is archived instead of deleted.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "DELETE", "/coupons/delete", input),
    ),
    grantCoupon: mutation(
      {
        description:
          "Grant email addresses eligibility for a coupon that has valid_for_days set, starting the redemption window. Identify the coupon by code or id. Pass email, or emails for several. granted_at (ISO 8601) defaults to now and is ignored when a grant already exists for that email; the first grant counts.",
        input: object({
          code: string().optional(),
          id: string().optional(),
          email: string().optional(),
          emails: array(string()).optional(),
          granted_at: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/coupons/grants", input),
    ),
    getCouponGrant: query(
      {
        description:
          "Look up the grant of one email for a coupon, with its granted_at and expires_at. Identify the coupon by code or id.",
        input: object({ code: string().optional(), id: string().optional(), email: string() }),
      },
      async ({ fetch }, input) => get(fetch, "/coupons/grants", input),
    ),
    listTransactions: query(
      {
        description:
          "List transactions, newest first, in major currency units. Paginate with page (from 1) and limit (default 50, max 100) while has_more is true. Filters: status (succeeded, processing, canceled, awaiting_payment, marked_as_paid), refunded, email, product_id, transaction_id (gateway id), date_from and date_to (YYYY-MM-DD, inclusive).",
        input: object({
          page: number().optional(),
          limit: number().optional(),
          status: string().optional(),
          refunded: boolean().optional(),
          email: string().optional(),
          product_id: string().optional(),
          transaction_id: string().optional(),
          date_from: string().optional(),
          date_to: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/transactions/list", input),
    ),
    listSubscriptions: query(
      {
        description:
          "List subscriptions, newest first, in major currency units. Paginate with page (from 1) and limit (default 50, max 100) while has_more is true. Filters: status (incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid), email, product_id, subscription_id (gateway id), date_from and date_to (YYYY-MM-DD, inclusive).",
        input: object({
          page: number().optional(),
          limit: number().optional(),
          status: string().optional(),
          email: string().optional(),
          product_id: string().optional(),
          subscription_id: string().optional(),
          date_from: string().optional(),
          date_to: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/subscriptions/list", input),
    ),
    verifySubscription: query(
      {
        description:
          "Check the subscriptions of one subscriber email. Returns an array with status, interval, product title and subscriber details. Amounts here are in the smallest currency unit (cents).",
        input: object({ email: string() }),
      },
      async ({ fetch }, input) => get(fetch, "/subscriptions/verify", input),
    ),
    verifyLicenseKey: query(
      {
        description:
          "Verify a license key for a product: whether it is valid, who bought it, and its redeemed and refunded state.",
        input: object({ product_id: string(), license_key: string() }),
      },
      async ({ fetch }, input) => get(fetch, "/licensekeys/verify", input),
    ),
    listLicenseCodes: query(
      {
        description:
          "List the uploaded license codes of a product: unused codes and used codes with their redeemed and refunded state. Only applies to codes uploaded as a CSV on the product.",
        input: object({ product_id: string() }),
      },
      async ({ fetch }, input) => get(fetch, "/licensekeys/codes", input),
    ),
    redeemLicenseKey: mutation(
      {
        description: "Mark a license key as redeemed. An already redeemed key returns an error with redeemed_at.",
        input: object({ license_key: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/licensekeys/redeem", input),
    ),
    refundLicenseKey: mutation(
      {
        description: "Mark a license key as refunded. An already refunded key returns an error with refunded_at.",
        input: object({ license_key: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/licensekeys/refund", input),
    ),
    subscribeWebhook: mutation(
      {
        description:
          "Subscribe a URL to an event: trigger is sale, lead, affiliate, subscription or cancel. Idempotent by URL: an existing workflow for the same URL is returned. The response includes the signing_secret.",
        input: object({ trigger: string(), webhook_url: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/webhooks/subscribe", input),
    ),
    unsubscribeWebhook: mutation(
      {
        description: "Remove the webhook workflow for a URL. Returns an empty body; nothing changes if none matches.",
        input: object({ webhook_url: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const response = await fetch(`${base}/webhooks/unsubscribe`, {
          method: "DELETE",
          signal,
          headers: headers(account, true),
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error(`Zylvie returned ${response.status}`);
        return { status: "success" };
      },
    ),
  });
};

export default defineApp({ user: { accounts: { zylvie: zylvie.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.zylvie ?? [], (account) => zylvieTools(account, signal), { signal }), {
    title: "Zylvie",
    description:
      "Sell digital products with Zylvie: manage products, coupons, transactions, subscriptions, license keys and webhooks.",
    icons,
  }),
}));

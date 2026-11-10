import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://thrivecart.com/api/external";

const thrivecart = defineProvider({
  name: "ThriveCart",
  hosts: ["thrivecart.com"],
  auth: {
    // Generated in ThriveCart under Settings > API & Webhooks; keys look like XXXXXXXX-XXXXXXXXXX-XXXXXXXX-XXXXXXXX.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Client credentials come from an app registered at https://developers.thrivecart.com/apps/create/.
    oauth: oauth2({
      authorizationUrl: "https://thrivecart.com/authorization/new",
      tokenUrl: "https://thrivecart.com/authorization/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${base}/ping`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, "X-TC-Mode": "live" },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, params: Params = {}, mode: "live" | "test" = "live") => {
    const url = new URL(`${base}${path}`);
    const defined = Object.entries(params).filter(([, v]) => v !== undefined);
    if (method === "GET") for (const [k, v] of defined) url.searchParams.set(k, String(v));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-TC-Mode": mode,
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(Object.fromEntries(defined)) : undefined,
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const Mode = string().optional();
const modeDoc = "mode is \"live\" (default) or \"test\" to act on test-mode orders.";
const orderId = () => number();
const subId = () => number();

function build(call: Call) {
  const asMode = (m: string | undefined) => (m === "test" ? "test" : "live");

  const catalog = (kind: string, noun: string) => ({
    list: query(
      { description: `List ${noun} in the account. Optional page and perPage.`, input: object({ page: number().optional(), perPage: number().optional() }) },
      (_c, { page, perPage }) => call("GET", `/${kind}`, { page, perPage }),
    ),
    get: query(
      { description: `Get one of ${noun} by id.`, input: object({ id: string({ minLength: 1 }) }) },
      (_c, { id }) => call("GET", `/${kind}/${seg(id)}`),
    ),
    pricing: query(
      { description: `Get the pricing options of one of ${noun}.`, input: object({ id: string({ minLength: 1 }) }) },
      (_c, { id }) => call("GET", `/${kind}/${seg(id)}/pricing_options`),
    ),
  });

  const affiliateAction = (action: string, description: string, withProducts: boolean) =>
    mutation(
      {
        description,
        input: object({
          affiliateId: string({ minLength: 1 }),
          ...(withProducts ? { productIds: json().optional() } : {}),
        }),
        approval: always(),
      },
      (_c, input: any) =>
        call("POST", `/affiliates/${seg(input.affiliateId)}/${action}`, {
          product_ids: input.productIds === undefined ? undefined : JSON.stringify(input.productIds),
        }),
    );

  return router({
    account: router({
      ping: query({ description: "Get information about the authenticated ThriveCart account (also verifies the credentials).", input: object({}) }, () =>
        call("GET", "/ping"),
      ),
    }),
    products: router(catalog("products", "products")),
    bumps: router(catalog("bumps", "order bumps")),
    upsells: router(catalog("upsells", "upsells")),
    downsells: router(catalog("downsells", "downsells")),
    transactions: router({
      list: query(
        {
          description: `Search transactions (orders, charges, rebills, refunds, cancellations). query matches customer details such as email; transactionType is one of any, charge, rebill, refund, cancel; perPage is at most 100. ${modeDoc}`,
          input: object({
            query: string().optional(),
            transactionType: string().optional(),
            page: number().optional(),
            perPage: number().optional(),
            mode: Mode,
          }),
        },
        (_c, { mode, ...params }) => call("GET", "/transactions", params, asMode(mode)),
      ),
    }),
    customers: router({
      get: query(
        {
          description: `Look up a customer by email address, with their orders and subscriptions. This is a POST in the ThriveCart API but does not change anything. ${modeDoc}`,
          input: object({ email: string({ minLength: 3 }), mode: Mode }),
        },
        (_c, { email, mode }) => call("POST", "/customer", { email }, asMode(mode)),
      ),
    }),
    orders: router({
      refund: mutation(
        {
          description: `Refund an item of an order. reference is the item reference from the order (a product, bump, upsell or downsell reference); reason is optional (max 200 characters). ${modeDoc}`,
          input: object({ orderId: orderId(), reference: string({ minLength: 1 }), reason: string().optional(), mode: Mode }),
          approval: always(),
        },
        (_c, { orderId: order_id, reference, reason, mode }) => call("POST", "/refund", { order_id, reference, reason }, asMode(mode)),
      ),
    }),
    subscriptions: router({
      cancel: mutation(
        {
          description: `Cancel a subscription of an order. ${modeDoc}`,
          input: object({ orderId: orderId(), subscriptionId: subId(), mode: Mode }),
          approval: always(),
        },
        (_c, { orderId: order_id, subscriptionId: subscription_id, mode }) =>
          call("POST", "/cancelSubscription", { order_id, subscription_id }, asMode(mode)),
      ),
      pause: mutation(
        {
          description: `Pause a subscription. autoResume is an optional Unix timestamp at least a day in the future at which billing resumes. ${modeDoc}`,
          input: object({ orderId: orderId(), subscriptionId: subId(), autoResume: number().optional(), mode: Mode }),
          approval: always(),
        },
        (_c, { orderId: order_id, subscriptionId: subscription_id, autoResume: auto_resume, mode }) =>
          call("POST", "/pauseSubscription", { order_id, subscription_id, auto_resume }, asMode(mode)),
      ),
      resume: mutation(
        {
          description: `Resume a paused subscription. ${modeDoc}`,
          input: object({ orderId: orderId(), subscriptionId: subId(), mode: Mode }),
          approval: always(),
        },
        (_c, { orderId: order_id, subscriptionId: subscription_id, mode }) =>
          call("POST", "/resumeSubscription", { order_id, subscription_id }, asMode(mode)),
      ),
    }),
    affiliates: router({
      list: query(
        {
          description: "List affiliates, optionally filtered by query (name or email) or product_id. perPage is at most 25.",
          input: object({ query: string().optional(), productId: number().optional(), page: number().optional(), perPage: number().optional() }),
        },
        (_c, { productId, ...rest }) => call("GET", "/affiliates", { ...rest, product_id: productId }),
      ),
      get: query(
        {
          description: "Look up one affiliate by affiliate id, affiliate username or email. This is a POST in the ThriveCart API but does not change anything.",
          input: object({ affiliateId: string({ minLength: 1 }) }),
        },
        (_c, { affiliateId }) => call("POST", "/affiliate", { affiliate_id: affiliateId }),
      ),
      create: mutation(
        {
          description: "Create an affiliate for a product. affiliateId is the affiliate's chosen identifier; autoApprove approves them straight away; productIds optionally lists more products as a JSON array.",
          input: object({
            productId: number(),
            email: string().optional(),
            name: string().optional(),
            affiliateId: string().optional(),
            autoApprove: json().optional(),
            productIds: json().optional(),
          }),
          approval: always(),
        },
        (_c, { productId, email, name, affiliateId, autoApprove, productIds }) =>
          call("POST", "/affiliates", {
            email,
            name,
            affiliate_id: affiliateId,
            auto_approve: autoApprove,
            product_id: productId,
            product_ids: productIds === undefined ? undefined : JSON.stringify(productIds),
          }),
      ),
      register: affiliateAction("register", "Register an existing affiliate for products (productIds is a JSON array of product ids).", true),
      approve: affiliateAction("approve", "Approve an affiliate for products (productIds is a JSON array of product ids).", true),
      reject: affiliateAction("reject", "Reject an affiliate for products (productIds is a JSON array of product ids).", true),
      favorite: affiliateAction("favorite", "Mark an affiliate as a favorite.", false),
      unfavorite: affiliateAction("unfavorite", "Remove an affiliate from favorites.", false),
      delete: affiliateAction("delete", "Delete an affiliate.", false),
      setCustomCommissions: mutation(
        {
          description: "Set custom commissions for an affiliate on a product. commissionObject is the commission definition as a JSON object, as described in the ThriveCart API reference at https://apidocs.thrivecart.com.",
          input: object({ affiliateId: string({ minLength: 1 }), productId: number(), commissionObject: json() }),
          approval: always(),
        },
        (_c, { affiliateId, productId, commissionObject }) =>
          call("POST", `/affiliates/${seg(affiliateId)}/custom_commissions`, {
            product_id: productId,
            commission_object: JSON.stringify(commissionObject),
          }),
      ),
    }),
    events: router({
      subscribe: mutation(
        {
          description: "Subscribe a webhook URL to a ThriveCart event (for example order_created, order_rebill, order_refund_product, subscription_paused, cart_abandoned, affiliate_approved). triggerFields optionally limits the payload.",
          input: object({ event: string({ minLength: 1 }), targetUrl: string({ minLength: 1 }), triggerFields: json().optional() }),
          approval: always(),
        },
        (_c, { event, targetUrl, triggerFields }) =>
          call("POST", "/subscribe", { event, target_url: targetUrl, trigger_fields: triggerFields ?? [] }),
      ),
      unsubscribe: mutation(
        {
          description: "Cancel the event subscription that delivers to a webhook URL.",
          input: object({ targetUrl: string({ minLength: 1 }) }),
          approval: always(),
        },
        (_c, { targetUrl }) => call("POST", "/unsubscribe", { target_url: targetUrl }),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { thrivecart: thrivecart.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.thrivecart ?? [],
        (account) => build(client(account.method === "oauth" ? account.fields.access_token : account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "ThriveCart",
        description: "Manage a ThriveCart account: products, bumps, upsells, transactions, customers, refunds, subscriptions, affiliates and event subscriptions.",
        icons,
      },
    ),
  }),
);

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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.razorpay.com";

const razorpay = defineProvider({
  name: "Razorpay",
  hosts: ["api.razorpay.com"],
  auth: {
    // Razorpay API keys are a Key ID (rzp_test_... / rzp_live_...) and a Key Secret, sent as HTTP Basic auth.
    apiKey: secrets({
      label: "API key",
      fields: object({
        keyId: plain(string({ minLength: 1 })),
        keySecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/orders?count=1`, {
      signal,
      headers: { Authorization: basic(account.fields), Accept: "application/json" },
    });
    await decodeJson(response, object({ entity: string() }));
    return {
      accountInfo: {
        externalId: account.fields.keyId,
        displayName: account.fields.keyId,
        username: account.fields.keyId,
      },
    };
  },
});

function basic(fields: { keyId: string; keySecret: string }) {
  return `Basic ${btoa(`${fields.keyId}:${fields.keySecret}`)}`;
}

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(authorization: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}/v1${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/v1/"))
      throw new Error("path must stay under /v1 on api.razorpay.com");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    let response = await send();
    for (let attempt = 0; attempt < 3 && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1), 10_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Query = record(string());
const queryDoc =
  "Extra query parameters, for example {\"payment_id\": \"pay_...\", \"expand[]\": \"payments.card\"}.";
const listDoc =
  "count (1-100, default 10) and skip paginate; from and to are Unix timestamps in seconds.";
const bodyDoc = "Request JSON body exactly as in the Razorpay API reference. Amounts are integers in the smallest currency unit (paise for INR).";
const listInput = object({
  count: number().optional(),
  skip: number().optional(),
  from: number().optional(),
  to: number().optional(),
  query: Query.optional(),
});

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${listDoc} ${queryDoc}`, input: listInput }, (_c, { count, skip, from, to, query: q }) =>
      call("GET", path, { count, skip, from, to, ...(q ?? {}) }),
    );
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const children = (path: (i: string) => string, description: string) =>
    query({ description: `${description} ${listDoc} ${queryDoc}`, input: object({ id: id(), count: number().optional(), skip: number().optional(), from: number().optional(), to: number().optional(), query: Query.optional() }) }, (_c, { id: i, count, skip, from, to, query: q }) =>
      call("GET", path(i), { count, skip, from, to, ...(q ?? {}) }),
    );
  const create = (path: string, description: string) =>
    mutation({ description: `${description} ${bodyDoc}`, input: object({ body: json() }) }, (_c, { body }) =>
      call("POST", path, {}, body),
    );
  const createFor = (path: (i: string) => string, description: string) =>
    mutation({ description: `${description} ${bodyDoc}`, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) =>
      call("POST", path(i), {}, body),
    );
  const patch = (path: (i: string) => string, description: string) =>
    mutation({ description: `${description} ${bodyDoc}`, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) =>
      call("PATCH", path(i), {}, body),
    );
  const put = (path: (i: string) => string, description: string) =>
    mutation({ description: `${description} ${bodyDoc}`, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) =>
      call("PUT", path(i), {}, body),
    );
  const action = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("POST", path(i)));
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));

  const orders = router({
    list: list("/orders", "List orders (filter with authorized, receipt, expand[]=payments)."),
    get: get((i) => `/orders/${seg(i)}`, "Get an order by id."),
    create: create("/orders", "Create an order (amount, currency, receipt required by the API)."),
    update: patch((i) => `/orders/${seg(i)}`, "Update an order's notes."),
    payments: children((i) => `/orders/${seg(i)}/payments`, "List the payments made against an order."),
  });

  const payments = router({
    list: list("/payments", "List payments."),
    get: get((i) => `/payments/${seg(i)}`, "Get a payment by id."),
    capture: createFor((i) => `/payments/${seg(i)}/capture`, "Capture an authorized payment (amount and currency required)."),
    update: patch((i) => `/payments/${seg(i)}`, "Update a payment's notes."),
    card: get((i) => `/payments/${seg(i)}/card`, "Get the card details used for a payment."),
    refunds: children((i) => `/payments/${seg(i)}/refunds`, "List refunds for a payment."),
    refund: createFor((i) => `/payments/${seg(i)}/refund`, "Refund a captured payment, fully or partially (amount optional for full)."),
    getRefund: query(
      { description: "Get a refund made against a payment.", input: object({ id: id(), refundId: id() }) },
      (_c, { id: i, refundId }) => call("GET", `/payments/${seg(i)}/refunds/${seg(refundId)}`),
    ),
    transfers: children((i) => `/payments/${seg(i)}/transfers`, "List Route transfers created from a payment."),
    transfer: createFor((i) => `/payments/${seg(i)}/transfers`, "Create Route transfers from a payment (body: {transfers: [...]})."),
    createJson: create("/payments/create/json", "Create a payment via the S2S JSON API (requires the feature enabled on the account)."),
  });

  const refunds = router({
    list: list("/refunds", "List all refunds."),
    get: get((i) => `/refunds/${seg(i)}`, "Get a refund by id."),
    update: patch((i) => `/refunds/${seg(i)}`, "Update a refund's notes."),
  });

  const customers = router({
    list: list("/customers", "List customers."),
    get: get((i) => `/customers/${seg(i)}`, "Get a customer by id."),
    create: create("/customers", "Create a customer."),
    update: put((i) => `/customers/${seg(i)}`, "Update a customer."),
    tokens: children((i) => `/customers/${seg(i)}/tokens`, "List saved payment tokens for a customer."),
    getToken: query(
      { description: "Get a saved token for a customer.", input: object({ id: id(), tokenId: id() }) },
      (_c, { id: i, tokenId }) => call("GET", `/customers/${seg(i)}/tokens/${seg(tokenId)}`),
    ),
    deleteToken: mutation(
      { description: "Delete a saved token for a customer.", input: object({ id: id(), tokenId: id() }) },
      (_c, { id: i, tokenId }) => call("DELETE", `/customers/${seg(i)}/tokens/${seg(tokenId)}`),
    ),
  });

  const invoices = router({
    list: list("/invoices", "List invoices (filter with type, payment_id, customer_id, subscription_id, status)."),
    get: get((i) => `/invoices/${seg(i)}`, "Get an invoice by id."),
    create: create("/invoices", "Create an invoice."),
    update: patch((i) => `/invoices/${seg(i)}`, "Update a draft invoice."),
    issue: action((i) => `/invoices/${seg(i)}/issue`, "Issue a draft invoice."),
    cancel: action((i) => `/invoices/${seg(i)}/cancel`, "Cancel an issued invoice."),
    delete: remove((i) => `/invoices/${seg(i)}`, "Delete a draft invoice."),
    notify: mutation(
      { description: "Send the invoice to the customer by sms or email.", input: object({ id: id(), medium: string() }) },
      (_c, { id: i, medium }) => call("POST", `/invoices/${seg(i)}/notify_by/${seg(medium)}`),
    ),
  });

  const paymentLinks = router({
    list: list("/payment_links", "List payment links."),
    get: get((i) => `/payment_links/${seg(i)}`, "Get a payment link by id."),
    create: create("/payment_links", "Create a payment link."),
    update: patch((i) => `/payment_links/${seg(i)}`, "Update a payment link."),
    cancel: action((i) => `/payment_links/${seg(i)}/cancel`, "Cancel a payment link."),
    notify: mutation(
      { description: "Resend a payment link by sms or email.", input: object({ id: id(), medium: string() }) },
      (_c, { id: i, medium }) => call("POST", `/payment_links/${seg(i)}/notify_by/${seg(medium)}`),
    ),
  });

  const plans = router({
    list: list("/plans", "List subscription plans."),
    get: get((i) => `/plans/${seg(i)}`, "Get a plan by id."),
    create: create("/plans", "Create a plan."),
  });

  const subscriptions = router({
    list: list("/subscriptions", "List subscriptions (filter with plan_id)."),
    get: get((i) => `/subscriptions/${seg(i)}`, "Get a subscription by id."),
    create: create("/subscriptions", "Create a subscription."),
    update: patch((i) => `/subscriptions/${seg(i)}`, "Update a subscription (plan, quantity, schedule)."),
    cancel: createFor((i) => `/subscriptions/${seg(i)}/cancel`, "Cancel a subscription (body: {cancel_at_cycle_end})."),
    pause: createFor((i) => `/subscriptions/${seg(i)}/pause`, "Pause a subscription (body: {pause_at})."),
    resume: createFor((i) => `/subscriptions/${seg(i)}/resume`, "Resume a paused subscription (body: {resume_at})."),
    invoices: query(
      { description: "List invoices of a subscription.", input: object({ id: id(), count: number().optional(), skip: number().optional() }) },
      (_c, { id: i, count, skip }) => call("GET", "/invoices", { subscription_id: i, count, skip }),
    ),
  });

  const settlements = router({
    list: list("/settlements", "List settlements."),
    get: get((i) => `/settlements/${seg(i)}`, "Get a settlement by id."),
    reconciliation: query(
      {
        description: "Settlement reconciliation report for a day or month. year and month are required; day is optional.",
        input: object({ year: number(), month: number(), day: number().optional(), count: number().optional(), skip: number().optional() }),
      },
      (_c, p) => call("GET", "/settlements/recon/combined", p),
    ),
    ondemandList: list("/settlements/ondemand", "List on-demand settlements."),
    ondemandGet: get((i) => `/settlements/ondemand/${seg(i)}`, "Get an on-demand settlement by id."),
    ondemandCreate: create("/settlements/ondemand", "Create an on-demand settlement (amount, settle_full_balance, description)."),
  });

  const disputes = router({
    list: list("/disputes", "List disputes."),
    get: get((i) => `/disputes/${seg(i)}`, "Get a dispute by id."),
    accept: action((i) => `/disputes/${seg(i)}/accept`, "Accept a dispute."),
    contest: patch((i) => `/disputes/${seg(i)}/contest`, "Contest a dispute with evidence (body: {action, summary, files...})."),
  });

  const virtualAccounts = router({
    list: list("/virtual_accounts", "List virtual accounts."),
    get: get((i) => `/virtual_accounts/${seg(i)}`, "Get a virtual account by id."),
    create: create("/virtual_accounts", "Create a virtual account."),
    close: action((i) => `/virtual_accounts/${seg(i)}/close`, "Close a virtual account."),
    payments: children((i) => `/virtual_accounts/${seg(i)}/payments`, "List payments received by a virtual account."),
  });

  const qrCodes = router({
    list: list("/payments/qr_codes", "List QR codes."),
    get: get((i) => `/payments/qr_codes/${seg(i)}`, "Get a QR code by id."),
    create: create("/payments/qr_codes", "Create a QR code."),
    close: action((i) => `/payments/qr_codes/${seg(i)}/close`, "Close a QR code."),
    payments: children((i) => `/payments/qr_codes/${seg(i)}/payments`, "List payments received on a QR code."),
  });

  const transfers = router({
    list: list("/transfers", "List Route transfers."),
    get: get((i) => `/transfers/${seg(i)}`, "Get a transfer by id."),
    create: create("/transfers", "Create a Route transfer to a linked account."),
    update: patch((i) => `/transfers/${seg(i)}`, "Update a transfer (hold settlement, notes)."),
    reverse: createFor((i) => `/transfers/${seg(i)}/reversals`, "Reverse a transfer, fully or partially."),
    reversals: children((i) => `/transfers/${seg(i)}/reversals`, "List reversals of a transfer."),
  });

  const items = router({
    list: list("/items", "List items."),
    get: get((i) => `/items/${seg(i)}`, "Get an item by id."),
    create: create("/items", "Create an item for invoices."),
    update: patch((i) => `/items/${seg(i)}`, "Update an item."),
    delete: remove((i) => `/items/${seg(i)}`, "Delete an item."),
  });

  const offers = router({
    get: get((i) => `/offers/${seg(i)}`, "Get an offer by id."),
  });

  return router({
    orders,
    payments,
    refunds,
    customers,
    invoices,
    paymentLinks,
    plans,
    subscriptions,
    settlements,
    disputes,
    virtualAccounts,
    qrCodes,
    transfers,
    items,
    offers,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Razorpay v1 REST API. path is relative to /v1, for example /payouts. Prefer the dedicated tools.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: Query.optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#")) throw new Error("path must start with / and stay under /v1");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { razorpay: razorpay.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.razorpay ?? [],
        (account) =>
          withApprovals(build(client(basic(account.fields), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Razorpay",
        description:
          "Orders, payments, refunds, customers, invoices, payment links, subscriptions, settlements, disputes, virtual accounts, QR codes and Route transfers in Razorpay.",
        icons,
        instructions:
          "Amounts are integers in the smallest currency unit (paise for INR). List tools take count (max 100), skip, from and to (Unix seconds) plus a query record. Test keys (rzp_test_) and live keys (rzp_live_) act on separate data.",
      },
    ),
  }),
);

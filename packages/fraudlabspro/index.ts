import {
  accountRouter,
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

const base = "https://api.fraudlabspro.com/v2";

const fraudlabspro = defineProvider({
  name: "FraudLabs Pro",
  hosts: ["api.fraudlabspro.com"],
  auth: {
    // The API license key, shown under Dashboard > Account > API Key in the FraudLabs Pro merchant area.
    // It is sent as the `key` parameter of every request; the API has no header authentication.
    apiKey: secrets({
      label: "API license key",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint, so check the key with a read-only OTP lookup of a sentinel id. A bad key answers
  // error 10001 (INVALID API KEY) and an expired subscription 10006; any other answer (result N, or an
  // invalid-transaction error) means the key was accepted.
  async health({ account, fetch, signal }) {
    const target = new URL(`${base}/verification/result`);
    target.searchParams.set("key", account.fields.key);
    target.searchParams.set("tran_id", "healthcheck-sentinel");
    target.searchParams.set("otp", "000000");
    target.searchParams.set("format", "json");
    const response = await fetch(target.toString(), { signal });
    try {
      await decode(response);
    } catch (error) {
      if (error instanceof FraudLabsProError && (error.code === "10001" || error.code === "10006" || error.code === undefined)) throw error;
    }
  },
});

type Fetcher = typeof fetch;
type Params = Record<string, unknown>;

class FraudLabsProError extends Error {
  constructor(
    readonly code: string | undefined,
    message: string,
  ) {
    super(code === undefined ? message : `FraudLabs Pro error ${code}: ${message}`);
    this.name = "FraudLabsProError";
  }
}

// Failures come back as {"error": {"error_code": 10001, "error_message": "INVALID API KEY"}} (HTTP 400, observed
// live with a bogus key). Older sample responses use fraudlabspro_error_code / fraudlabspro_message, so both are checked.
function errorOf(body: unknown): FraudLabsProError | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const record = body as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "");
  const nested = record.error;
  if (typeof nested === "object" && nested !== null) {
    const inner = nested as Record<string, unknown>;
    const code = text(inner.error_code);
    const message = text(inner.error_message);
    if (code !== "" || message !== "") return new FraudLabsProError(code || undefined, message || "request failed");
  } else if (text(nested) !== "") {
    return new FraudLabsProError(text(record.error_code) || undefined, text(nested));
  }
  const flat = text(record.fraudlabspro_error_code);
  if (flat !== "" && flat !== "0") return new FraudLabsProError(flat, text(record.fraudlabspro_message) || "request failed");
  return undefined;
}

async function decode(response: Response): Promise<unknown> {
  const raw = await response.text();
  let body: unknown;
  try {
    body = raw === "" ? {} : JSON.parse(raw);
  } catch {
    throw new FraudLabsProError(undefined, `Expected JSON but got HTTP ${response.status}`);
  }
  const failure = errorOf(body);
  if (failure) throw failure;
  if (!response.ok) throw new FraudLabsProError(undefined, `Request failed with HTTP ${response.status}`);
  return body;
}

function client(key: string, fetcher: Fetcher, signal: AbortSignal | undefined) {
  const get = async (path: string, params: Params) => {
    const target = new URL(`${base}${path}`);
    target.searchParams.set("key", key);
    target.searchParams.set("format", "json");
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) target.searchParams.set(name, String(value));
    }
    return decode(await fetcher(target.toString(), { signal }));
  };
  const post = async (path: string, params: Params) => {
    const body = { ...params, key, format: "json" };
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return decode(response);
  };
  return { get, post };
}

const Screen = {
  order: object({
    ip: string({ minLength: 1 }),
    email: string().optional(),
    email_hash: string().optional(),
    email_domain: string().optional(),
    first_name: string().optional(),
    last_name: string().optional(),
    username: string().optional(),
    user_phone: string().optional(),
    bill_to: string().optional(),
    bill_addr: string().optional(),
    bill_city: string().optional(),
    bill_state: string().optional(),
    bill_country: string().optional(),
    bill_zip_code: string().optional(),
    ship_first_name: string().optional(),
    ship_last_name: string().optional(),
    ship_addr: string().optional(),
    ship_city: string().optional(),
    ship_state: string().optional(),
    ship_country: string().optional(),
    ship_zip_code: string().optional(),
    ship_method: string().optional(),
    bin_no: string().optional(),
    card_hash: string().optional(),
    avs_result: string().optional(),
    cvv_result: string().optional(),
    user_order_id: string().optional(),
    amount: number().optional(),
    quantity: number().optional(),
    currency: string().optional(),
    department: string().optional(),
    items: json().optional(),
    payment_gateway: string().optional(),
    payment_mode: string().optional(),
    coupon_code: string().optional(),
    flp_checksum: string().optional(),
  }),
  user: object({
    email: string({ minLength: 1 }),
    ip: string({ minLength: 1 }),
    first_name: string().optional(),
    last_name: string().optional(),
    phone: string().optional(),
    flp_checksum: string().optional(),
  }),
};

function tools(key: string, fetcher: Fetcher, signal: AbortSignal | undefined) {
  const api = client(key, fetcher, signal);
  return router({
    orders: router(
      {
        screen: mutation(
          {
            description:
              "Screen an order for fraud. Requires ip; bill_to is the billing contact name; returns fraudlabspro_score (1-100), fraudlabspro_status (APPROVE, REJECT or REVIEW), triggered rules, fraudlabspro_id and remaining_credits. Consumes a screening credit. Card numbers must be sent as bin_no (first 6-8 digits) or a SHA2 card_hash, never in full. ship_method is standard_delivery or local_pickup; payment_mode is creditcard, paypal, cod, bankdeposit, giftcard, crypto, wired or others; items is a JSON array of {sku, quantity, price, type?, name?, purchase_type?}; user_order_id is at most 15 characters.",
            input: Screen.order,
          },
          async (_ctx, input) => api.post("/order/screen", input),
        ),
        getResult: query(
          {
            description:
              "Get the stored result of a screened order by FraudLabs Pro transaction id (or the merchant's own order id). Paid plans only.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => api.get("/order/result", { id }),
        ),
        feedback: mutation(
          {
            description:
              "Approve or reject an order that is pending manual review. action is exactly APPROVE, REJECT or REJECT_BLACKLIST (reject and add the order's details to the blacklist); id is the fraudlabspro_id from orders.screen; note is an optional free-text comment. FraudLabs Pro learns from this feedback.",
            input: object({
              id: string({ minLength: 1 }),
              action: string({ minLength: 1 }),
              note: string().optional(),
            }),
          },
          async (_ctx, input) => api.post("/order/feedback", input),
        ),
      },
      { title: "Orders", description: "Screen e-commerce orders for fraud and review the outcome." },
    ),
    users: router(
      {
        screen: mutation(
          {
            description:
              "Screen a user sign-in or sign-up for account takeover fraud. Requires email and ip; returns user_score (1-100), user_transaction_status (APPROVE, REJECT or REVIEW) and reasons. Medium plan or higher. phone is in international format, such as +11234567890.",
            input: Screen.user,
          },
          async (_ctx, input) => api.post("/user/screen", input),
        ),
        getResult: query(
          {
            description: "Get the stored result of a user screening by its user transaction id. Medium plan or higher.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => api.get("/user/result", { id }),
        ),
        feedback: mutation(
          {
            description:
              "Approve or reject a user transaction pending manual review. id is the user transaction id from users.screen (format YYYYMMDD-XXXXXX); action is exactly APPROVE, REJECT or REJECT_BLACKLIST; reason is required free text. Medium plan or higher.",
            input: object({
              id: string({ minLength: 1 }),
              action: string({ minLength: 1 }),
              reason: string({ minLength: 1 }),
            }),
          },
          async (_ctx, input) => api.post("/user/feedback", input),
        ),
      },
      { title: "Users", description: "Screen user accounts for takeover fraud." },
    ),
    payments: router(
      {
        feedback: mutation(
          {
            description:
              "Report the final payment gateway outcome for an order so FraudLabs Pro can improve scoring. status is the final payment status, such as declined; message is the text the gateway returned.",
            input: object({
              email: string({ minLength: 1 }),
              status: string({ minLength: 1 }),
              message: string({ minLength: 1 }),
              fraudlabspro_id: string().optional(),
            }),
          },
          async (_ctx, input) => api.post("/payment/feedback", input),
        ),
      },
      { title: "Payments", description: "Send payment outcomes back to FraudLabs Pro." },
    ),
    verification: router(
      {
        sendSms: mutation(
          {
            description:
              "Send an SMS one-time password to a phone number. tel is E.164 (+12015550123). mesg is the message template containing <otp>, 1-140 characters, no URLs. otp_timeout is seconds, an integer from 15 to 86400 (default 3600). Consumes an SMS credit; returns tran_id and credits_remaining. Only the exact test number +11 simulates a send without charge (OTP 123456); +11234 returns Invalid phone number.",
            input: object({
              tel: string({ minLength: 1 }),
              mesg: string({ minLength: 1 }),
              country_code: string().optional(),
              otp_timeout: number().optional(),
            }),
          },
          async (_ctx, input) => api.post("/verification/send", input),
        ),
        getResult: query(
          {
            description: "Check an OTP the user entered against a tran_id from sendSms. result is Y when it matches, N otherwise.",
            input: object({ tran_id: string({ minLength: 1 }), otp: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => api.get("/verification/result", input),
        ),
      },
      { title: "Verification", description: "Verify phone numbers with SMS one-time passwords." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { fraudlabspro: fraudlabspro.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fraudlabspro ?? [],
        (account) =>
          withApprovals(tools(account.fields.key, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "FraudLabs Pro",
        description:
          "Fraud screening with FraudLabs Pro: screen orders and user sign-ins, fetch results, send review and payment feedback, and verify phone numbers by SMS OTP.",
        icons,
      },
    ),
  }),
);

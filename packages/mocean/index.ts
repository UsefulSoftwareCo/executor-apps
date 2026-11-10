import {
  accountRouter,
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

const base = "https://rest.moceanapi.com/rest/2";

const mocean = defineProvider({
  name: "Mocean",
  hosts: ["rest.moceanapi.com"],
  auth: {
    apiToken: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Legacy credentials: sent as mocean-api-key / mocean-api-secret request parameters.
    keySecret: secrets({
      label: "API key and secret (legacy)",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  // The balance endpoint is read-only and returns status 0 only when the credentials are valid.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/balance?${encode(account, {})}`, {
      signal,
      headers: headers(account),
    });
    const { status } = await decodeJson(response, object({ status: number() }));
    if (status !== 0) throw new Error(`Mocean rejected the credentials (status ${status})`);
  },
});

type Account =
  | { method: "apiToken"; fields: { token: string } }
  | { method: "keySecret"; fields: { key: string; secret: string } };

type Params = Record<string, string | number | undefined>;

const headers = (account: Account): Record<string, string> =>
  account.method === "apiToken" ? { Authorization: `Bearer ${account.fields.token}` } : {};

// Every parameter is prefixed `mocean-`; credentials of the legacy method travel as parameters too.
function encode(account: Account, params: Params): string {
  const out = new URLSearchParams();
  if (account.method === "keySecret") {
    out.set("mocean-api-key", account.fields.key);
    out.set("mocean-api-secret", account.fields.secret);
  }
  out.set("mocean-resp-format", "json");
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(`mocean-${key}`, String(value));
  return out.toString();
}

const moceanTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Params) =>
    decodeJson(await fetch(`${base}${path}?${encode(account, params)}`, { signal, headers: headers(account) }), json());
  const post = async (fetch: typeof globalThis.fetch, path: string, params: Params) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
        body: encode(account, params),
      }),
      json(),
    );

  return router({
    getBalance: query(
      {
        description: "Get the account credit balance. Returns status (0 is OK) and value.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/account/balance", {}),
    ),
    getPricing: query(
      {
        description:
          "Get the price list per destination (country, operator, mcc, mnc, price, currency). type is sms (default), number-lookup or verify. Pass mcc (and mnc) to limit it to one network.",
        input: object({ type: string().optional(), mcc: number().optional(), mnc: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/account/pricing", input),
    ),
    getMessageStatus: query(
      {
        description:
          "Look up the delivery status of a sent SMS by msgid. message_status: 1 success, 2 failed, 3 expired, 4 pending, 5 not found. Also returns credit_deducted.",
        input: object({ msgid: string() }),
      },
      async ({ fetch }, input) => get(fetch, "/report/message", input),
    ),
    lookupNumber: mutation(
      {
        description:
          "Number lookup (billed): returns current and original carrier (country, name, mcc, mnc, network code) and ported status for a number with country code, in synchronous mode.",
        input: object({ to: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, "/nl", input),
    ),
    sendSms: mutation(
      {
        description:
          "Send an SMS (billed). from is the sender ID, to is one or more numbers with country code separated by commas or spaces (max 500), text is the body. Optional: coding (1 7-bit, 2 8-bit, 3 UCS2), charset, validity in seconds, schedule as YYYY-MM-DD hh:mm:ss in GMT+8, dlrMask 1 with dlrUrl for delivery reports. Returns messages[] with status, receiver and msgid.",
        input: object({
          from: string(),
          to: string(),
          text: string(),
          coding: number().optional(),
          charset: string().optional(),
          validity: number().optional(),
          schedule: string().optional(),
          dlrMask: number().optional(),
          dlrUrl: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { dlrMask, dlrUrl, ...input }) =>
        post(fetch, "/sms", { ...input, "dlr-mask": dlrMask, "dlr-url": dlrUrl }),
    ),
    sendConversionFeedback: mutation(
      {
        description:
          "Report whether the recipient received a message (for example after entering an OTP) so Mocean can improve routing. delivered is true or false; timestamp is yyyy-MM-dd HH:mm:ss.",
        input: object({ msgid: string(), delivered: string(), timestamp: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, "/conversion", input),
    ),
    sendVerifyCodeSms: mutation(
      {
        description:
          "Send a one-time verification code by SMS (billed per attempt). brand is your company or app name. Optional: from sender ID, codeLength 4 or 6, pinValidity 60-3600 seconds. Returns reqid to use with checkVerifyCode.",
        input: object({
          to: string(),
          brand: string(),
          from: string().optional(),
          codeLength: number().optional(),
          pinValidity: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { codeLength, pinValidity, ...input }) =>
        post(fetch, "/verify/req/sms", { ...input, "code-length": codeLength, "pin-validity": pinValidity }),
    ),
    sendVerifyCodeTelegram: mutation(
      {
        description:
          "Send a one-time verification code through a Telegram bot. from is the bot username, to is the Telegram chat ID, brand is your company or app name. Returns reqid.",
        input: object({
          from: string(),
          to: string(),
          brand: string(),
          codeLength: number().optional(),
          pinValidity: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { codeLength, pinValidity, ...input }) =>
        post(fetch, "/verify/req/telegram", { ...input, "code-length": codeLength, "pin-validity": pinValidity }),
    ),
    resendVerifyCodeSms: mutation(
      {
        description: "Resend the verification code of an existing request by SMS (billed). reqid comes from sendVerifyCodeSms.",
        input: object({ reqid: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, "/verify/resend/sms", input),
    ),
    checkVerifyCode: mutation(
      {
        description:
          "Check the code a user entered against a verification request. Returns status 0 when it matches; 16 is a mismatch and 15 means more than 3 wrong attempts.",
        input: object({ reqid: string(), code: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, "/verify/check", input),
    ),
    dialVoiceCall: mutation(
      {
        description:
          "Place an outbound voice call (billed). to is one or more numbers with country code. command is a JSON array string of Mocean Call Control actions, for example [{\"action\":\"say\",\"language\":\"en-US\",\"text\":\"Hello\"}] (actions: say, play, collect, sleep, dial, record). Optional: from caller number, eventUrl webhook for call events. Returns calls[] with session_uuid and call_uuid.",
        input: object({
          to: string(),
          command: string(),
          from: string().optional(),
          eventUrl: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { eventUrl, ...input }) => post(fetch, "/voice/dial", { ...input, "event-url": eventUrl }),
    ),
    hangupVoiceCall: mutation(
      {
        description: "End an active voice call by call_uuid.",
        input: object({ callUuid: string() }),
        approval: always(),
      },
      async ({ fetch }, { callUuid }) => post(fetch, "/voice/hangup", { "call-uuid": callUuid }),
    ),
  });
};

export default defineApp({ user: { accounts: { mocean: mocean.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mocean ?? [], (account) => moceanTools(account, signal), { signal }), {
    title: "Mocean",
    description: "Send SMS, verify phone numbers with one-time codes, look up numbers and place voice calls.",
    icons,
  }),
}));

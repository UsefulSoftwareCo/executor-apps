import {
  accountRouter,
  defineApp,
  defineProvider,
  decodeJson,
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

const base = "https://app.authyo.io/api/v1";

const authyo = defineProvider({
  name: "Authyo",
  hosts: ["app.authyo.io"],
  auth: {
    apiKey: secrets({
      label: "Application credentials",
      fields: object({
        clientId: string({ minLength: 1 }),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // Authyo has no read-only account endpoint, so no health check is declared.
});

type Account = { fields: { clientId: string; clientSecret: string } };

const headers = (account: Account, origin?: string) => ({
  clientId: account.fields.clientId,
  clientSecret: account.fields.clientSecret,
  Accept: "application/json",
  ...(origin === undefined ? {} : { origin }),
});

const post = (account: Account, origin?: string) => ({
  method: "POST",
  headers: { ...headers(account, origin), "content-type": "application/json" },
});

const compact = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const authyoTools = (account: Account, signal: AbortSignal) =>
  router({
    sendOtp: mutation(
      {
        description:
          "Send a one-time password to a phone number (country code, no plus: 15551234567) or email address. authway is SMS, Email, WhatsApp or VoiceCall; omit it for the channel configured on the application. Supply otp to send your own code, otherwise Authyo generates one. expiry is seconds, otplength is digits. Usage-billed. Returns a maskId per recipient: pass it to verifyOtp.",
        input: object({
          to: string(),
          authway: string().optional(),
          otplength: number().optional(),
          expiry: number().optional(),
          otp: string().optional(),
          origin: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { origin, ...body }) =>
        decodeJson(
          await fetch(`${base}/auth/sendotp`, {
            ...post(account, origin),
            signal,
            body: JSON.stringify(compact(body)),
          }),
          json(),
        ),
    ),
    verifyOtp: query(
      {
        description:
          "Verify the OTP a user entered against the maskId returned by sendOtp. On success returns a session JWT (data.token, tokenType, expiresIn) and the user (phone, email, identity, userId).",
        input: object({ maskId: string(), otp: string(), origin: string().optional() }),
      },
      async ({ fetch }, { origin, ...input }) =>
        decodeJson(
          await fetch(`${base}/auth/verifyotp?${new URLSearchParams(input).toString()}`, {
            signal,
            headers: headers(account, origin),
          }),
          json(),
        ),
    ),
    verifyToken: query(
      {
        description:
          "Validate a session JWT issued by verifyOtp and return the user it belongs to (userId and verified identities). Server-to-server check.",
        input: object({ token: string(), origin: string().optional() }),
      },
      async ({ fetch }, { origin, token }) =>
        decodeJson(
          await fetch(`${base}/auth/verifytoken`, {
            ...post(account, origin),
            signal,
            body: JSON.stringify({ token }),
          }),
          json(),
        ),
    ),
    revokeSession: mutation(
      {
        description: "Revoke a user session by its JWT, for example when the user logs out. Irreversible.",
        input: object({ token: string() }),
        approval: always(),
      },
      async ({ fetch }, { token }) =>
        decodeJson(
          await fetch(`${base}/auth/revokesession`, { ...post(account), signal, body: JSON.stringify({ token }) }),
          json(),
        ),
    ),
    sendOrderNotification: mutation(
      {
        description:
          "Send an order or payment notification from a built-in template. templateType is one of order_placed, order_confirmed, order_shipped, order_out_for_delivery, order_delivered, order_cancelled, payment_succeeded, payment_failed, order_refunded, order_updated. authWay is SMS, Email or WhatsApp. variables are string values such as customerName, orderId, orderTotal, status, cancelReason, failureReason, paymentMethod, retryPaymentLink, trackingNo, estimatedDelivery, deliveryAgentName, refundedAmount, refundMethod, refundId, expectedCreditDate, orderDetailsLink, transactionId, trackingLink, feedbackLink, supportLink. Usage-billed.",
        input: object({
          to: string(),
          authWay: string(),
          templateType: string(),
          variables: object({}).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, body) =>
        decodeJson(
          await fetch(`${base}/notifications/order`, {
            ...post(account),
            signal,
            body: JSON.stringify(compact(body)),
          }),
          json(),
        ),
    ),
    sendInvoiceNotification: mutation(
      {
        description:
          "Send an invoice notification using the invoice_generated template. authWay is SMS, Email or WhatsApp. variables need customerName, invoiceNumber, amount and invoiceUrl (strings). Usage-billed.",
        input: object({
          to: string(),
          authWay: string(),
          templateType: string(),
          variables: object({}),
        }),
        approval: always(),
      },
      async ({ fetch }, body) =>
        decodeJson(
          await fetch(`${base}/notifications/invoice`, { ...post(account), signal, body: JSON.stringify(body) }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { authyo: authyo.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.authyo ?? [], (account) => authyoTools(account, signal), { signal }), {
    title: "Authyo",
    description: "Passwordless authentication with Authyo: send and verify OTPs over SMS, email, WhatsApp and voice, validate and revoke sessions, and send order and invoice notifications.",
    icons,
  }),
}));

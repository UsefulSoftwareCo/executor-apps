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

const base = "https://paychasers.com/api/v1";

const paychasers = defineProvider({
  name: "PayChasers",
  hosts: ["paychasers.com"],
  auth: {
    apiKey: secrets({
      label: "API key (starts with pck_)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, { signal, headers: headers(account) });
    const me = await decodeJson(response, object({ id: string(), email: string() }));
    return { accountInfo: { externalId: me.id, displayName: me.email, email: me.email } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const paychasersTools = (account: Account, signal: AbortSignal) =>
  router({
    getCurrentUser: query(
      {
        description: "Get the account behind the API key: id, email, name, plan and default currency.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/me`, { signal, headers: headers(account) }), json()),
    ),
    listClients: query(
      {
        description: "List all clients visible to the account.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/clients`, { signal, headers: headers(account) }), json()),
    ),
    createClient: mutation(
      {
        description: "Create a client. The API cannot delete clients afterwards.",
        input: object({ name: string(), email: string(), notes: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/clients`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    listChases: query(
      {
        description:
          "List payment chases, optionally filtered by status (SENT, PROMISED, OVERDUE or PAID) and limited in count. There is no pagination.",
        input: object({ status: string().optional(), limit: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/chases?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    createChase: mutation(
      {
        description:
          "Create a payment chase for a client; this can send the first reminder immediately. Give exactly one of clientId or clientEmail (an email finds or creates the client). dueDate is YYYY-MM-DD. chaseType is INVOICE (default), CLIENT_PAYMENT, CONTRACT_MILESTONE, PERSONAL_DEBT, BUSINESS_PAYMENT, SUBSCRIPTION or CUSTOM. deliveryChannel is EMAIL, WHATSAPP or BOTH (WhatsApp needs Pro+ and otherwise falls back to email). Free plans are capped at 5 chases and chases cannot be deleted.",
        input: object({
          paymentName: string(),
          amount: number(),
          currency: string(),
          clientId: string().optional(),
          clientEmail: string().optional(),
          clientName: string().optional(),
          dueDate: string().optional(),
          chaseType: string().optional(),
          autoChase: boolean().optional(),
          deliveryChannel: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/chases`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    markChasePaid: mutation(
      {
        description: "Mark a chase as paid. This cannot be undone and stops automated follow-ups.",
        input: object({ chaseId: string() }),
        approval: always(),
      },
      async ({ fetch }, { chaseId }) =>
        decodeJson(
          await fetch(`${base}/chases/${encodeURIComponent(chaseId)}/paid`, {
            method: "PATCH",
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    sendFollowUp: mutation(
      {
        description:
          "Send a follow-up message to the chase's recipient immediately. tone is friendly, due_today, overdue or firm. Limited to 10 per hour.",
        input: object({ chaseId: string(), tone: string() }),
        approval: always(),
      },
      async ({ fetch }, { chaseId, tone }) =>
        decodeJson(
          await fetch(`${base}/chases/${encodeURIComponent(chaseId)}/follow-up`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({ tone }),
          }),
          json(),
        ),
    ),
    bulkCreateChases: mutation(
      {
        description:
          "Enterprise only (other plans get 403). Create up to 500 chases in one batch; accounts is an array of { clientEmail, clientName, paymentName, amount }. batchId is optional. Limited to 20 batches per hour. Returns 202 with processed and failed counts.",
        input: object({
          batchId: string().optional(),
          accounts: json(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/chases/bulk`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { paychasers: paychasers.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.paychasers ?? [], (account) => paychasersTools(account, signal), { signal }), {
    title: "PayChasers",
    description: "Manage clients and payment chases, send follow-up reminders and mark chases paid in PayChasers.",
    icons,
  }),
}));

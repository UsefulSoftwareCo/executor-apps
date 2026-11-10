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

const base = "https://api.moonclerk.com";

const moonclerk = defineProvider({
  name: "MoonClerk",
  hosts: ["api.moonclerk.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/forms?count=1`, { signal, headers: headers(account) });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Token token=${account.fields.token}`,
  Accept: "application/vnd.moonclerk+json;version=1",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const paging = {
  count: number().optional(),
  offset: number().optional(),
};

const get = (account: Account, signal: AbortSignal, fetch: typeof globalThis.fetch, path: string) =>
  fetch(`${base}${path}`, { signal, headers: headers(account) }).then((response) => decodeJson(response, json()));

const moonclerkTools = (account: Account, signal: AbortSignal) =>
  router({
    listForms: query(
      {
        description:
          "List MoonClerk payment forms (id, title, currency, payment_volume, successful_checkout_count). Returns 10 by default; count (1-100) and offset page through them.",
        input: object(paging),
      },
      async ({ fetch }, input) => get(account, signal, fetch, `/forms${search(input)}`),
    ),
    getForm: query(
      { description: "Get one payment form by numeric id.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => get(account, signal, fetch, `/forms/${id}`),
    ),
    listCustomers: query(
      {
        description:
          "List customers (called Plans in the MoonClerk web UI) with their subscription, payment method, discount and checkout data. Filters: form_id, status (active, canceled, expired, past_due, pending or unpaid), checkout_from and checkout_to (customers created, YYYY-MM-DD, UTC), next_payment_from and next_payment_to (next billing date, YYYY-MM-DD). Returns 10 by default; count (1-100) and offset page through them. Amounts are in cents.",
        input: object({
          form_id: number().optional(),
          status: string().optional(),
          checkout_from: string().optional(),
          checkout_to: string().optional(),
          next_payment_from: string().optional(),
          next_payment_to: string().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, input) => get(account, signal, fetch, `/customers${search(input)}`),
    ),
    getCustomer: query(
      {
        description: "Get one customer (a Plan in the MoonClerk web UI) by numeric id, including subscription details.",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) => get(account, signal, fetch, `/customers/${id}`),
    ),
    listPayments: query(
      {
        description:
          "List payments (id, date, status, amount, fee, amount_refunded, customer and Stripe references, custom fields). Filters: form_id, customer_id (MoonClerk customer id), status (successful, refunded or failed), date_from and date_to (YYYY-MM-DD, UTC). Returns 10 by default; count (1-100) and offset page through them. Amounts are in cents.",
        input: object({
          form_id: number().optional(),
          customer_id: number().optional(),
          status: string().optional(),
          date_from: string().optional(),
          date_to: string().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, input) => get(account, signal, fetch, `/payments${search(input)}`),
    ),
    getPayment: query(
      { description: "Get one payment by numeric id.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => get(account, signal, fetch, `/payments/${id}`),
    ),
  });

export default defineApp({ user: { accounts: { moonclerk: moonclerk.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.moonclerk ?? [], (account) => moonclerkTools(account, signal), { signal }), {
    title: "MoonClerk",
    description:
      "Read MoonClerk payment forms, customers (plans, with subscriptions) and payments. The MoonClerk API is read-only.",
    icons,
  }),
}));

import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  jsonSchema,
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

const base = "https://api.payhere.co/api/v1";

const payhere = defineProvider({
  name: "Payhere",
  hosts: ["api.payhere.co"],
  auth: {
    // Found under Integrations in the Payhere merchant admin; sent as a Bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: object({ id: number() }) }));
  },
});

type Account = { fields: { token: string } };

const paged = object({ page: number().optional(), perPage: number().optional() });

const payhereTools = (account: Account, signal: AbortSignal | undefined) => {
  const headers = { Accept: "application/json", Authorization: `Bearer ${account.fields.token}` };

  const list = (description: string, path: string) =>
    query(
      { description: `${description} Optional page and perPage (default 20, max 100); the response meta has total_pages.`, input: paged },
      async ({ fetch }, input) => {
        const params = new URLSearchParams();
        if (input.page !== undefined) params.set("page", String(input.page));
        if (input.perPage !== undefined) params.set("per_page", String(input.perPage));
        const text = params.toString();
        return decodeJson(await fetch(`${base}${path}${text === "" ? "" : `?${text}`}`, { signal, headers }), json());
      },
    );

  const get = (description: string, path: string) =>
    query({ description, input: object({}) }, async ({ fetch }) =>
      decodeJson(await fetch(`${base}${path}`, { signal, headers }), json()),
    );

  const byId = (description: string, path: string) =>
    query({ description, input: object({ id: number() }) }, async ({ fetch }, input) =>
      decodeJson(await fetch(`${base}${path}/${input.id}`, { signal, headers }), json()),
    );

  const write = (method: "POST" | "PUT", url: string, body: Record<string, unknown>, fetch: typeof globalThis.fetch) => {
    const clean = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
    return fetch(url, { method, signal, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(clean) });
  };

  const planCommon = {
    name: string().optional(),
    description: string().optional(),
    receiptText: string().optional(),
    hidden: boolean().optional(),
    successUrl: string().optional(),
    webhookUrl: string().optional(),
    payButtonText: string().optional(),
    showQty: boolean().optional(),
    setupFee: number().optional(),
    minBillingCycles: number().optional(),
    billingDay: number().optional(),
    cancelAfter: number().optional(),
    price: number().optional(),
    currency: string().optional(),
  };
  const planBody = (input: Record<string, unknown>) => ({
    payment_type: input.paymentType,
    user_selects_amount: input.userSelectsAmount,
    billing_interval: input.billingInterval,
    name: input.name,
    description: input.description,
    receipt_text: input.receiptText,
    hidden: input.hidden,
    success_url: input.successUrl,
    webhook_url: input.webhookUrl,
    pay_button_text: input.payButtonText,
    show_qty: input.showQty,
    setup_fee: input.setupFee,
    min_billing_cycles: input.minBillingCycles,
    billing_day: input.billingDay,
    cancel_after: input.cancelAfter,
    price: input.price,
    currency: input.currency,
  });

  return router({
    user: get("Get the user that owns the API key.", "/user"),
    company: router({
      get: get("Get the company (merchant account) for the API key: currency, VAT settings, plan and users.", "/current_company"),
      update: mutation(
        {
          description:
            "Update the company's receipt and checkout branding. buttonColor is a hex color; buttonText is empty (auto), white or black. Logo upload is not supported. Returns the company.",
          input: object({
            name: string().optional(),
            legalName: string().optional(),
            address: string().optional(),
            supportEmail: string().optional(),
            website: string().optional(),
            buttonColor: string().optional(),
            buttonText: jsonSchema({ type: "string", enum: ["", "white", "black"] }).optional(),
          }),
        },
        async ({ fetch }, input) => {
          const response = await write(
            "PUT",
            `${base}/current_company`,
            {
              name: input.name,
              legal_name: input.legalName,
              address: input.address,
              support_email: input.supportEmail,
              website: input.website,
              button_color: input.buttonColor,
              button_text: input.buttonText,
            },
            fetch,
          );
          return decodeJson(response, json());
        },
      ),
    }),
    stats: get("Payment stats for the last 30 days with 30-60 day comparison values, plus all-time payments.", "/current_company/stats"),
    customers: router({
      list: list("List customers, most recent first.", "/customers"),
      get: byId("Get a customer by id, including their subscriptions and payment history.", "/customers"),
    }),
    payments: router({
      list: list("List payments, most recent first.", "/payments"),
      get: byId("Get a payment by id.", "/payments"),
    }),
    plans: router({
      list: list("List payment plans (the products behind payment links).", "/plans"),
      create: mutation(
        {
          description:
            "Create a plan (a product behind a payment link). paymentType is recurring or one_off; billingInterval (week, month or year) applies to recurring plans; set userSelectsAmount for donations. setupFee, minBillingCycles, billingDay and cancelAfter are for recurring plans, showQty for one-off plans. Digital file uploads are not supported. Returns the created plan.",
          input: object({
            ...planCommon,
            paymentType: jsonSchema({ type: "string", enum: ["recurring", "one_off"] }).optional(),
            billingInterval: jsonSchema({ type: "string", enum: ["week", "month", "year"] }).optional(),
            userSelectsAmount: boolean().optional(),
          }),
        },
        async ({ fetch }, input) => {
          const response = await write("POST", `${base}/plans`, planBody(input), fetch);
          return decodeJson(response, json());
        },
      ),
      update: mutation(
        {
          description:
            "Update a plan by id. Only the fields given change. price and currency apply to one-off plans only; setupFee, minBillingCycles, billingDay and cancelAfter to recurring plans only. Returns the updated plan.",
          input: object({ id: number(), ...planCommon }),
        },
        async ({ fetch }, input) => {
          const { id, ...rest } = input;
          const response = await write("PUT", `${base}/plans/${id}`, planBody(rest), fetch);
          return decodeJson(response, json());
        },
      ),
    }),
    subscriptions: router({
      list: list("List subscriptions, most recent payment first, with customer and plan.", "/subscriptions"),
      get: byId("Get a subscription by id, including its customer, plan and payments.", "/subscriptions"),
      cancel: mutation(
        {
          description:
            "Cancel a subscription by id so there are no further payments (DELETE). Payhere's docs say the subscription is cancelled immediately but remains active until the period end. Returns { cancelled: true } on success.",
          input: object({ id: number() }),
        },
        async ({ fetch }, input) => {
          const response = await fetch(`${base}/subscriptions/${input.id}`, { method: "DELETE", signal, headers });
          if (!response.ok) throw new Error(`Payhere cancel failed: ${response.status} ${await response.text()}`);
          return { cancelled: true };
        },
      ),
    }),
    refunds: router({
      create: mutation(
        {
          description:
            "Refund a payment, fully or partially. amount is in the payment's currency in major units (1.5 is $1.50). reason is requested_by_customer, duplicate or fraudulent. Returns { refunded: true } on success.",
          input: object({ paymentId: number(), amount: number(), reason: jsonSchema({ type: "string", enum: ["requested_by_customer", "duplicate", "fraudulent"] }) }),
        },
        async ({ fetch }, input) => {
          const response = await fetch(`${base}/refunds`, {
            method: "POST",
            signal,
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ payment_id: input.paymentId, amount: input.amount, reason: input.reason }),
          });
          if (!response.ok) throw new Error(`Payhere refund failed: ${response.status} ${await response.text()}`);
          return { refunded: true };
        },
      ),
    }),
  });
};

export default defineApp({ user: { accounts: { payhere: payhere.many() } }, icons }, async ({ user, signal }) => ({
  tools: withApprovals(
    router(await accountRouter(user?.accounts.payhere ?? [], (account) => payhereTools(account, signal), { signal }), {
      title: "Payhere",
      description: "Payhere payment links: customers, payments, plans, subscriptions (including cancel), refunds and company info.",
      icons,
    }),
    (tool) => (tool.kind === "mutation" ? always() : undefined),
  ),
}));

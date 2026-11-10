import {
  accountRouter,
  array,
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

const base = "https://api.taxjar.com/v2";

const taxjar = defineProvider({
  name: "TaxJar",
  hosts: ["api.taxjar.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/categories`, { signal, headers: headers(account) });
    await decodeJson(response, object({ categories: array(object({ product_tax_code: string() })) }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  "x-api-version": "2022-01-24",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const lineItem = object({
  id: string().optional(),
  quantity: number().optional(),
  product_identifier: string().optional(),
  description: string().optional(),
  product_tax_code: string().optional(),
  unit_price: number().optional(),
  discount: number().optional(),
  sales_tax: number().optional(),
});

const nexusAddress = object({
  id: string().optional(),
  country: string(),
  zip: string().optional(),
  state: string().optional(),
  city: string().optional(),
  street: string().optional(),
});

const orderFields = {
  transaction_date: string(),
  provider: string().optional(),
  from_country: string().optional(),
  from_zip: string().optional(),
  from_state: string().optional(),
  from_city: string().optional(),
  from_street: string().optional(),
  to_country: string(),
  to_zip: string().optional(),
  to_state: string().optional(),
  to_city: string().optional(),
  to_street: string().optional(),
  amount: number(),
  shipping: number(),
  sales_tax: number(),
  customer_id: string().optional(),
  exemption_type: string().optional(),
  line_items: array(lineItem).optional(),
};

const orderUpdateFields = {
  transaction_id: string(),
  transaction_date: string().optional(),
  provider: string().optional(),
  from_country: string().optional(),
  from_zip: string().optional(),
  from_state: string().optional(),
  from_city: string().optional(),
  from_street: string().optional(),
  to_country: string().optional(),
  to_zip: string().optional(),
  to_state: string().optional(),
  to_city: string().optional(),
  to_street: string().optional(),
  amount: number().optional(),
  shipping: number().optional(),
  sales_tax: number().optional(),
  customer_id: string().optional(),
  exemption_type: string().optional(),
  line_items: array(lineItem).optional(),
};

const customerFields = {
  exemption_type: string(),
  name: string(),
  exempt_regions: array(object({ country: string(), state: string() })).optional(),
  country: string().optional(),
  state: string().optional(),
  zip: string().optional(),
  city: string().optional(),
  street: string().optional(),
};

const send = (
  account: Account,
  signal: AbortSignal,
  fetch: typeof globalThis.fetch,
  method: string,
  path: string,
  body?: unknown,
) =>
  fetch(`${base}${path}`, {
    method,
    signal,
    headers: { ...headers(account), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).then((response) => decodeJson(response, json()));

const taxjarTools = (account: Account, signal: AbortSignal) =>
  router({
    listCategories: query(
      {
        description:
          "List TaxJar product tax categories (product_tax_code, name, description). Requires a paid TaxJar account. Use the codes in line items when calculating tax.",
        input: object({}),
      },
      async ({ fetch }) => send(account, signal, fetch, "GET", "/categories"),
    ),
    getRatesForLocation: query(
      {
        description:
          "Get sales tax rates (state, county, city, combined, special districts, freight taxable) for a ZIP code. Optionally pass country (ISO alpha-2, default US), state, city and street for rooftop accuracy; outside the US also pass country and city/state where required. Billing: every rate lookup counts as a transaction toward the monthly plan limit (overage fees apply), so do not poll it casually.",
        input: object({
          zip: string(),
          country: string().optional(),
          state: string().optional(),
          city: string().optional(),
          street: string().optional(),
        }),
      },
      async ({ fetch }, { zip, ...rest }) =>
        send(account, signal, fetch, "GET", `/rates/${encodeURIComponent(zip)}${search(rest)}`),
    ),
    calculateSalesTax: query(
      {
        description:
          "Calculate sales tax for an order (read-only, nothing is recorded). Requires to_country, shipping, and either amount (order total excluding shipping) or line_items (id, quantity, product_tax_code, unit_price, discount); to_zip is required when to_country is US and to_state when it is US or CA. An address on file, nexus_addresses or from_* fields are also needed. Add from_* for the origin, nexus_addresses for nexus, customer_id for exemptions. Returns amount_to_collect, rate and a jurisdiction breakdown. Billing: every calculation counts as a transaction toward the monthly plan limit (overage fees apply), so do not call it casually.",
        input: object({
          from_country: string().optional(),
          from_zip: string().optional(),
          from_state: string().optional(),
          from_city: string().optional(),
          from_street: string().optional(),
          to_country: string(),
          to_zip: string().optional(),
          to_state: string().optional(),
          to_city: string().optional(),
          to_street: string().optional(),
          amount: number().optional(),
          shipping: number(),
          customer_id: string().optional(),
          exemption_type: string().optional(),
          nexus_addresses: array(nexusAddress).optional(),
          line_items: array(lineItem).optional(),
        }),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "POST", "/taxes", input),
    ),
    listOrders: query(
      {
        description:
          "List order transaction IDs. Filter with transaction_date (YYYY/MM/DD) or from_transaction_date and to_transaction_date, and provider (default api).",
        input: object({
          transaction_date: string().optional(),
          from_transaction_date: string().optional(),
          to_transaction_date: string().optional(),
          provider: string().optional(),
        }),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "GET", `/transactions/orders${search(input)}`),
    ),
    getOrder: query(
      {
        description: "Show one order transaction by transaction_id, with its line items and sales tax.",
        input: object({ transaction_id: string(), provider: string().optional() }),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "GET", `/transactions/orders/${encodeURIComponent(transaction_id)}${search(rest)}`),
    ),
    createOrder: mutation(
      {
        description:
          "Record an order transaction for reporting and filing. Requires transaction_id, transaction_date (ISO 8601), to_country, amount (order total including shipping, excluding sales tax), shipping and sales_tax; to_zip and to_state are required for US destinations. Needs an address on file or from_* fields. Positive amounts recommended (signed automatically).",
        input: object({ transaction_id: string(), ...orderFields }),
        approval: always(),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "POST", "/transactions/orders", input),
    ),
    updateOrder: mutation(
      {
        description: "Update a recorded order transaction by transaction_id; send only the fields to change.",
        input: object(orderUpdateFields),
        approval: always(),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "PUT", `/transactions/orders/${encodeURIComponent(transaction_id)}`, {
          transaction_id,
          ...rest,
        }),
    ),
    deleteOrder: mutation(
      {
        description: "Delete a recorded order transaction by transaction_id. Optional provider.",
        input: object({ transaction_id: string(), provider: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "DELETE", `/transactions/orders/${encodeURIComponent(transaction_id)}${search(rest)}`),
    ),
    listRefunds: query(
      {
        description:
          "List refund transaction IDs. Filter with transaction_date (YYYY/MM/DD) or from_transaction_date and to_transaction_date, and provider (default api).",
        input: object({
          transaction_date: string().optional(),
          from_transaction_date: string().optional(),
          to_transaction_date: string().optional(),
          provider: string().optional(),
        }),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "GET", `/transactions/refunds${search(input)}`),
    ),
    getRefund: query(
      {
        description: "Show one refund transaction by transaction_id.",
        input: object({ transaction_id: string(), provider: string().optional() }),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "GET", `/transactions/refunds/${encodeURIComponent(transaction_id)}${search(rest)}`),
    ),
    createRefund: mutation(
      {
        description:
          "Record a refund transaction. Requires transaction_id, transaction_reference_id (the original order), transaction_date, to_country, amount (including shipping, excluding sales tax), shipping and sales_tax; to_zip and to_state are required for US destinations. Needs an address on file or from_* fields. Negative amounts recommended (signed automatically).",
        input: object({ transaction_id: string(), transaction_reference_id: string(), ...orderFields }),
        approval: always(),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "POST", "/transactions/refunds", input),
    ),
    updateRefund: mutation(
      {
        description: "Update a recorded refund by transaction_id; send only the fields to change.",
        input: object({ ...orderUpdateFields, transaction_reference_id: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "PUT", `/transactions/refunds/${encodeURIComponent(transaction_id)}`, {
          transaction_id,
          ...rest,
        }),
    ),
    deleteRefund: mutation(
      {
        description: "Delete a recorded refund transaction by transaction_id. Optional provider.",
        input: object({ transaction_id: string(), provider: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { transaction_id, ...rest }) =>
        send(account, signal, fetch, "DELETE", `/transactions/refunds/${encodeURIComponent(transaction_id)}${search(rest)}`),
    ),
    listCustomers: query(
      { description: "List customer IDs (used for tax exemptions).", input: object({}) },
      async ({ fetch }) => send(account, signal, fetch, "GET", "/customers"),
    ),
    getCustomer: query(
      { description: "Show one customer by customer_id.", input: object({ customer_id: string() }) },
      async ({ fetch }, { customer_id }) =>
        send(account, signal, fetch, "GET", `/customers/${encodeURIComponent(customer_id)}`),
    ),
    createCustomer: mutation(
      {
        description:
          "Create an exempt customer. exemption_type is wholesale, government, other or non_exempt; exempt_regions lists country/state pairs.",
        input: object({ customer_id: string(), ...customerFields }),
        approval: always(),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "POST", "/customers", input),
    ),
    updateCustomer: mutation(
      {
        description: "Update a customer by customer_id; send only the fields to change.",
        input: object({
          customer_id: string(),
          exemption_type: string().optional(),
          name: string().optional(),
          exempt_regions: array(object({ country: string(), state: string() })).optional(),
          country: string().optional(),
          state: string().optional(),
          zip: string().optional(),
          city: string().optional(),
          street: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { customer_id, ...rest }) =>
        send(account, signal, fetch, "PUT", `/customers/${encodeURIComponent(customer_id)}`, { customer_id, ...rest }),
    ),
    deleteCustomer: mutation(
      { description: "Delete a customer by customer_id.", input: object({ customer_id: string() }), approval: always() },
      async ({ fetch }, { customer_id }) =>
        send(account, signal, fetch, "DELETE", `/customers/${encodeURIComponent(customer_id)}`),
    ),
    listNexusRegions: query(
      { description: "List the regions where your account has nexus (set up in TaxJar).", input: object({}) },
      async ({ fetch }) => send(account, signal, fetch, "GET", "/nexus/regions"),
    ),
    validateAddress: mutation(
      {
        description:
          "Validate and normalize a US address; returns suggested matches. Requires a TaxJar plan with address validation. Read-only despite using POST.",
        input: object({
          country: string().optional(),
          state: string().optional(),
          zip: string().optional(),
          city: string().optional(),
          street: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(account, signal, fetch, "POST", "/addresses/validate", input),
    ),
    listSummaryRates: query(
      {
        description: "List average sales tax rates per region (state/country) for use as a fallback estimate.",
        input: object({}),
      },
      async ({ fetch }) => send(account, signal, fetch, "GET", "/summary_rates"),
    ),
  });

export default defineApp({ user: { accounts: { taxjar: taxjar.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.taxjar ?? [], (account) => taxjarTools(account, signal), { signal }), {
    title: "TaxJar",
    description:
      "Calculate US and international sales tax, look up rates, and manage order and refund transactions, exempt customers, nexus regions and address validation in TaxJar.",
    icons,
  }),
}));

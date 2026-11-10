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
import { md5 } from "./md5.js";

const base = "https://api.mailbluster.com/api";

const mailbluster = defineProvider({
  name: "MailBluster",
  hosts: ["api.mailbluster.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing custom fields is read-only; MailBluster takes the raw key in Authorization, with no Bearer prefix.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/fields`, {
      signal,
      headers: { Authorization: account.fields.token, "Content-Type": "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: account.fields.token,
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const leadPath = (lead: string) => {
  const trimmed = lead.trim();
  return encodeURIComponent(trimmed.includes("@") ? md5(trimmed.toLowerCase()) : trimmed);
};

const leadDescription =
  "lead is the lead's email address (hashed for you) or its MD5 lead hash (MD5 of the lowercased email).";

const customer = object({
  email: string(),
  firstName: string().optional(),
  lastName: string().optional(),
  timezone: string().optional(),
  ipAddress: string().optional(),
  subscribed: boolean().optional(),
  fields: json().optional(),
  meta: json().optional(),
  tags: array(string()).optional(),
});

const orderItem = object({
  id: string(),
  name: string(),
  price: number(),
  quantity: number(),
});

const mailblusterTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetch: typeof globalThis.fetch,
    method: string,
    path: string,
    body?: unknown,
  ) => {
    const response = await fetch(`${base}${path}`, {
      method,
      signal,
      headers: headers(account),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (method === "DELETE" && response.ok && (await response.clone().text()) === "") return { success: true };
    return decodeJson(response, json());
  };
  return router({
    createLead: mutation(
      {
        description:
          "Create a lead (contact). fields holds custom field values keyed by merge tag, meta holds free-form metadata, tags are tag names. Set subscribed true to subscribe, doubleOptIn true to send a confirmation email, and overrideExisting true to update a lead that already exists.",
        input: object({
          email: string(),
          subscribed: boolean(),
          firstName: string().optional(),
          lastName: string().optional(),
          timezone: string().optional(),
          ipAddress: string().optional(),
          fields: json().optional(),
          meta: json().optional(),
          tags: array(string()).optional(),
          doubleOptIn: boolean().optional(),
          overrideExisting: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "POST", "/leads", input),
    ),
    getLead: query(
      {
        description: `Get one lead with its subscription state, fields, meta and tags. ${leadDescription}`,
        input: object({ lead: string() }),
      },
      async ({ fetch }, { lead }) => call(fetch, "GET", `/leads/${leadPath(lead)}`),
    ),
    updateLead: mutation(
      {
        description: `Update a lead. ${leadDescription} Send only what should change. addTags and removeTags are arrays of tag names; fields and meta are objects merged into the lead.`,
        input: object({
          lead: string(),
          firstName: string().optional(),
          lastName: string().optional(),
          timezone: string().optional(),
          ipAddress: string().optional(),
          subscribed: boolean().optional(),
          fields: json().optional(),
          meta: json().optional(),
          addTags: array(string()).optional(),
          removeTags: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { lead, ...body }) => call(fetch, "PUT", `/leads/${leadPath(lead)}`, body),
    ),
    deleteLead: mutation(
      {
        description: `Permanently delete a lead. ${leadDescription}`,
        input: object({ lead: string() }),
        approval: always(),
      },
      async ({ fetch }, { lead }) => call(fetch, "DELETE", `/leads/${leadPath(lead)}`),
    ),
    listFields: query(
      {
        description: "List the brand's custom lead fields with their ids, labels and merge tags.",
        input: object({}),
      },
      async ({ fetch }) => call(fetch, "GET", "/fields"),
    ),
    createField: mutation(
      {
        description: "Create a custom lead field. fieldMergeTag is the key used in lead fields and email merge tags.",
        input: object({ fieldLabel: string(), fieldMergeTag: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "POST", "/fields", input),
    ),
    updateField: mutation(
      {
        description: "Change the label and merge tag of a custom lead field by its numeric id (see listFields).",
        input: object({ fieldId: number(), fieldLabel: string(), fieldMergeTag: string() }),
        approval: always(),
      },
      async ({ fetch }, { fieldId, ...body }) => call(fetch, "PUT", `/fields/${fieldId}`, body),
    ),
    deleteField: mutation(
      {
        description: "Delete a custom lead field by its numeric id (see listFields).",
        input: object({ fieldId: number() }),
        approval: always(),
      },
      async ({ fetch }, { fieldId }) => call(fetch, "DELETE", `/fields/${fieldId}`),
    ),
    listProducts: query(
      {
        description:
          "List products, one page at a time. Pass pageNo from 1; the response meta.nextPageNo gives the next page.",
        input: object({ pageNo: number().optional() }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `/products${search(input)}`),
    ),
    getProduct: query(
      {
        description: "Get one product by the id you assigned when creating it.",
        input: object({ productId: string() }),
      },
      async ({ fetch }, { productId }) => call(fetch, "GET", `/products/${encodeURIComponent(productId)}`),
    ),
    createProduct: mutation(
      {
        description: "Create a product. id is your own external product id, used later in orders.",
        input: object({ id: string(), name: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "POST", "/products", input),
    ),
    updateProduct: mutation(
      {
        description: "Rename a product by its id.",
        input: object({ productId: string(), name: string() }),
        approval: always(),
      },
      async ({ fetch }, { productId, ...body }) =>
        call(fetch, "PUT", `/products/${encodeURIComponent(productId)}`, body),
    ),
    deleteProduct: mutation(
      {
        description: "Delete a product by its id.",
        input: object({ productId: string() }),
        approval: always(),
      },
      async ({ fetch }, { productId }) => call(fetch, "DELETE", `/products/${encodeURIComponent(productId)}`),
    ),
    listOrders: query(
      {
        description:
          "List orders, one page at a time. Pass pageNo from 1; the response meta.nextPageNo gives the next page.",
        input: object({ pageNo: number().optional() }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `/orders${search(input)}`),
    ),
    getOrder: query(
      {
        description: "Get one order by the id you assigned when creating it.",
        input: object({ orderId: string() }),
      },
      async ({ fetch }, { orderId }) => call(fetch, "GET", `/orders/${encodeURIComponent(orderId)}`),
    ),
    createOrder: mutation(
      {
        description:
          "Create an ecommerce order for a customer (created as a lead if new). id is your own order id, currency an ISO 4217 code, totalPrice the order total, items the line items (id, name, price, quantity). campaignId optionally attributes the order to a MailBluster campaign.",
        input: object({
          id: string(),
          customer,
          currency: string(),
          totalPrice: number(),
          items: array(orderItem),
          campaignId: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "POST", "/orders", input),
    ),
    updateOrder: mutation(
      {
        description:
          "Update an order by its id. Send only what should change: customer, items, currency, totalPrice or campaignId.",
        input: object({
          orderId: string(),
          customer: customer.optional(),
          items: array(orderItem).optional(),
          currency: string().optional(),
          totalPrice: number().optional(),
          campaignId: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { orderId, ...body }) => call(fetch, "PUT", `/orders/${encodeURIComponent(orderId)}`, body),
    ),
    deleteOrder: mutation(
      {
        description: "Delete an order by its id.",
        input: object({ orderId: string() }),
        approval: always(),
      },
      async ({ fetch }, { orderId }) => call(fetch, "DELETE", `/orders/${encodeURIComponent(orderId)}`),
    ),
  });
};

export default defineApp({ user: { accounts: { mailbluster: mailbluster.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mailbluster ?? [], (account) => mailblusterTools(account, signal), { signal }), {
    title: "MailBluster",
    description: "Manage MailBluster email marketing data: leads, custom fields, products and ecommerce orders.",
    icons,
  }),
}));

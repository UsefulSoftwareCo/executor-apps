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

const base = "https://api.quipteams.com/api/v1";

const quipteams = defineProvider({
  name: "quipteams",
  hosts: ["api.quipteams.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing a single quote is read-only; the body is only checked as JSON.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/quotes?limit=1`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const recipient = object({
  name: string(),
  email: string(),
  country: string(),
  address: string().optional(),
  phone_number: string().optional(),
});

const currentUser = object({
  name: string(),
  email: string(),
  country: string(),
  address: string().optional(),
  phone: string().optional(),
});

const actionType = "Store, Assign, Reassign, Sell or Support";
const page = "limit is 1-100 (default 25); pass the cursor from the previous response to fetch the next page.";

const quipteamsTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body?: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: { ...headers(account), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      json(),
    );
  const id = (value: string) => encodeURIComponent(value);

  return router({
    listQuotes: query(
      {
        description: `List quotes for the company. Filter by status (pending, in_progress, delivered, completed), country, and created_after/created_before (ISO 8601). sort is created_at, -created_at, updated_at or -updated_at. ${page}`,
        input: object({
          status: string().optional(),
          country: string().optional(),
          created_after: string().optional(),
          created_before: string().optional(),
          sort: string().optional(),
          limit: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/quotes${search(input)}`),
    ),
    getQuote: query(
      { description: "Get one quote by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: quoteId }) => get(fetch, `/quotes/${id(quoteId)}`),
    ),
    createQuote: mutation(
      {
        description:
          "Create a quote requesting devices. Each item needs either product_id (with optional configuration_id) or kit_id, a quantity, optional comments, and recipients (name, email, country, optional address and phone_number).",
        input: object({
          requester_email: string(),
          requester_name: string(),
          po_number: string().optional(),
          notification_emails: array(string()).optional(),
          items: array(
            object({
              product_id: string().optional(),
              configuration_id: string().optional(),
              kit_id: string().optional(),
              quantity: number(),
              comments: string().optional(),
              recipients: array(recipient),
            }),
          ),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/quotes", input),
    ),
    updateQuoteItem: mutation(
      {
        description:
          "Update a quote item: accept or reject it (action), choose an alternative_id offered on the item, or replace its recipients.",
        input: object({
          id: string(),
          itemId: string(),
          action: string().optional(),
          alternative_id: string().optional(),
          recipients: array(recipient).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id: quoteId, itemId, ...body }) =>
        send(fetch, "PATCH", `/quotes/${id(quoteId)}/items/${id(itemId)}`, body),
    ),
    actionQuoteItem: mutation(
      {
        description: "Accept or reject one quote item. action is accept or reject.",
        input: object({ id: string(), itemId: string(), action: string() }),
        approval: always(),
      },
      async ({ fetch }, { id: quoteId, itemId, action }) =>
        send(fetch, "POST", `/quotes/${id(quoteId)}/items/${id(itemId)}/action`, { action }),
    ),
    listAssets: query(
      {
        description: `List assets (devices in inventory). Filter by serial_number (exact), item_id (asset UUID), country, device_type (Laptop, Monitor, Mouse, Keyboard, Headphones, Webcam, Accessory) or search across serial number, description and employee. sort is created_at, -created_at, updated_at or -updated_at. ${page}`,
        input: object({
          serial_number: string().optional(),
          item_id: string().optional(),
          country: string().optional(),
          device_type: string().optional(),
          search: string().optional(),
          sort: string().optional(),
          limit: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/assets${search(input)}`),
    ),
    listDeviceActions: query(
      {
        description: `List device actions (${actionType}) with optional filters: status (for example In Progress, Completed), action_type, serial_number (partial match), created_after/created_before (ISO 8601). include_asset embeds the holding asset. ${page}`,
        input: object({
          status: string().optional(),
          action_type: string().optional(),
          serial_number: string().optional(),
          include_asset: boolean().optional(),
          created_after: string().optional(),
          created_before: string().optional(),
          sort: string().optional(),
          limit: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/device-actions${search(input)}`),
    ),
    getDeviceAction: query(
      {
        description: "Get one device action by id; include_asset embeds the full holding asset.",
        input: object({ id: string(), include_asset: boolean().optional() }),
      },
      async ({ fetch }, { id: actionId, include_asset }) =>
        get(fetch, `/device-actions/${id(actionId)}${search({ include_asset })}`),
    ),
    createDeviceAction: mutation(
      {
        description: `Create a device action for a device in your inventory, identified by serial_number. action_type is ${actionType}. current_user is the person holding the device now; wipe requests a data wipe; notes and notification_emails are optional.`,
        input: object({
          action_type: string(),
          serial_number: string(),
          current_user: currentUser.optional(),
          wipe: boolean().optional(),
          notes: string().optional(),
          notification_emails: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/device-actions", input),
    ),
    createExternalDeviceAction: mutation(
      {
        description: `Create a device action for a device not bought through quipteams. Besides the fields of a normal device action (action_type ${actionType}), give the device model, type (Laptop, Monitor and so on) and country.`,
        input: object({
          action_type: string(),
          serial_number: string(),
          model: string(),
          type: string(),
          country: string(),
          current_user: currentUser.optional(),
          wipe: boolean().optional(),
          notes: string().optional(),
          notification_emails: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/device-actions/external", input),
    ),
    addDevice: mutation(
      {
        description:
          "Add a device to the inventory: serial_number, device_type, country, and optionally description, employee, condition and cost.",
        input: object({
          serial_number: string(),
          device_type: string(),
          country: string(),
          description: string().optional(),
          employee: string().optional(),
          condition: string().optional(),
          cost: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/devices", input),
    ),
    listProducts: query(
      {
        description:
          "List catalog products. Filter by product_type, brand, search (brand or model), and spec filters cpu, ram, storage, screen_size, resolution, connection_type (comma-separated values match any). include_inactive includes inactive products.",
        input: object({
          product_type: string().optional(),
          brand: string().optional(),
          search: string().optional(),
          cpu: string().optional(),
          ram: string().optional(),
          storage: string().optional(),
          screen_size: string().optional(),
          resolution: string().optional(),
          connection_type: string().optional(),
          include_inactive: boolean().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/products${search(input)}`),
    ),
    getProduct: query(
      { description: "Get one catalog product by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: productId }) => get(fetch, `/products/${id(productId)}`),
    ),
    listKits: query(
      {
        description: `List kits (bundles of products). Filter by search (name), tag and region; sort is created_at, updated_at or name, optionally prefixed with -. ${page}`,
        input: object({
          search: string().optional(),
          tag: string().optional(),
          region: string().optional(),
          sort: string().optional(),
          limit: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/kits${search(input)}`),
    ),
    getKit: query(
      { description: "Get one kit by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: kitId }) => get(fetch, `/kits/${id(kitId)}`),
    ),
    listSchedulingLinks: query(
      { description: "List scheduling links used to let recipients pick a delivery or pickup time.", input: object({}) },
      async ({ fetch }) => get(fetch, "/scheduling-links"),
    ),
    getSchedulingLink: query(
      { description: "Get one scheduling link by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: linkId }) => get(fetch, `/scheduling-links/${id(linkId)}`),
    ),
    listWebhooks: query(
      { description: "List webhook endpoints registered for the company.", input: object({}) },
      async ({ fetch }) => get(fetch, "/webhooks"),
    ),
    getWebhook: query(
      { description: "Get one webhook endpoint by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: webhookId }) => get(fetch, `/webhooks/${id(webhookId)}`),
    ),
    createWebhook: mutation(
      {
        description:
          "Register a webhook endpoint. events are patterns such as quote.* or logistics.tracking_added. The signing secret is shown only in the response.",
        input: object({ url: string(), events: array(string()), description: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/webhooks", input),
    ),
    updateWebhook: mutation(
      {
        description: "Change a webhook endpoint's events, url, description or is_active flag.",
        input: object({
          id: string(),
          url: string().optional(),
          events: array(string()).optional(),
          description: string().optional(),
          is_active: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id: webhookId, ...body }) => send(fetch, "PATCH", `/webhooks/${id(webhookId)}`, body),
    ),
    deleteWebhook: mutation(
      { description: "Delete a webhook endpoint by id.", input: object({ id: string() }), approval: always() },
      async ({ fetch }, { id: webhookId }) => send(fetch, "DELETE", `/webhooks/${id(webhookId)}`),
    ),
    testWebhook: mutation(
      {
        description: "Send a test event to a webhook endpoint and report the delivery result.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id: webhookId }) => send(fetch, "POST", `/webhooks/${id(webhookId)}/test`),
    ),
    listEmployees: query(
      {
        description: `List employees known to the company. Filter by status or search (name or email). ${page}`,
        input: object({
          status: string().optional(),
          search: string().optional(),
          limit: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, `/employees${search(input)}`),
    ),
    getEmployee: query(
      { description: "Get one employee by id.", input: object({ id: string() }) },
      async ({ fetch }, { id: employeeId }) => get(fetch, `/employees/${id(employeeId)}`),
    ),
    listOffices: query(
      { description: "List the company's offices.", input: object({}) },
      async ({ fetch }) => get(fetch, "/offices"),
    ),
  });
};

export default defineApp({ user: { accounts: { quipteams: quipteams.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.quipteams ?? [], (account) => quipteamsTools(account, signal), { signal }), {
    title: "quipteams",
    description:
      "IT asset management: quotes, assets, device actions, products, kits, employees, offices and webhooks.",
    icons,
  }),
}));

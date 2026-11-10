import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  router,
  secrets,
  string,
} from "apps";
import type { JsonValue } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// No read-only endpoint is documented publicly, so the provider declares no health check.
const events = "https://webhooks.remarkety.com/webhooks/store";

const remarkety = defineProvider({
  name: "Remarkety",
  hosts: ["webhooks.remarkety.com"],
  auth: {
    apiKey: secrets({
      label: "API key and store ID",
      fields: object({ token: string({ minLength: 1 }), storeId: string({ minLength: 1 }) }),
    }),
  },
});

type Account = { fields: { token: string; storeId: string } };

const enc = encodeURIComponent;

const readBody = async (response: { ok: boolean; status: number; text(): Promise<string> }) => {
  const text = await response.text();
  if (!response.ok) throw new Error(`Remarkety answered ${response.status}: ${text.slice(0, 1000)}`);
  if (text === "") return { status: response.status };
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return { status: response.status, body: text };
  }
};

const remarketyTools = (account: Account, signal: AbortSignal) => {
  const storeId = account.fields.storeId;
  const event = (type: string, description: string, payloadDoc: string) =>
    mutation(
      {
        description: `${description} ${payloadDoc}`,
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) =>
        readBody(
          await fetch(`${events}/${enc(storeId)}`, {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              "x-event-type": type,
              "x-platform": "custom",
              "x-api-key": account.fields.token,
            },
            body: JSON.stringify(body),
          }),
        ),
    );

  return router({
    sendEvent: mutation(
      {
        description:
          "Send any event to Remarkety's event endpoint. eventType is an e-commerce type (customers/create, customers/update, orders/create, orders/update, products/create, products/update, carts/create, carts/update, newsletter/subscribe, newsletter/unsubscribe) or your own custom type such as site-search. body is the event JSON. Optional eventTime is a UNIX timestamp in seconds for events that happened in the past.",
        input: object({ eventType: string({ minLength: 1 }), body: json(), eventTime: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, { eventType, body, eventTime }) =>
        readBody(
          await fetch(`${events}/${enc(storeId)}`, {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              "x-event-type": eventType,
              "x-platform": "custom",
              "x-api-key": account.fields.token,
              ...(eventTime === undefined ? {} : { "x-event-time": String(eventTime) }),
            },
            body: JSON.stringify(body),
          }),
        ),
    ),
    createCustomer: event(
      "customers/create",
      "Create a contact (customers/create event).",
      "body needs email; optional first_name, last_name, accepts_marketing (true/false, or null for unknown), accepts_sms_marketing, sms_phone_number, birthdate, gender (M/F), tags (array), id, created_at, updated_at, default_address and groups.",
    ),
    updateCustomer: event(
      "customers/update",
      "Update a contact (customers/update event); a new contact is created when the email is unknown.",
      "body has the same fields as createCustomer. Send the customer id when the email address changes, otherwise a second contact is created. Set append_tags to true to add tags instead of replacing them.",
    ),
    createOrder: event(
      "orders/create",
      "Tell Remarkety about a new order (orders/create event).",
      "body needs id, created_at, customer (email, accepts_marketing, created_at, updated_at), line_items (product_id, quantity, sku, name, url, image, price), status.name, subtotal_price, total_discounts, total_shipping, total_tax and total_price.",
    ),
    updateOrder: event(
      "orders/update",
      "Tell Remarkety an order changed, for example its status (orders/update event).",
      "body has the same format as createOrder.",
    ),
    createProduct: event(
      "products/create",
      "Add a product to Remarkety's catalog (products/create event).",
      "body needs id, sku, created_at, image.src, product_exists, title, url, vendor and variants (id, image, inventory_quantity, product_id, sku, title).",
    ),
    updateProduct: event(
      "products/update",
      "Update a product (products/update event). Products cannot be deleted: set product_exists to false to stop recommending one.",
      "body has the same format as createProduct.",
    ),
    createCart: event(
      "carts/create",
      "Tell Remarkety about a cart that has not become an order, for abandoned-cart automations (carts/create event).",
      "body needs abandoned_checkout_url, cart_token, created_at, line_items and totals; customer and email may be null for anonymous carts.",
    ),
    updateCart: event(
      "carts/update",
      "Update an existing cart (carts/update event).",
      "body has the same format as createCart.",
    ),
    subscribeNewsletter: event(
      "newsletter/subscribe",
      "Record a newsletter opt-in (newsletter/subscribe event).",
      "body needs the subscriber email.",
    ),
    unsubscribeNewsletter: event(
      "newsletter/unsubscribe",
      "Record a newsletter opt-out (newsletter/unsubscribe event).",
      "body needs the subscriber email.",
    ),
  });
};

export default defineApp({ user: { accounts: { remarkety: remarkety.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.remarkety ?? [], (account) => remarketyTools(account, signal), { signal }), {
    title: "Remarkety",
    description:
      "Remarkety e-commerce email and SMS marketing: list contacts and send customer, order, product, cart and newsletter events.",
    icons,
  }),
}));

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

const base = "https://api.postscript.io/api/v2";

const postscript = defineProvider({
  name: "Postscript",
  hosts: ["api.postscript.io"],
  auth: {
    apiKey: secrets({
      label: "Private API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /me is the endpoint Postscript recommends for verifying a private key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account, body = false) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  ...(body ? { "content-type": "application/json" } : {}),
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const postscriptTools = (account: Account, signal: AbortSignal) =>
  router({
    me: query(
      {
        description: "Get the shop or partner the private API key belongs to.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/me`, { signal, headers: headers(account) }), json()),
    ),
    listSubscribers: query(
      {
        description:
          "List subscribers of the shop. Filters are exact or suffixed comparisons: email__eq, email__contains, phone_number__eq, phone_number__contains, shopify_customer_id__eq, shopify_customer_id__contains, ps_id__eq, created_at__gte, created_at__lte, updated_at__gte, updated_at__lte (ISO 8601 times). Use subscription_type to filter by channel, sort to order results (prefix with - for descending) and page for pagination.",
        input: object({
          email__eq: string().optional(),
          email__contains: string().optional(),
          phone_number__eq: string().optional(),
          phone_number__contains: string().optional(),
          shopify_customer_id__eq: string().optional(),
          shopify_customer_id__contains: string().optional(),
          ps_id__eq: string().optional(),
          created_at__gte: string().optional(),
          created_at__lte: string().optional(),
          updated_at__gte: string().optional(),
          updated_at__lte: string().optional(),
          subscription_type: string().optional(),
          sort: string().optional(),
          page: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/subscribers?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getSubscriber: query(
      {
        description: "Get one subscriber by Postscript subscriber id.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/subscribers/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    updateSubscriber: mutation(
      {
        description:
          "Update a subscriber. tags are additive (added to existing tags). email is only set when the subscriber has none and no Shopify customer is linked. properties is a JSON object string of custom key/value pairs (strings, integers, string arrays or ISO 8601 dates; up to 50 per subscriber).",
        input: object({
          id: string(),
          email: string().optional(),
          tags: array(string()).optional(),
          properties: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) =>
        decodeJson(
          await fetch(`${base}/subscribers/${encodeURIComponent(id)}`, {
            method: "PATCH",
            signal,
            headers: headers(account, true),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    unsubscribe: mutation(
      {
        description:
          "Opt a subscriber out of Postscript messaging, identified by postscript_subscriber_id or phone_number.",
        input: object({
          postscript_subscriber_id: string().optional(),
          phone_number: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, body) =>
        decodeJson(
          await fetch(`${base}/compliance/unsubscribe`, {
            method: "PATCH",
            signal,
            headers: headers(account, true),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    redact: mutation(
      {
        description:
          "Redact (erase personal data of) a subscriber for privacy requests, identified by postscript_subscriber_id, shopify_customer_id, email or phone_number. An active subscriber is also unsubscribed.",
        input: object({
          postscript_subscriber_id: string().optional(),
          shopify_customer_id: string().optional(),
          email: string().optional(),
          phone_number: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, body) =>
        decodeJson(
          await fetch(`${base}/compliance/redact`, {
            method: "PATCH",
            signal,
            headers: headers(account, true),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    createCustomEvent: mutation(
      {
        description:
          "Send a custom event that can trigger Postscript flows. type uses letters, digits and underscores only (Postscript prefixes it with your shop or partner name). Identify the subscriber with subscriber_id, phone (E.164 recommended) or email. occurred_at is UTC formatted %Y-%m-%d %H:%M:%S.%f. properties is a flat JSON object exposed for filtering and merge tags.",
        input: object({
          type: string(),
          subscriber_id: string().optional(),
          phone: string().optional(),
          email: string().optional(),
          occurred_at: string().optional(),
          external_id: string().optional(),
          properties: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, body) =>
        decodeJson(
          await fetch(`${base}/events`, {
            method: "POST",
            signal,
            headers: headers(account, true),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { postscript: postscript.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.postscript ?? [], (account) => postscriptTools(account, signal), { signal }), {
    title: "Postscript",
    description: "Look up and update Postscript SMS marketing subscribers, opt subscribers out or redact them, and send custom events to trigger flows.",
    icons,
  }),
}));

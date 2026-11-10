import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pushinator.com/api/v2";

const pushinator = defineProvider({
  name: "Pushinator",
  hosts: ["api.pushinator.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing channels is read-only and sends nothing; a bad token answers 401. The
  // success body shape is undocumented, so any 2xx counts as healthy and the body is not decoded.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/channels`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Pushinator health check failed with status ${response.status}`);
  },
});

type Account = { fields: { token: string } };

const call = async (
  account: Account,
  signal: AbortSignal,
  fetch: typeof globalThis.fetch,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: Record<string, string | boolean | undefined>,
) =>
  decodeJson(
    await fetch(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    json(),
  );

const channelPath = (id: string) => `/channels/${encodeURIComponent(id)}`;

const pushinatorTools = (account: Account, signal: AbortSignal) =>
  router({
    notifications: router(
      {
        send: mutation(
          {
            description:
              "Send a push notification to every subscriber of a channel. channelId is the channel's UUID and content the message text. acknowledgmentRequired (paid plans only; ignored on Free) makes the notification retry up to 5 times with exponential backoff (1, 2, 4, 8, 16 minutes) until a subscriber acknowledges it. Returns success and a message.",
            input: object({
              channelId: string(),
              content: string(),
              acknowledgmentRequired: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            call(account, signal, fetch, "POST", "/notifications/send", {
              channel_id: input.channelId,
              content: input.content,
              acknowledgment_required: input.acknowledgmentRequired,
            }),
        ),
      },
      { title: "Notifications", description: "Send push notifications to channel subscribers." },
    ),
    channels: router(
      {
        create: mutation(
          {
            description: "Create a notification channel with a name and an optional description. Returns the created channel, including its UUID for notifications.send.",
            input: object({ name: string(), description: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(account, signal, fetch, "POST", "/channels", input),
        ),
        list: query(
          { description: "List all channels on the account. The returned IDs work with the other channel tools.", input: object({}) },
          async ({ fetch }) => call(account, signal, fetch, "GET", "/channels"),
        ),
        get: query(
          { description: "Get a single channel by its UUID.", input: object({ channelId: string() }) },
          async ({ fetch }, input) => call(account, signal, fetch, "GET", channelPath(input.channelId)),
        ),
        update: mutation(
          {
            description: "Replace a channel's name and, optionally, its description.",
            input: object({ channelId: string(), name: string(), description: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            call(account, signal, fetch, "PUT", channelPath(input.channelId), { name: input.name, description: input.description }),
        ),
        delete: mutation(
          {
            description: "Permanently delete a channel by its UUID. This cannot be undone.",
            input: object({ channelId: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(account, signal, fetch, "DELETE", channelPath(input.channelId)),
        ),
      },
      { title: "Channels", description: "Create, list, read, update and delete notification channels." },
    ),
    user: router(
      {
        current: query(
          { description: "Get the user that owns the connected API token.", input: object({}) },
          async ({ fetch }) => call(account, signal, fetch, "GET", "/user"),
        ),
      },
      { title: "User", description: "The account behind the API token." },
    ),
  });

export default defineApp({ user: { accounts: { pushinator: pushinator.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pushinator ?? [], (account) => pushinatorTools(account, signal), { signal }), {
    title: "Pushinator",
    description: "Send push notifications to iPhone, iPad and Android with Pushinator and create notification channels.",
    icons,
  }),
}));

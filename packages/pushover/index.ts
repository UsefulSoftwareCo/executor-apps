import {
  accountRouter,
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

const base = "https://api.pushover.net/1";

const pushover = defineProvider({
  name: "Pushover",
  hosts: ["api.pushover.net"],
  auth: {
    apiKey: secrets({
      label: "Application token and user key",
      fields: object({ token: string({ minLength: 1 }), user: string({ minLength: 1 }) }),
    }),
  },
  // Validating the user key is read-only and sends no notification.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/validate.json`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: account.fields.token, user: account.fields.user }),
    });
    await decodeJson(response, object({ status: number() }));
  },
});

type Account = { fields: { token: string; user: string } };

// Pushover takes credentials as request parameters, never as headers.
const send = (account: Account, signal: AbortSignal, fetch: typeof globalThis.fetch) => ({
  get: async (path: string, params: Record<string, string | number | undefined> = {}) => {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("token", account.fields.token);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    return decodeJson(await fetch(url, { signal }), json());
  },
  post: async (path: string, body: Record<string, string | number | boolean | undefined>) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: account.fields.token, ...body }),
      }),
      json(),
    ),
});

const pushoverTools = (account: Account, signal: AbortSignal) =>
  router({
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send a push notification. message is required (max 1024 chars); title max 250; url max 512 and url_title max 100. user defaults to the account's user key and may be a user or group key; device limits delivery to named devices (comma-separated, max 25). priority: -2 no notification, -1 quiet, 0 normal, 1 bypass quiet hours, 2 emergency (requires retry in seconds, min 30, and expire in seconds, max 10800; the response carries a receipt). sound is a name from sounds.list. html=1 enables HTML formatting, monospace=1 a monospace font (mutually exclusive). timestamp is a Unix time; ttl deletes the message from devices after that many seconds. callback is a URL called when an emergency message is acknowledged; tags (emergency only) labels it for messages.cancelByTag. attachmentBase64 and attachmentType (a MIME type such as image/png) attach an image up to 5 MB.",
            input: object({
              message: string(),
              user: string().optional(),
              title: string().optional(),
              device: string().optional(),
              url: string().optional(),
              urlTitle: string().optional(),
              priority: number().optional(),
              sound: string().optional(),
              html: number().optional(),
              monospace: number().optional(),
              timestamp: number().optional(),
              ttl: number().optional(),
              retry: number().optional(),
              expire: number().optional(),
              callback: string().optional(),
              tags: string().optional(),
              attachmentBase64: string().optional(),
              attachmentType: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(account, signal, fetch).post("/messages.json", {
              user: input.user ?? account.fields.user,
              message: input.message,
              title: input.title,
              device: input.device,
              url: input.url,
              url_title: input.urlTitle,
              priority: input.priority,
              sound: input.sound,
              html: input.html,
              monospace: input.monospace,
              timestamp: input.timestamp,
              ttl: input.ttl,
              retry: input.retry,
              expire: input.expire,
              callback: input.callback,
              tags: input.tags,
              attachment_base64: input.attachmentBase64,
              attachment_type: input.attachmentType,
            }),
        ),
        validateUser: mutation(
          {
            description:
              "Check that a user or group key (default: the account's) is valid and has an active device, optionally for one device name. Sends no notification. Returns status, the devices list and licenses.",
            input: object({ user: string().optional(), device: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(account, signal, fetch).post("/users/validate.json", {
              user: input.user ?? account.fields.user,
              device: input.device,
            }),
        ),
      },
      { title: "Messages", description: "Send notifications and validate recipients." },
    ),
    receipts: router(
      {
        get: query(
          {
            description:
              "Get the status of an emergency (priority 2) message by its receipt: acknowledged, acknowledged_at, acknowledged_by, acknowledged_by_device, last_delivered_at, expired, expires_at, called_back and called_back_at.",
            input: object({ receipt: string() }),
          },
          async ({ fetch }, { receipt }) =>
            send(account, signal, fetch).get(`/receipts/${encodeURIComponent(receipt)}.json`),
        ),
        cancel: mutation(
          {
            description: "Stop an emergency message from retrying, by its receipt. Does not recall delivered notifications.",
            input: object({ receipt: string() }),
            approval: always(),
          },
          async ({ fetch }, { receipt }) =>
            send(account, signal, fetch).post(`/receipts/${encodeURIComponent(receipt)}/cancel.json`, {}),
        ),
        cancelByTag: mutation(
          {
            description: "Stop every emergency message that was sent with the given tag.",
            input: object({ tag: string() }),
            approval: always(),
          },
          async ({ fetch }, { tag }) =>
            send(account, signal, fetch).post(`/receipts/cancel_by_tag/${encodeURIComponent(tag)}.json`, {}),
        ),
      },
      { title: "Receipts", description: "Track and cancel emergency-priority messages." },
    ),
    sounds: router(
      {
        list: query(
          {
            description: "List the notification sound names that can be passed as sound when sending a message.",
            input: object({}),
          },
          async ({ fetch }) => send(account, signal, fetch).get("/sounds.json"),
        ),
      },
      { title: "Sounds", description: "Available notification sounds." },
    ),
    groups: router(
      {
        list: query(
          { description: "List the delivery groups owned by this account.", input: object({}) },
          async ({ fetch }) => send(account, signal, fetch).get("/groups.json"),
        ),
        get: query(
          {
            description: "Get a delivery group by its group key: its name and its users (user key, device, memo, disabled).",
            input: object({ group: string() }),
          },
          async ({ fetch }, { group }) => send(account, signal, fetch).get(`/groups/${encodeURIComponent(group)}.json`),
        ),
        create: mutation(
          {
            description: "Create a delivery group. Returns the new group key, which can be used as user when sending messages.",
            input: object({ name: string() }),
            approval: always(),
          },
          async ({ fetch }, { name }) => send(account, signal, fetch).post("/groups.json", { name }),
        ),
        rename: mutation(
          {
            description: "Rename a delivery group.",
            input: object({ group: string(), name: string() }),
            approval: always(),
          },
          async ({ fetch }, { group, name }) =>
            send(account, signal, fetch).post(`/groups/${encodeURIComponent(group)}/rename.json`, { name }),
        ),
        addUser: mutation(
          {
            description:
              "Add a user to a delivery group by user key, optionally restricted to one device name, with a memo (max 200 chars).",
            input: object({
              group: string(),
              user: string(),
              device: string().optional(),
              memo: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { group, ...body }) =>
            send(account, signal, fetch).post(`/groups/${encodeURIComponent(group)}/add_user.json`, body),
        ),
        removeUser: mutation(
          {
            description: "Remove a user from a delivery group by user key (and device name, when they were added with one).",
            input: object({ group: string(), user: string(), device: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { group, ...body }) =>
            send(account, signal, fetch).post(`/groups/${encodeURIComponent(group)}/remove_user.json`, body),
        ),
        disableUser: mutation(
          {
            description: "Temporarily stop a group user from receiving the group's messages without removing them.",
            input: object({ group: string(), user: string(), device: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { group, ...body }) =>
            send(account, signal, fetch).post(`/groups/${encodeURIComponent(group)}/disable_user.json`, body),
        ),
        enableUser: mutation(
          {
            description: "Resume delivery of the group's messages to a previously disabled group user.",
            input: object({ group: string(), user: string(), device: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { group, ...body }) =>
            send(account, signal, fetch).post(`/groups/${encodeURIComponent(group)}/enable_user.json`, body),
        ),
      },
      { title: "Groups", description: "Delivery groups that fan one message out to many users." },
    ),
    glances: router(
      {
        update: mutation(
          {
            description:
              "Update a Glances widget (smartwatch face or lock-screen widget) with data instead of a notification. Provide any of title (max 100), text (max 100), subtext (max 100), count (integer, may be negative) and percent (0-100). user defaults to the account's user key; device limits it to one device.",
            input: object({
              user: string().optional(),
              device: string().optional(),
              title: string().optional(),
              text: string().optional(),
              subtext: string().optional(),
              count: number().optional(),
              percent: number().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(account, signal, fetch).post("/glances.json", { ...input, user: input.user ?? account.fields.user }),
        ),
      },
      { title: "Glances", description: "Push widget data to Glances-enabled devices." },
    ),
    app: router(
      {
        limits: query(
          {
            description:
              "Get this application's monthly message limit, the messages remaining and the Unix time the count resets.",
            input: object({}),
          },
          async ({ fetch }) => send(account, signal, fetch).get("/apps/limits.json"),
        ),
      },
      { title: "Application", description: "Usage limits for the application token." },
    ),
  });

export default defineApp({ user: { accounts: { pushover: pushover.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pushover ?? [], (account) => pushoverTools(account, signal), { signal }), {
    title: "Pushover",
    description:
      "Send push notifications with Pushover: messages, emergency receipts, delivery groups, Glances widgets, sounds and app limits.",
    icons,
  }),
}));

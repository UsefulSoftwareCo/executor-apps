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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pushbullet.com/v2";

const pushbullet = defineProvider({
  name: "Pushbullet",
  hosts: ["api.pushbullet.com"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The user registers an OAuth client at https://www.pushbullet.com/create-client and pastes its id and secret on the connect page.
    oauth: oauth2({
      authorizationUrl: "https://www.pushbullet.com/authorize",
      tokenUrl: "https://api.pushbullet.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/me`, { signal, headers: headers(account) });
    const me = await decodeJson(response, object({ iden: string(), name: string(), email: string() }));
    return { accountInfo: { externalId: me.iden, displayName: me.name, email: me.email } };
  },
});

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Personal access tokens and OAuth tokens both go in the Access-Token header.
const headers = (account: Account, extra: Record<string, string> = {}) => ({
  "Access-Token": account.method === "oauth" ? account.fields.access_token : account.fields.token,
  Accept: "application/json",
  ...extra,
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const idenInput = object({ iden: string() });

const tools = (account: Account, signal: AbortSignal) => {
  const get = (path: string) => async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = (
    method: "POST" | "DELETE",
    path: string,
    body?: unknown,
  ) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
      const response = await fetch(`${base}${path}`, {
        method,
        signal,
        headers: headers(account, body === undefined ? {} : { "content-type": "application/json" }),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (method === "DELETE" && response.ok) return { deleted: true };
      return decodeJson(response, json());
    };
  return router({
    user: router(
      {
        get: query(
          { description: "Get the authenticated user: iden, email, name, image and limits.", input: object({}) },
          async (ctx) => get("/users/me")(ctx),
        ),
        update: mutation(
          {
            description: "Update the authenticated user's preferences (the preferences object is merged by Pushbullet).",
            input: object({ preferences: json() }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/users/me", input)(ctx),
        ),
      },
      { title: "User", description: "The authenticated Pushbullet account." },
    ),
    pushes: router(
      {
        list: query(
          {
            description:
              "List pushes, newest first. Use modifiedAfter (unix timestamp) for incremental sync and cursor from the previous response for pagination. active=true hides deleted pushes.",
            input: object({
              modifiedAfter: number().optional(),
              active: boolean().optional(),
              cursor: string().optional(),
              limit: number().optional(),
            }),
          },
          async (ctx, { modifiedAfter, ...rest }) =>
            get(`/pushes${search({ modified_after: modifiedAfter, ...rest })}`)(ctx),
        ),
        create: mutation(
          {
            description:
              "Send a push. type is note (title, body), link (title, body, url) or file (file_name, file_type, file_url from upload). Target one device with device_iden, a person with email, a channel with channel_tag, or omit all to send to every device.",
            input: object({
              type: string(),
              title: string().optional(),
              body: string().optional(),
              url: string().optional(),
              file_name: string().optional(),
              file_type: string().optional(),
              file_url: string().optional(),
              device_iden: string().optional(),
              email: string().optional(),
              channel_tag: string().optional(),
              client_iden: string().optional(),
              source_device_iden: string().optional(),
              guid: string().optional(),
            }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/pushes", input)(ctx),
        ),
        dismiss: mutation(
          {
            description: "Mark a push as dismissed (or not) by its iden.",
            input: object({ iden: string(), dismissed: boolean().default(true) }),
            approval: always(),
          },
          async (ctx, { iden, dismissed }) => send("POST", `/pushes/${encodeURIComponent(iden)}`, { dismissed })(ctx),
        ),
        delete: mutation(
          { description: "Delete one push by iden.", input: idenInput, approval: always() },
          async (ctx, { iden }) => send("DELETE", `/pushes/${encodeURIComponent(iden)}`)(ctx),
        ),
        deleteAll: mutation(
          { description: "Delete every push on the account. Irreversible.", input: object({}), approval: always() },
          async (ctx) => send("DELETE", "/pushes")(ctx),
        ),
      },
      { title: "Pushes", description: "Notes, links and files sent between devices, people and channels." },
    ),
    devices: router(
      {
        list: query(
          {
            description: "List devices. Pagination via cursor and limit; active=true hides deleted devices.",
            input: object({ active: boolean().optional(), cursor: string().optional(), limit: number().optional() }),
          },
          async (ctx, input) => get(`/devices${search(input)}`)(ctx),
        ),
        create: mutation(
          {
            description:
              "Register a device. nickname is required; model, manufacturer, push_token, app_version, icon, has_sms are optional.",
            input: object({
              nickname: string(),
              model: string().optional(),
              manufacturer: string().optional(),
              push_token: string().optional(),
              app_version: number().optional(),
              icon: string().optional(),
              has_sms: boolean().optional(),
            }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/devices", input)(ctx),
        ),
        update: mutation(
          {
            description: "Update a device's nickname, model, manufacturer, push_token, app_version, icon or has_sms.",
            input: object({
              iden: string(),
              nickname: string().optional(),
              model: string().optional(),
              manufacturer: string().optional(),
              push_token: string().optional(),
              app_version: number().optional(),
              icon: string().optional(),
              has_sms: boolean().optional(),
            }),
            approval: always(),
          },
          async (ctx, { iden, ...body }) => send("POST", `/devices/${encodeURIComponent(iden)}`, body)(ctx),
        ),
        delete: mutation(
          { description: "Delete a device by iden.", input: idenInput, approval: always() },
          async (ctx, { iden }) => send("DELETE", `/devices/${encodeURIComponent(iden)}`)(ctx),
        ),
      },
      { title: "Devices", description: "Devices registered to the account." },
    ),
    chats: router(
      {
        list: query(
          {
            description: "List chats with other Pushbullet users.",
            input: object({ active: boolean().optional(), cursor: string().optional(), limit: number().optional() }),
          },
          async (ctx, input) => get(`/chats${search(input)}`)(ctx),
        ),
        create: mutation(
          {
            description: "Start a chat with a person by email address.",
            input: object({ email: string() }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/chats", input)(ctx),
        ),
        update: mutation(
          {
            description: "Mute or unmute a chat by iden.",
            input: object({ iden: string(), muted: boolean() }),
            approval: always(),
          },
          async (ctx, { iden, muted }) => send("POST", `/chats/${encodeURIComponent(iden)}`, { muted })(ctx),
        ),
        delete: mutation(
          { description: "Delete a chat by iden.", input: idenInput, approval: always() },
          async (ctx, { iden }) => send("DELETE", `/chats/${encodeURIComponent(iden)}`)(ctx),
        ),
      },
      { title: "Chats", description: "Conversations with other Pushbullet users." },
    ),
    subscriptions: router(
      {
        list: query(
          {
            description: "List the channels the user is subscribed to.",
            input: object({ active: boolean().optional(), cursor: string().optional(), limit: number().optional() }),
          },
          async (ctx, input) => get(`/subscriptions${search(input)}`)(ctx),
        ),
        subscribe: mutation(
          {
            description: "Subscribe to a channel by its tag.",
            input: object({ channel_tag: string() }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/subscriptions", input)(ctx),
        ),
        update: mutation(
          {
            description: "Mute or unmute a channel subscription by iden.",
            input: object({ iden: string(), muted: boolean() }),
            approval: always(),
          },
          async (ctx, { iden, muted }) => send("POST", `/subscriptions/${encodeURIComponent(iden)}`, { muted })(ctx),
        ),
        unsubscribe: mutation(
          { description: "Unsubscribe from a channel by subscription iden.", input: idenInput, approval: always() },
          async (ctx, { iden }) => send("DELETE", `/subscriptions/${encodeURIComponent(iden)}`)(ctx),
        ),
        channelInfo: query(
          {
            description: "Get public information about a channel by tag, optionally with its recent pushes.",
            input: object({ tag: string(), no_recent_pushes: boolean().optional() }),
          },
          async (ctx, input) => get(`/channel-info${search(input)}`)(ctx),
        ),
      },
      { title: "Subscriptions", description: "Channel subscriptions." },
    ),
    files: router(
      {
        uploadRequest: mutation(
          {
            description:
              "Request an upload slot for a file. Returns file_url (use in a file push) and upload_url plus data fields to POST the bytes to as multipart form data.",
            input: object({ file_name: string(), file_type: string() }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/upload-request", input)(ctx),
        ),
      },
      { title: "Files", description: "File upload slots for file pushes." },
    ),
    texts: router(
      {
        threads: query(
          {
            description: "List SMS conversation threads synced from an Android device (device_iden required).",
            input: object({ deviceIden: string() }),
          },
          async (ctx, { deviceIden }) =>
            get(`/permanents/${encodeURIComponent(deviceIden)}_threads`)(ctx),
        ),
        messages: query(
          {
            description: "List the messages in one SMS thread of an Android device.",
            input: object({ deviceIden: string(), threadId: string() }),
          },
          async (ctx, { deviceIden, threadId }) =>
            get(`/permanents/${encodeURIComponent(deviceIden)}_thread_${encodeURIComponent(threadId)}`)(ctx),
        ),
        send: mutation(
          {
            description:
              "Send an SMS from an Android device. Provide target_device_iden, either addresses (phone numbers) or conversation_iden, and message.",
            input: object({
              target_device_iden: string(),
              addresses: array(string()).optional(),
              conversation_iden: string().optional(),
              message: string(),
              guid: string().optional(),
            }),
            approval: always(),
          },
          async (ctx, input) =>
            send("POST", "/texts", { data: input })(ctx),
        ),
      },
      { title: "Texts", description: "SMS synced from and sent through an Android device." },
    ),
    ephemerals: router(
      {
        send: mutation(
          {
            description:
              "Send an ephemeral message (not stored) such as a dismissal or clipboard sync. push is the ephemeral payload object.",
            input: object({ type: string(), push: json() }),
            approval: always(),
          },
          async (ctx, input) => send("POST", "/ephemerals", input)(ctx),
        ),
      },
      { title: "Ephemerals", description: "Short-lived messages delivered to devices." },
    ),
  });
};

export default defineApp({ user: { accounts: { pushbullet: pushbullet.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pushbullet ?? [], (account) => tools(account, signal), { signal }), {
    title: "Pushbullet",
    description: "Send pushes, SMS and files between devices; manage devices, chats, channel subscriptions and Android text threads.",
    icons,
  }),
}));

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
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Credentials may only go to hosted ntfy.sh: `hosts` is a static list, so self-hosted servers
// (arbitrary domains) cannot be declared and are unsupported. With hosts declared, app code only ever
// sees opaque handles for the token and password.
const BASE = "https://ntfy.sh";

const ntfy = defineProvider({
  name: "ntfy",
  hosts: ["ntfy.sh"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    password: secrets({
      label: "Username and password",
      fields: object({
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  // /v1/account answers for any valid credentials and reports the signed-in user.
  async health({ account, fetch, signal }) {
    const base = BASE;
    const response = await fetch(`${base}/v1/account`, {
      signal,
      headers: { ...authorization(account), Accept: "application/json" },
    });
    const user = await decodeJson(response, object({ username: string() }));
    return { accountInfo: { externalId: `${base}:${user.username}`, displayName: `${user.username} @ ntfy.sh`, username: user.username } };
  },
});

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "password"; fields: { username: string; password: string } };

// btoa only accepts Latin-1; encode the UTF-8 bytes instead (ntfy decodes Basic credentials as UTF-8).
const base64Utf8 = (text: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const authorization = (account: Account) => ({
  Authorization:
    account.method === "token"
      ? `Bearer ${account.fields.token}`
      : `Basic ${base64Utf8(`${account.fields.username}:${account.fields.password}`)}`,
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const ntfyTools = (account: Account, signal: AbortSignal) => {
  const base = BASE;
  const headers = { ...authorization(account), Accept: "application/json" };
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };
  const topicPath = (topic: string) => `${base}/${encodeURIComponent(topic)}`;
  // Some endpoints (e.g. subscription delete when none exist) reply 200 with an empty body.
  const call = async (
    fetch: typeof globalThis.fetch,
    method: string,
    url: string,
    body?: unknown,
    extra: Record<string, string> = {},
  ): Promise<unknown> => {
    const response = await fetch(url, {
      method,
      signal,
      headers: { ...(body === undefined ? headers : jsonHeaders), ...extra },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`ntfy ${method} failed with HTTP ${response.status}: ${text.slice(0, 500)}`);
    return text.trim() === "" ? { success: true } : JSON.parse(text);
  };
  const message = (value: object) => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

  return router({
    messages: router(
      {
        publish: mutation(
          {
            description:
              "Publish a notification to a topic (POST to the server root as JSON). Only topic is required; message defaults to 'triggered'. priority is 1 (min) to 5 (max), default 3. tags are short names, and ones matching emoji short codes (warning, tada) render as emojis. actions is up to three buttons: {action: 'view', label, url}, {action: 'http', label, url, method?, headers?, body?}, {action: 'broadcast', label, intent?, extras?} or {action: 'copy', label, value}. delay schedules delivery (30min, 9am, a unix timestamp). email and call forward to an address or phone number, or 'yes' for the account's verified one, and need server support. sequenceId lets a later publish, clear or delete address this notification. Returns the published message including its id.",
            input: object({
              topic: string(),
              message: string().optional(),
              title: string().optional(),
              priority: number().optional(),
              tags: array(string()).optional(),
              click: string().optional(),
              attach: string().optional(),
              filename: string().optional(),
              icon: string().optional(),
              markdown: boolean().optional(),
              delay: string().optional(),
              timezone: string().optional(),
              email: string().optional(),
              call: string().optional(),
              actions: array(json()).optional(),
              sequenceId: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { sequenceId, ...input }) =>
            call(fetch, "POST", `${base}/`, message({ ...input, sequence_id: sequenceId })),
        ),
        poll: query(
          {
            description:
              "Read cached messages of one or more topics (comma-separated) without subscribing. since is a duration (10m), a unix timestamp, a message id, 'all' (default) or 'latest'; use the last seen message id to get only new ones. scheduled includes delayed messages. Optional filters: id, message and title match exactly; priority is comma-separated and matches any; tags is comma-separated and matches all. Returns an array of events (event is message, message_delete or message_clear), at most 10 MB.",
            input: object({
              topic: string(),
              since: string().optional(),
              scheduled: boolean().optional(),
              id: string().optional(),
              message: string().optional(),
              title: string().optional(),
              priority: string().optional(),
              tags: string().optional(),
            }),
          },
          async ({ fetch }, { topic, ...filters }) => {
            const path = topic.split(",").map((t) => encodeURIComponent(t.trim())).join(",");
            const response = await fetch(
              `${base}/${path}/json${search({ poll: 1, ...filters, scheduled: filters.scheduled === true ? 1 : undefined })}`,
              { signal, headers: { ...authorization(account) } },
            );
            if (!response.ok) throw new Error(`ntfy poll failed with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
            return (await response.text())
              .split("\n")
              .filter((line) => line.trim() !== "")
              .map((line) => JSON.parse(line) as Record<string, unknown>);
          },
        ),
        clear: mutation(
          {
            description:
              "Mark a notification as read/cleared by its sequence id (PUT /topic/sequence_id/clear). Subscribers receive a message_clear event and dismiss it. The sequence id is the id or sequence_id of a published message.",
            input: object({ topic: string(), sequenceId: string() }),
            approval: always(),
          },
          async ({ fetch }, { topic, sequenceId }) =>
            call(fetch, "PUT", `${topicPath(topic)}/${encodeURIComponent(sequenceId)}/clear`),
        ),
        delete: mutation(
          {
            description:
              "Delete a notification, or cancel a scheduled one, by its sequence id (DELETE /topic/sequence_id). Subscribers receive a message_delete event.",
            input: object({ topic: string(), sequenceId: string() }),
            approval: always(),
          },
          async ({ fetch }, { topic, sequenceId }) =>
            call(fetch, "DELETE", `${topicPath(topic)}/${encodeURIComponent(sequenceId)}`),
        ),
      },
      { title: "Messages", description: "Publish, read, clear and delete notifications on topics." },
    ),
    server: router(
      {
        health: query(
          { description: "Check whether the server is healthy (GET /v1/health). Returns {healthy: boolean}.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", `${base}/v1/health`),
        ),
        config: query(
          {
            description:
              "Get the server's public configuration (GET /v1/config): base_url, whether login, signup, payments, calls and reservations are enabled, and the disallowed topics.",
            input: object({}),
          },
          async ({ fetch }) => call(fetch, "GET", `${base}/v1/config`),
        ),
      },
      { title: "Server", description: "Server health and configuration." },
    ),
    account: router(
      {
        get: query(
          {
            description:
              "Get the signed-in account (GET /v1/account): username, role, tier, usage limits and remaining quota, access tokens, topic reservations, subscriptions and settings. Anonymous access returns the anonymous role and its limits.",
            input: object({}),
          },
          async ({ fetch }) => call(fetch, "GET", `${base}/v1/account`),
        ),
        createToken: mutation(
          {
            description:
              "Create an access token for the signed-in user (POST /v1/account/token). label names it; expires is a unix timestamp (seconds) and defaults to the server's setting. The token string (tk_...) is in the response and is only shown by the account listing afterwards. Requires user auth on a server with login enabled.",
            input: object({ label: string().optional(), expires: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${base}/v1/account/token`, message(input)),
        ),
        updateToken: mutation(
          {
            description: "Change the label or expiry (unix timestamp in seconds) of an access token (PATCH /v1/account/token).",
            input: object({ token: string(), label: string().optional(), expires: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "PATCH", `${base}/v1/account/token`, message(input)),
        ),
        deleteToken: mutation(
          {
            description: "Delete an access token (DELETE /v1/account/token with the X-Token header). Applications using it lose access.",
            input: object({ token: string() }),
            approval: always(),
          },
          async ({ fetch }, { token }) => call(fetch, "DELETE", `${base}/v1/account/token`, undefined, { "X-Token": token }),
        ),
        reserveTopic: mutation(
          {
            description:
              "Reserve a topic for the signed-in user (POST /v1/account/reservation) and set what everyone else may do: read-write, read-only, write-only or deny-all. Needs a tier that includes reservations.",
            input: object({ topic: string(), everyone: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => call(fetch, "POST", `${base}/v1/account/reservation`, input),
        ),
        releaseTopic: mutation(
          {
            description: "Delete a topic reservation owned by the signed-in user (DELETE /v1/account/reservation/<topic>).",
            input: object({ topic: string() }),
            approval: always(),
          },
          async ({ fetch }, { topic }) =>
            call(fetch, "DELETE", `${base}/v1/account/reservation/${encodeURIComponent(topic)}`),
        ),
        addSubscription: mutation(
          {
            description:
              "Add a topic subscription to the signed-in user's account (POST /v1/account/subscription), synced to their clients. baseUrl is the server the topic lives on.",
            input: object({ baseUrl: string(), topic: string() }),
            approval: always(),
          },
          async ({ fetch }, { baseUrl, topic }) =>
            call(fetch, "POST", `${base}/v1/account/subscription`, { base_url: baseUrl, topic }),
        ),
        removeSubscription: mutation(
          {
            description:
              "Remove a topic subscription from the signed-in user's account (DELETE /v1/account/subscription, identified by the X-BaseURL and X-Topic headers).",
            input: object({ baseUrl: string(), topic: string() }),
            approval: always(),
          },
          async ({ fetch }, { baseUrl, topic }) =>
            call(fetch, "DELETE", `${base}/v1/account/subscription`, undefined, { "X-BaseURL": baseUrl, "X-Topic": topic }),
        ),
      },
      { title: "Account", description: "The signed-in user: quota, access tokens, topic reservations and subscriptions." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { ntfy: ntfy.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.ntfy ?? [], (account) => ntfyTools(account, signal), { signal }),
      {
        title: "ntfy",
        description:
          "Send push notifications to phones and desktops through ntfy.sh: publish, poll, clear and delete messages, and manage access tokens, topic reservations and subscriptions.",
        icons,
      },
    ),
  }),
);

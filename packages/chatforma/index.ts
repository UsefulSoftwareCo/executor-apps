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

const base = "https://api.pro.chatforma.com/public/v1";

const chatforma = defineProvider({
  name: "Chatforma",
  hosts: ["api.pro.chatforma.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/auth-test`, { signal, headers: { api_key: account.fields.token } });
    await decodeJson(response, object({ mail: string() }));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const page = { page: number().optional(), per_page: number().optional() };

const chatformaTools = (account: Account, signal: AbortSignal) => {
  const headers = { api_key: account.fields.token, Accept: "application/json" };
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | undefined> = {}) =>
    decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );

  return router({
    bots: router(
      {
        list: query(
          { description: "List the bots in the account with their ids, titles and messenger types.", input: object({}) },
          async ({ fetch }) => get(fetch, "/bots"),
        ),
        messages: query(
          {
            description: "List a bot's predefined messages, whose ids can be sent with sendPredefinedMessage.",
            input: object({ botId: number() }),
          },
          async ({ fetch }, { botId }) => get(fetch, `/bots/${botId}/messages`),
        ),
      },
      { title: "Bots", description: "Bots and their predefined messages." },
    ),
    users: router(
      {
        list: query(
          {
            description: "List a bot's users (page from 1, per_page; deleted=1 returns only deleted users, default 0).",
            input: object({ botId: number(), ...page, deleted: number().optional() }),
          },
          async ({ fetch }, { botId, ...params }) => get(fetch, `/bots/${botId}/users`, params),
        ),
        listWithDialogs: query(
          { description: "List the users of a bot who have an open dialog.", input: object({ botId: number(), ...page }) },
          async ({ fetch }, { botId, ...params }) => get(fetch, `/bots/${botId}/dialogs/users`, params),
        ),
      },
      { title: "Users", description: "A bot's users." },
    ),
    dialogs: router(
      {
        messages: query(
          {
            description: "Get one user's dialog message history (page from 1, per_page).",
            input: object({ botId: number(), userId: number(), ...page }),
          },
          async ({ fetch }, { botId, userId, ...params }) => get(fetch, `/bots/${botId}/dialogs/${userId}/messages`, params),
        ),
        sendMessage: mutation(
          {
            description:
              "Send a text message into a user's open dialog immediately. uid is a unique id you choose for the message (an idempotency key). The send is real and cannot be undone.",
            input: object({ botId: number(), userId: number(), message: string(), uid: string() }),
            approval: always(),
          },
          async ({ fetch }, { botId, userId, message, uid }) =>
            send(fetch, "POST", `/bots/${botId}/dialogs/${userId}/message`, { message, uid }),
        ),
      },
      { title: "Dialogs", description: "Dialog history and live replies." },
    ),
    segments: router(
      {
        list: query(
          { description: "List a bot's user segments with their ids.", input: object({ botId: number() }) },
          async ({ fetch }, { botId }) => get(fetch, `/bots/${botId}/segments`),
        ),
        listUsers: query(
          { description: "List the users in one segment.", input: object({ botId: number(), segmentId: number() }) },
          async ({ fetch }, { botId, segmentId }) => get(fetch, `/bots/${botId}/segments/${segmentId}/users`),
        ),
        addUser: mutation(
          {
            description: "Add a bot user to a segment.",
            input: object({ botId: number(), segmentId: number(), botUserId: number() }),
            approval: always(),
          },
          async ({ fetch }, { botId, segmentId, botUserId }) =>
            send(fetch, "POST", `/bots/${botId}/segments/${segmentId}/users`, { botUserId }),
        ),
        removeUser: mutation(
          {
            description: "Remove a bot user from a segment.",
            input: object({ botId: number(), segmentId: number(), botUserId: number() }),
            approval: always(),
          },
          async ({ fetch }, { botId, segmentId, botUserId }) =>
            send(fetch, "DELETE", `/bots/${botId}/segments/${segmentId}/users`, { botUserId }),
        ),
      },
      { title: "Segments", description: "User segments and their members." },
    ),
    dispatches: router(
      {
        sendTextToUser: mutation(
          {
            description:
              "Create a text dispatch to one bot user. run_at is an ISO 8601 start time; empty means now. Delivered to a real user and cannot be undone once sent.",
            input: object({ botId: number(), botUserId: number(), content: string(), run_at: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { botId, botUserId, ...body }) =>
            send(fetch, "POST", `/bots/${botId}/dispatch/user/${botUserId}`, body),
        ),
        sendTextToSegment: mutation(
          {
            description: "Create a text dispatch to every user in a segment. segmentId 0 means ALL users of the bot. Reaches many real users and cannot be undone.",
            input: object({ botId: number(), segmentId: number(), content: string() }),
            approval: always(),
          },
          async ({ fetch }, { botId, segmentId, ...body }) =>
            send(fetch, "POST", `/bots/${botId}/segments/${segmentId}/dispatch`, body),
        ),
        sendPredefinedMessageToUser: mutation(
          {
            description: "Send one of the bot's predefined messages (ids from bots.messages) to a user.",
            input: object({ botId: number(), botUserId: number(), messageId: string() }),
            approval: always(),
          },
          async ({ fetch }, { botId, botUserId, messageId }) =>
            send(fetch, "POST", `/bots/${botId}/user/${botUserId}/message/${messageId}`, {}),
        ),
        sendPredefinedMessageToSegment: mutation(
          {
            description:
              "Dispatch one of the bot's predefined messages to a segment (segmentId 0 may target all users of the bot, per the vendor spec for segment dispatch). run_at is an ISO 8601 start time; empty means now.",
            input: object({ botId: number(), segmentId: number(), messageId: string(), run_at: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { botId, segmentId, messageId, ...body }) =>
            send(fetch, "POST", `/bots/${botId}/segments/${segmentId}/message/${messageId}`, body),
        ),
      },
      { title: "Dispatches", description: "Send messages to one user or a whole segment." },
    ),
    variables: router(
      {
        list: query(
          { description: "List a bot's variables with ids and types.", input: object({ botId: number() }) },
          async ({ fetch }, { botId }) => get(fetch, `/bots/${botId}/variables`),
        ),
        create: mutation(
          {
            description: "Create a bot variable with a name and a type.",
            input: object({ botId: number(), name: string(), type: string() }),
            approval: always(),
          },
          async ({ fetch }, { botId, ...body }) => send(fetch, "POST", `/bots/${botId}/variables`, body),
        ),
        delete: mutation(
          {
            description: "Delete a bot variable.",
            input: object({ botId: number(), variableId: number() }),
            approval: always(),
          },
          async ({ fetch }, { botId, variableId }) => send(fetch, "DELETE", `/bots/${botId}/variables/${variableId}`, undefined),
        ),
        getUserValue: query(
          {
            description: "Read one variable's value for one bot user.",
            input: object({ botId: number(), variableId: number(), botUserId: number() }),
          },
          async ({ fetch }, { botId, variableId, botUserId }) =>
            get(fetch, `/bots/${botId}/variables/${variableId}/user/${botUserId}`),
        ),
        setUserValue: mutation(
          {
            description: "Set one variable's value for one bot user.",
            input: object({ botId: number(), variableId: number(), botUserId: number(), value: string() }),
            approval: always(),
          },
          async ({ fetch }, { botId, variableId, botUserId, value }) =>
            send(fetch, "POST", `/bots/${botId}/variables/${variableId}/user/${botUserId}`, { value }),
        ),
      },
      { title: "Variables", description: "Bot variables and per-user values." },
    ),
    forms: router(
      {
        list: query(
          { description: "List a bot's forms.", input: object({ botId: number() }) },
          async ({ fetch }, { botId }) => get(fetch, "/forms", { botId }),
        ),
        notificationSample: query(
          {
            description: "Get a sample notification payload (the form's fields) for a form.",
            input: object({ botId: number(), formId: string() }),
          },
          async ({ fetch }, { botId, formId }) => get(fetch, "/notification-sample", { botId, formId }),
        ),
        listSubscriptions: query(
          {
            description: "List the notification subscriptions on a form.",
            input: object({ botId: number(), formId: string() }),
          },
          async ({ fetch }, { botId, formId }) => get(fetch, "/notification", { botId, formId }),
        ),
        subscribe: mutation(
          {
            description: "Subscribe a callback URL to a form's notifications (new form submissions).",
            input: object({ botId: number(), formId: string(), target_url: string(), event: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, body) => send(fetch, "POST", "/subscribe-notification", body),
        ),
        unsubscribe: mutation(
          {
            description: "Remove a notification subscription by its id.",
            input: object({ botId: number(), subscriptionId: number() }),
            approval: always(),
          },
          async ({ fetch }, body) => send(fetch, "DELETE", "/unsubscribe-notification", body),
        ),
      },
      { title: "Forms", description: "Forms and form-submission notification subscriptions." },
    ),
  });
};

export default defineApp({ user: { accounts: { chatforma: chatforma.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.chatforma ?? [], (account) => chatformaTools(account, signal), { signal }), {
    title: "Chatforma",
    description: "Manage Chatforma chatbots: bots, users, segments, dialogs, messages, dispatches, variables and notifications.",
    icons,
  }),
}));

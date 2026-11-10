import {
  accountRouter,
  array,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://next.textus.com";
const media = "application/vnd.textus+jsonld";

const textus = defineProvider({
  name: "TextUs",
  hosts: ["next.textus.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/accounts`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: media },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: media, "Content-Type": media },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 202 || response.status === 204) return { status: response.status };
    return decodeJson(response, json());
  };
}

const seg = (value: string) => encodeURIComponent(value);
const Account = object({ account: string({ minLength: 1 }) });

function build(call: ReturnType<typeof client>) {
  return router({
    accounts: router(
      {
        get: query(
          { description: "Get a TextUs account by its slug: settings, feature flags, phone numbers and resource links.", input: Account },
          async (_ctx, { account }) => call("GET", `/accounts/${seg(account)}`),
        ),
        list: query(
          { description: "List the accounts the API token can access.", input: object({}) },
          async () => call("GET", "/accounts"),
        ),
      },
      { title: "Accounts", description: "TextUs accounts. Most other tools take the account slug." },
    ),
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send a text message from an account. to is one E.164 number, or several (sent as a batch, which returns no body). Only one attachment is allowed per message and its mediaUrl must be public. Set channel to whatsapp for WhatsApp.",
            input: object({
              account: string({ minLength: 1 }),
              to: array(string({ minLength: 1 })),
              body: string().optional(),
              savedReply: string().optional(),
              channel: string().optional(),
              attachmentUrl: string().optional(),
              attachmentContentType: string().optional(),
            }),
          },
          async (_ctx, input) => {
            const payload: Record<string, unknown> = { to: input.to.length === 1 ? input.to[0] : input.to };
            if (input.body !== undefined) payload.body = input.body;
            if (input.savedReply !== undefined) payload.saved_reply = input.savedReply;
            if (input.channel !== undefined) payload.channel = input.channel;
            if (input.attachmentUrl !== undefined)
              payload.attachments = [{ media_url: input.attachmentUrl, content_type: input.attachmentContentType }];
            return call("POST", `/${seg(input.account)}/messages`, payload);
          },
        ),
      },
      { title: "Messages", description: "Send and read text messages." },
    ),
    contacts: router(
      {
        list: query(
          { description: "List the contacts of an account (a paginated Hydra collection).", input: Account },
          async (_ctx, { account }) => call("GET", `/${seg(account)}/contacts`),
        ),
        get: query(
          {
            description: "Get everything known about one contact, including phones, notes and groups.",
            input: object({ account: string({ minLength: 1 }), contact: string({ minLength: 1 }) }),
          },
          async (_ctx, { account, contact }) => call("GET", `/${seg(account)}/contacts/${seg(contact)}`),
        ),
        create: mutation(
          {
            description: "Create a contact. phones is a list of numbers, each with an optional type such as Mobile or Work.",
            input: object({
              account: string({ minLength: 1 }),
              name: string({ minLength: 1 }),
              phones: array(object({ number: string({ minLength: 1 }), type: string().optional() })),
            }),
          },
          async (_ctx, { account, name, phones }) => call("POST", `/${seg(account)}/contacts`, { name, phones }),
        ),
      },
      { title: "Contacts", description: "Contacts and their phone numbers." },
    ),
    conversations: router(
      {
        list: query(
          {
            description: "List conversations in a conversation filter (for example you, unassigned or all). q searches.",
            input: object({ account: string({ minLength: 1 }), filter: string({ minLength: 1 }), q: string().optional() }),
          },
          async (_ctx, { account, filter, q }) =>
            call(
              "GET",
              `/${seg(account)}/conversation_filters/${seg(filter)}/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`,
            ),
        ),
        timeline: query(
          { description: "Get a conversation's timeline (messages and notes), newest first.", input: object({ conversation: string({ minLength: 1 }) }) },
          async (_ctx, { conversation }) => call("GET", `/conversations/${seg(conversation)}/timeline`),
        ),
      },
      { title: "Conversations", description: "Inbox conversations and their timelines." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { textus: textus.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.textus ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TextUs",
        description: "Send and manage business text messages with TextUs: messages, contacts, conversations and accounts.",
        icons,
      },
    ),
  }),
);

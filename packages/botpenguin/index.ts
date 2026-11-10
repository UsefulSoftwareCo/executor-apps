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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.v7.botpenguin.com";

type Fetch = typeof fetch;

const botpenguin = defineProvider({
  name: "BotPenguin",
  hosts: ["api.v7.botpenguin.com"],
  auth: {
    // Account API access token (More > Developer > API Access Token). Covers contacts, inbox and segments.
    accessToken: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // WhatsApp bot API key (bot Settings > API Key). Covers WhatsApp templates and sending messages.
    whatsappKey: secrets({
      label: "WhatsApp bot API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "accessToken") {
      const response = await fetch(`${base}/inbox/segments`, {
        signal,
        headers: { Authorization: `Bearer ${account.fields.token}`, authtype: "Key" },
      });
      await decodeJson(response, object({ success: boolean() }));
      return;
    }
    const response = await fetch(`${base}/whatsapp-automation/wa/templates?apiKey=${encodeURIComponent(account.fields.apiKey)}`, {
      signal,
      headers: { apiKey: account.fields.apiKey },
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

function bearerClient(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, authtype: "Key", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

function whatsappClient(apiKey: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}?apiKey=${encodeURIComponent(apiKey)}`, {
      method,
      signal,
      headers: { apiKey, authType: "Key", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const ConversationStatus = string();

function accountTools(call: ReturnType<typeof bearerClient>) {
  return router({
    segments: router(
      {
        list: query(
          {
            description: "List the contact segments (groups) in the account, with each segment's filter definition. Segment IDs can be used in the inbox contact filter.",
            input: object({}),
          },
          async () => call("GET", "/inbox/segments"),
        ),
      },
      { title: "Segments", description: "Saved contact groups." },
    ),
    contacts: router(
      {
        list: query(
          {
            description:
              "List one page of inbox contacts with their conversation metadata. All filters are optional; omitted ones match everything. status values: OPEN, INPROGRESS, REVIEW, ONHOLD, DEPENDANCY, CLOSED. lastMessageBy values: bot, user, agent. Page numbers start at 1; keep increasing until the contacts list is empty.",
            input: object({
              page: number().default(1),
              searchText: string().default(""),
              tags: array(string()).default([]),
              status: array(ConversationStatus).default([]),
              userInteracted: boolean().default(true),
              isContact: boolean().default(true),
              isOnline: boolean().default(false),
              isLiveChatActive: boolean().default(false),
              segments: array(string()).default([]),
              agentIds: array(string()).default([]),
              whatsappBotIds: array(string()).default([]),
              websiteBotIds: array(string()).default([]),
              telegramBotIds: array(string()).default([]),
              facebookBotIds: array(string()).default([]),
              lastMessageBy: array(string()).default([]),
              createdAfter: string().default(""),
              createdBefore: string().default(""),
              lastSeenAfter: string().default(""),
              lastSeenBefore: string().default(""),
            }),
          },
          async (_ctx, input) =>
            call("POST", "/inbox/users", {
              searchText: input.searchText,
              tags: input.tags,
              status: input.status,
              isOnline: input.isOnline,
              _botWebsite: input.websiteBotIds,
              _botWhatsapp: input.whatsappBotIds,
              _botTelegram: input.telegramBotIds,
              _botFacebook: input.facebookBotIds,
              _agentAssigned: input.agentIds,
              segments: input.segments,
              applicableFilters: input.userInteracted ? ["userInteracted"] : [],
              lastSeenAt: { startAt: input.lastSeenAfter, endsAt: input.lastSeenBefore },
              createdAt: { startAt: input.createdAfter, endsAt: input.createdBefore },
              userInteracted: input.userInteracted,
              lastMessageBy: input.lastMessageBy,
              isLiveChatActive: input.isLiveChatActive,
              hasOrdered: { status: false, lastAt: "" },
              page: input.page,
              isExport: "none",
              isContact: input.isContact,
            }),
        ),
        import: mutation(
          {
            description:
              "Import WhatsApp contacts in bulk. Existing contacts may be updated. Returns no contact IDs. Phone number excludes the country code; prefix is the dial code without '+' (91, 1).",
            input: object({
              contacts: array(
                object({
                  name: string({ minLength: 1 }),
                  email: string().default(""),
                  phoneNumber: string({ minLength: 1 }),
                  phonePrefix: string({ minLength: 1 }),
                  tags: array(string()).default([]),
                  attributes: array(object({ key: string(), value: string() })).default([]),
                }),
              ),
            }),
          },
          async (_ctx, { contacts }) =>
            call(
              "POST",
              "/inbox/users/import",
              contacts.map((contact) => ({
                profile: {
                  userDetails: {
                    userProvidedName: contact.name,
                    contact: { email: contact.email, phone: { number: contact.phoneNumber, prefix: contact.phonePrefix } },
                    tags: contact.tags,
                    attributes: contact.attributes,
                  },
                },
              })),
            ),
        ),
        delete: mutation(
          {
            description:
              "Mark inbox contacts as DELETED. ids are BotPenguin user IDs (Inbox, contact menu, Copy User ID), not phone numbers.",
            input: object({ ids: array(string({ minLength: 1 })) }),
          },
          async (_ctx, { ids }) => call("PUT", "/inbox/users/status-update", { ids, status: "DELETED" }),
        ),
      },
      { title: "Contacts", description: "Inbox contacts and their conversations." },
    ),
  });
}

const TemplateParameter = object({
  type: string({ minLength: 1 }),
  text: string().optional(),
  parameter_name: string().optional(),
  document: object({ link: string() }).optional(),
  image: object({ link: string() }).optional(),
  video: object({ link: string() }).optional(),
});

function whatsappTools(call: ReturnType<typeof whatsappClient>) {
  return router({
    templates: router(
      {
        list: query(
          {
            description:
              "List the WhatsApp templates of the bot that owns the API key, in every status (APPROVED, PENDING, REJECTED, DRAFT). Use a template's templateId with templates.send.",
            input: object({}),
          },
          async () => call("GET", "/whatsapp-automation/wa/templates"),
        ),
        send: mutation(
          {
            description:
              "Send an approved WhatsApp template message. waId is the recipient's number with country code and no '+'. params is the template's component list, for example [{ type: 'body', parameters: [{ type: 'text', text: 'John' }] }]; named variables also need parameter_name, and a header may carry a document, image or video link. assignTo is an agent's email.",
            input: object({
              userName: string({ minLength: 1 }),
              waId: string({ minLength: 1 }),
              templateId: string({ minLength: 1 }),
              params: array(object({ type: string({ minLength: 1 }), parameters: array(TemplateParameter) })).default([]),
              assignTo: string().optional(),
              tags: array(string()).default([]),
            }),
          },
          async (_ctx, { userName, waId, templateId, params, assignTo, tags }) =>
            call("POST", "/whatsapp-automation/wa/send-template", {
              userName,
              wa_id: waId,
              templateId,
              params,
              ...(assignTo === undefined ? {} : { assignTo }),
              tags,
            }),
        ),
      },
      { title: "Templates", description: "WhatsApp message templates." },
    ),
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send a plain text or image WhatsApp message. waId is the recipient's number with country code and no '+'. For type 'text' set text; for type 'image' set imageUrl (public URL) and optionally caption.",
            input: object({
              userName: string({ minLength: 1 }),
              waId: string({ minLength: 1 }),
              type: string({ minLength: 1 }),
              text: string().optional(),
              imageUrl: string().optional(),
              caption: string().optional(),
              tags: array(string()).default([]),
            }),
          },
          async (_ctx, { userName, waId, type, text, imageUrl, caption, tags }) => {
            if (type === "text" && text === undefined) throw new Error("text is required when type is 'text'");
            if (type === "image" && imageUrl === undefined) throw new Error("imageUrl is required when type is 'image'");
            if (type !== "text" && type !== "image") throw new Error("type must be 'text' or 'image'");
            const message =
              type === "text" ? { text } : { source: imageUrl, ...(caption === undefined ? {} : { label: caption }) };
            return call("POST", "/whatsapp-automation/wa/send-message", { userName, wa_id: waId, type, message, tags });
          },
        ),
      },
      { title: "Messages", description: "Free-form WhatsApp messages." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { botpenguin: botpenguin.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.botpenguin ?? [],
        (account) =>
          withApprovals(
            account.method === "accessToken"
              ? accountTools(bearerClient(account.fields.token, fetch, signal))
              : whatsappTools(whatsappClient(account.fields.apiKey, fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "BotPenguin",
        description: "Manage BotPenguin inbox contacts and segments, and send WhatsApp messages and templates.",
        icons,
      },
    ),
  }),
);

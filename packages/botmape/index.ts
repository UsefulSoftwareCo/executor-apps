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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://botmape.com/api";

const botmape = defineProvider({
  name: "BotMape",
  hosts: ["botmape.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing agents is read-only and returns a JSON array for any valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/chatbots`, {
      signal,
      headers: { "X-API-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "X-API-Key": account.fields.token, Accept: "application/json" });
const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });
const id = (value: string) => encodeURIComponent(value);

const botmapeTools = (account: Account, signal: AbortSignal) =>
  router({
    agents: router(
      {
        list: query(
          {
            description: "List all AI agents owned by the authenticated account with their configuration.",
            input: object({}),
          },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/chatbots`, { signal, headers: headers(account) }), json()),
        ),
        get: query(
          {
            description: "Get one AI agent by id, including its system prompt, appearance and active state.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id: agentId }) =>
            decodeJson(await fetch(`${base}/chatbots/${id(agentId)}`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description:
              "Create an AI agent. name is required (max 100 characters). primaryColor is a hex color for the widget theme. The plan may limit how many agents exist (403 when reached).",
            input: object({
              name: string(),
              description: string().optional(),
              welcomeMessage: string().optional(),
              systemPrompt: string().optional(),
              primaryColor: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/chatbots`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description:
              "Update an AI agent's name, description, welcome message, system prompt, color or active state. Only the fields you pass change.",
            input: object({
              id: string(),
              name: string().optional(),
              description: string().optional(),
              welcomeMessage: string().optional(),
              systemPrompt: string().optional(),
              primaryColor: string().optional(),
              isActive: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { id: agentId, ...body }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(agentId)}`, {
                method: "PUT",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
        sendMessage: mutation(
          {
            description:
              "Send a visitor message to an AI agent and receive its AI-generated reply plus a conversationId. Pass conversationId to continue an earlier conversation. This creates a conversation and uses message quota.",
            input: object({
              chatbotId: string(),
              message: string(),
              conversationId: string().optional(),
              visitorId: string().optional(),
              visitorName: string().optional(),
              visitorEmail: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { chatbotId, ...body }) =>
            decodeJson(
              await fetch(`${base}/chat/${id(chatbotId)}`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Agents", description: "Create, configure and chat with BotMape AI agents." },
    ),
    knowledge: router(
      {
        list: query(
          {
            description: "List the knowledge base entries that train an AI agent's answers.",
            input: object({ chatbotId: string() }),
          },
          async ({ fetch }, { chatbotId }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(chatbotId)}/knowledge`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        add: mutation(
          {
            description:
              "Add training content (FAQ, documentation, policies) to an agent's knowledge base. The content is embedded automatically. metadata is an optional JSON object.",
            input: object({ chatbotId: string(), content: string(), metadata: record(json()).optional() }),
            approval: always(),
          },
          async ({ fetch }, { chatbotId, ...body }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(chatbotId)}/knowledge`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete one knowledge base entry from an AI agent's training data.",
            input: object({ chatbotId: string(), knowledgeId: string() }),
            approval: always(),
          },
          async ({ fetch }, { chatbotId, knowledgeId }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(chatbotId)}/knowledge/${id(knowledgeId)}`, {
                method: "DELETE",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
      },
      { title: "Knowledge", description: "Manage the training content of an AI agent." },
    ),
    conversations: router(
      {
        list: query(
          {
            description: "List an AI agent's conversations with visitor information and message counts.",
            input: object({ chatbotId: string() }),
          },
          async ({ fetch }, { chatbotId }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(chatbotId)}/conversations`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        get: query(
          {
            description: "Get details of one conversation.",
            input: object({ conversationId: string() }),
          },
          async ({ fetch }, { conversationId }) =>
            decodeJson(
              await fetch(`${base}/conversations/${id(conversationId)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        messages: query(
          {
            description: "List all messages in a conversation with sender and timestamps.",
            input: object({ conversationId: string() }),
          },
          async ({ fetch }, { conversationId }) =>
            decodeJson(
              await fetch(`${base}/conversations/${id(conversationId)}/messages`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        addMessage: mutation(
          {
            description:
              "Append a message to an existing conversation without generating an AI reply (for custom integrations). role is the sender role, such as user or assistant.",
            input: object({ conversationId: string(), content: string(), role: string() }),
            approval: always(),
          },
          async ({ fetch }, { conversationId, ...body }) =>
            decodeJson(
              await fetch(`${base}/conversations/${id(conversationId)}/messages`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Conversations", description: "Read and extend visitor conversations." },
    ),
    analytics: router(
      {
        overview: query(
          {
            description: "Aggregate analytics across all agents: message counts, conversations and trends.",
            input: object({}),
          },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/analytics`, { signal, headers: headers(account) }), json()),
        ),
        agent: query(
          {
            description: "Detailed analytics for one AI agent: performance metrics and usage trends.",
            input: object({ chatbotId: string() }),
          },
          async ({ fetch }, { chatbotId }) =>
            decodeJson(
              await fetch(`${base}/chatbots/${id(chatbotId)}/analytics`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        export: query(
          {
            description: "Export detailed analytics data for reporting and external analysis.",
            input: object({}),
          },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/analytics/export`, { signal, headers: headers(account) }), json()),
        ),
      },
      { title: "Analytics", description: "Usage and performance analytics." },
    ),
  });

export default defineApp({ user: { accounts: { botmape: botmape.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.botmape ?? [], (account) => botmapeTools(account, signal), { signal }), {
    title: "BotMape",
    description: "Create and train BotMape AI agents, manage knowledge bases, read conversations and analytics.",
    icons,
  }),
}));

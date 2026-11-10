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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://services.kommunicate.io";

const kommunicate = defineProvider({
  name: "Kommunicate",
  hosts: ["services.kommunicate.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Kommunicate documents no current-account endpoint; looking up a user id is the one read-only call that needs the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/rest/ws/user/v2/detail`, {
      method: "POST",
      signal,
      headers: { "Api-Key": account.fields.token, "Content-Type": "application/json" },
      body: JSON.stringify({ userIdList: ["executor-health-check"] }),
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const kommunicateTools = (account: Account, signal: AbortSignal) => {
  const headers = (ofUserId?: string) => ({
    "Api-Key": account.fields.token,
    "Content-Type": "application/json",
    ...(ofUserId === undefined ? {} : { "Of-User-Id": ofUserId }),
  });
  return router({
    createConversation: mutation(
      {
        description:
          "Create a conversation. groupName is its title; groupMemberList lists user ids (missing users are created), at least one. Conversation rules run by default and may add bots or agents. Set skipRouting with an assignee (also included in groupMemberList) to bypass the rules and assign directly; without an assignee nobody gets the conversation. Returns the conversation including its groupId.",
        input: object({
          groupName: string(),
          groupMemberList: array(string()),
          clientGroupId: string().optional(),
          skipRouting: boolean().optional(),
          assignee: string().optional(),
          metadata: record(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { skipRouting, assignee, metadata, ...input }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/group/conversation`, {
            method: "POST",
            signal,
            headers: headers(),
            body: JSON.stringify({
              ...input,
              metadata: {
                ...metadata,
                ...(skipRouting === undefined ? {} : { SKIP_ROUTING: skipRouting }),
                ...(assignee === undefined ? {} : { CONVERSATION_ASSIGNEE: assignee }),
              },
            }),
          }),
          json(),
        ),
    ),
    sendMessage: mutation(
      {
        description:
          "Send a text message into a conversation. groupId is the conversation's id, fromUserName the sending user's id. Set skipBot true for messages written by a human agent so the bot does not also react. metadata carries rich-message fields as strings (contentType, templateId, payload as stringified JSON).",
        input: object({
          groupId: string(),
          fromUserName: string(),
          message: string(),
          skipBot: boolean().optional(),
          metadata: record(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { skipBot, metadata, ...input }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/message/v2/send`, {
            method: "POST",
            signal,
            headers: headers(),
            body: JSON.stringify({
              ...input,
              metadata: { ...metadata, ...(skipBot === undefined ? {} : { skipBot: String(skipBot) }) },
            }),
          }),
          json(),
        ),
    ),
    changeConversationStatus: mutation(
      {
        description:
          "Change a conversation's status: 0 open, 2 closed, 3 spam. ofUserId is the acting user's id. sendNotifyMessage (default true) posts a notice in the conversation.",
        input: object({
          groupId: string(),
          status: number(),
          ofUserId: string(),
          sendNotifyMessage: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { ofUserId, ...input }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/group/status/change?${search(input)}`, {
            method: "PATCH",
            signal,
            headers: headers(ofUserId),
          }),
          json(),
        ),
    ),
    changeConversationAssignee: mutation(
      {
        description:
          "Assign a conversation to a human agent by the agent's email. ofUserId is the acting user's id. takeOverFromBot true removes all AI agents from the conversation. sendNotifyMessage defaults to true. An agent at their handling limit returns AGENT_IS_ALREADY_ENGAGED.",
        input: object({
          groupId: string(),
          assignee: string(),
          ofUserId: string(),
          sendNotifyMessage: boolean().optional(),
          takeOverFromBot: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { ofUserId, ...input }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/group/assignee/change?${search(input)}`, {
            method: "PATCH",
            signal,
            headers: headers(ofUserId),
          }),
          json(),
        ),
    ),
    updateUserDetails: mutation(
      {
        description:
          "Update an end user's email, display name, image link or metadata (key-value pairs visible to agents in the dashboard). userId is sent as Of-User-Id. Works only for end users, not human agents.",
        input: object({
          userId: string(),
          email: string().optional(),
          displayName: string().optional(),
          imageLink: string().optional(),
          metadata: record(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { userId, ...input }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/user/update`, {
            method: "POST",
            signal,
            headers: headers(userId),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getUserDetails: query(
      {
        description:
          "Look up users by id. Returns for each: userId, userName, connected (online), lastSeenAtTime, createdAtTime, imageLink, deactivated, phoneNumber, unreadCount, lastLoggedInAtTime and lastMessageAtTime.",
        input: object({ userIdList: array(string()) }),
      },
      async ({ fetch }, { userIdList }) =>
        decodeJson(
          await fetch(`${base}/rest/ws/user/v2/detail?fetchLatestMessageTime=true`, {
            method: "POST",
            signal,
            headers: headers(),
            body: JSON.stringify({ userIdList }),
          }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { kommunicate: kommunicate.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.kommunicate ?? [], (account) => kommunicateTools(account, signal), { signal }), {
    title: "Kommunicate",
    description: "Create support conversations, send messages, change status and assignee, and look up or update users in Kommunicate.",
    icons,
  }),
}));

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

const base = "https://api.telegram.org";

const telegram = defineProvider({
  name: "Telegram",
  hosts: ["api.telegram.org"],
  auth: {
    apiKey: secrets({
      label: "Bot token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // getMe is read-only and always returns ok plus the bot user.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/bot${account.fields.token}/getMe`, { signal });
    await decodeJson(response, object({ ok: boolean() }));
  },
});

type Fetch = typeof fetch;

// The Bot API answers HTTP 200 or an error status with { ok, result | description }.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, body: Record<string, unknown> = {}) => {
    const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
    const response = await fetcher(`${base}/bot${token}/${method}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const chatId = string({ minLength: 1 });
const messageId = number();
const opt = {
  parseMode: string().optional(),
  disableNotification: boolean().optional(),
  protectContent: boolean().optional(),
  replyToMessageId: number().optional(),
  replyMarkup: json().optional(),
  messageThreadId: number().optional(),
};

function optBody(i: {
  parseMode?: string;
  disableNotification?: boolean;
  protectContent?: boolean;
  replyToMessageId?: number;
  replyMarkup?: unknown;
  messageThreadId?: number;
}) {
  return {
    parse_mode: i.parseMode,
    disable_notification: i.disableNotification,
    protect_content: i.protectContent,
    reply_parameters: i.replyToMessageId === undefined ? undefined : { message_id: i.replyToMessageId },
    reply_markup: i.replyMarkup,
    message_thread_id: i.messageThreadId,
  };
}

const idDesc = "chatId is a numeric chat id or an @channelusername.";
const mediaDesc = "A file_id already on Telegram or a public HTTPS URL.";

function build(call: Call) {
  const media = (method: string, field: string, noun: string) =>
    mutation(
      {
        description: `Send a ${noun}. ${mediaDesc} ${idDesc}`,
        input: object({ chatId, [field]: string({ minLength: 1 }), caption: string().optional(), ...opt }),
      },
      async (_ctx, i) => {
        const r = i as Record<string, any>;
        return call(method, { chat_id: r.chatId, [field]: r[field], caption: r.caption, ...optBody(r) });
      },
    );

  return router({
    bot: router(
      {
        getMe: query({ description: "Get the bot's own user record (id, username, capabilities).", input: object({}) }, async () =>
          call("getMe"),
        ),
        getMyCommands: query({ description: "List the bot's commands.", input: object({}) }, async () => call("getMyCommands")),
        setMyCommands: mutation(
          {
            description: "Replace the bot's command list. commands is an array of { command, description }.",
            input: object({ commands: json() }),
          },
          async (_ctx, { commands }) => call("setMyCommands", { commands }),
        ),
        logOut: mutation(
          { description: "Log the bot out of the cloud Bot API server. Cannot log back in for 10 minutes.", input: object({}) },
          async () => call("logOut"),
        ),
      },
      { title: "Bot", description: "Bot identity and commands." },
    ),
    updates: router(
      {
        getUpdates: mutation(
          {
            description:
              "Long-poll incoming updates (messages, callbacks). Confirms updates before offset, so it consumes them. Fails while a webhook is set.",
            input: object({
              offset: number().optional(),
              limit: number().optional(),
              timeout: number().optional(),
              allowedUpdates: array(string()).optional(),
            }),
          },
          async (_ctx, i) =>
            call("getUpdates", { offset: i.offset, limit: i.limit, timeout: i.timeout, allowed_updates: i.allowedUpdates }),
        ),
        getWebhookInfo: query({ description: "Get the current webhook status.", input: object({}) }, async () => call("getWebhookInfo")),
        setWebhook: mutation(
          {
            description: "Point the bot at an HTTPS webhook URL.",
            input: object({
              url: string({ minLength: 1 }),
              secretToken: string().optional(),
              allowedUpdates: array(string()).optional(),
              dropPendingUpdates: boolean().optional(),
              maxConnections: number().optional(),
            }),
          },
          async (_ctx, i) =>
            call("setWebhook", {
              url: i.url,
              secret_token: i.secretToken,
              allowed_updates: i.allowedUpdates,
              drop_pending_updates: i.dropPendingUpdates,
              max_connections: i.maxConnections,
            }),
        ),
        deleteWebhook: mutation(
          { description: "Remove the webhook.", input: object({ dropPendingUpdates: boolean().optional() }) },
          async (_ctx, i) => call("deleteWebhook", { drop_pending_updates: i.dropPendingUpdates }),
        ),
      },
      { title: "Updates", description: "Receive updates by polling or webhook." },
    ),
    messages: router(
      {
        sendMessage: mutation(
          {
            description: `Send a text message. parseMode is MarkdownV2, HTML or Markdown. replyMarkup is an inline keyboard or reply keyboard object. ${idDesc}`,
            input: object({ chatId, text: string({ minLength: 1 }), linkPreviewDisabled: boolean().optional(), ...opt }),
          },
          async (_ctx, i) =>
            call("sendMessage", {
              chat_id: i.chatId,
              text: i.text,
              link_preview_options: i.linkPreviewDisabled ? { is_disabled: true } : undefined,
              ...optBody(i),
            }),
        ),
        sendPhoto: media("sendPhoto", "photo", "photo"),
        sendDocument: media("sendDocument", "document", "document"),
        sendVideo: media("sendVideo", "video", "video"),
        sendAudio: media("sendAudio", "audio", "audio file"),
        sendAnimation: media("sendAnimation", "animation", "GIF or silent video"),
        sendVoice: media("sendVoice", "voice", "voice message (OGG/Opus)"),
        sendSticker: mutation(
          { description: `Send a sticker. ${mediaDesc} ${idDesc}`, input: object({ chatId, sticker: string({ minLength: 1 }), ...opt }) },
          async (_ctx, i) => call("sendSticker", { chat_id: i.chatId, sticker: i.sticker, ...optBody(i) }),
        ),
        sendLocation: mutation(
          {
            description: `Send a point on the map. ${idDesc}`,
            input: object({ chatId, latitude: number(), longitude: number(), ...opt }),
          },
          async (_ctx, i) => call("sendLocation", { chat_id: i.chatId, latitude: i.latitude, longitude: i.longitude, ...optBody(i) }),
        ),
        sendContact: mutation(
          {
            description: `Send a phone contact. ${idDesc}`,
            input: object({ chatId, phoneNumber: string({ minLength: 1 }), firstName: string({ minLength: 1 }), lastName: string().optional(), ...opt }),
          },
          async (_ctx, i) =>
            call("sendContact", { chat_id: i.chatId, phone_number: i.phoneNumber, first_name: i.firstName, last_name: i.lastName, ...optBody(i) }),
        ),
        sendPoll: mutation(
          {
            description: `Send a native poll. options is an array of 2-10 answer strings. type is regular or quiz. ${idDesc}`,
            input: object({
              chatId,
              question: string({ minLength: 1 }),
              options: array(string({ minLength: 1 })),
              isAnonymous: boolean().optional(),
              type: string().optional(),
              allowsMultipleAnswers: boolean().optional(),
              correctOptionId: number().optional(),
              ...opt,
            }),
          },
          async (_ctx, i) =>
            call("sendPoll", {
              chat_id: i.chatId,
              question: i.question,
              options: i.options.map((text) => ({ text })),
              is_anonymous: i.isAnonymous,
              type: i.type,
              allows_multiple_answers: i.allowsMultipleAnswers,
              correct_option_id: i.correctOptionId,
              ...optBody(i),
            }),
        ),
        sendChatAction: mutation(
          {
            description: "Show a chat action such as typing, upload_photo or upload_document for about 5 seconds.",
            input: object({ chatId, action: string({ minLength: 1 }) }),
          },
          async (_ctx, i) => call("sendChatAction", { chat_id: i.chatId, action: i.action }),
        ),
        forwardMessage: mutation(
          {
            description: "Forward a message, keeping the original sender attribution.",
            input: object({ chatId, fromChatId: chatId, messageId, disableNotification: boolean().optional() }),
          },
          async (_ctx, i) =>
            call("forwardMessage", { chat_id: i.chatId, from_chat_id: i.fromChatId, message_id: i.messageId, disable_notification: i.disableNotification }),
        ),
        copyMessage: mutation(
          {
            description: "Copy a message without a link to the original.",
            input: object({ chatId, fromChatId: chatId, messageId, caption: string().optional(), ...opt }),
          },
          async (_ctx, i) =>
            call("copyMessage", { chat_id: i.chatId, from_chat_id: i.fromChatId, message_id: i.messageId, caption: i.caption, ...optBody(i) }),
        ),
        editText: mutation(
          {
            description: "Edit the text of a message the bot sent. replyMarkup may only be an inline keyboard.",
            input: object({ chatId, messageId, text: string({ minLength: 1 }), parseMode: string().optional(), replyMarkup: json().optional() }),
          },
          async (_ctx, i) =>
            call("editMessageText", { chat_id: i.chatId, message_id: i.messageId, text: i.text, parse_mode: i.parseMode, reply_markup: i.replyMarkup }),
        ),
        editCaption: mutation(
          {
            description: "Edit the caption of a media message the bot sent.",
            input: object({ chatId, messageId, caption: string(), parseMode: string().optional(), replyMarkup: json().optional() }),
          },
          async (_ctx, i) =>
            call("editMessageCaption", { chat_id: i.chatId, message_id: i.messageId, caption: i.caption, parse_mode: i.parseMode, reply_markup: i.replyMarkup }),
        ),
        editReplyMarkup: mutation(
          {
            description: "Replace or remove (omit replyMarkup) the inline keyboard of a message.",
            input: object({ chatId, messageId, replyMarkup: json().optional() }),
          },
          async (_ctx, i) => call("editMessageReplyMarkup", { chat_id: i.chatId, message_id: i.messageId, reply_markup: i.replyMarkup }),
        ),
        stopPoll: mutation(
          { description: "Close a poll the bot sent.", input: object({ chatId, messageId }) },
          async (_ctx, i) => call("stopPoll", { chat_id: i.chatId, message_id: i.messageId }),
        ),
        delete: mutation(
          { description: "Delete a message. The bot can delete its own messages, and others' where it has rights, within 48 hours in most cases.", input: object({ chatId, messageId }) },
          async (_ctx, i) => call("deleteMessage", { chat_id: i.chatId, message_id: i.messageId }),
        ),
        pin: mutation(
          { description: "Pin a message in a chat.", input: object({ chatId, messageId, disableNotification: boolean().optional() }) },
          async (_ctx, i) => call("pinChatMessage", { chat_id: i.chatId, message_id: i.messageId, disable_notification: i.disableNotification }),
        ),
        unpin: mutation(
          { description: "Unpin a message, or the most recent pinned one when messageId is omitted.", input: object({ chatId, messageId: number().optional() }) },
          async (_ctx, i) => call("unpinChatMessage", { chat_id: i.chatId, message_id: i.messageId }),
        ),
        unpinAll: mutation(
          { description: "Unpin every pinned message in a chat.", input: object({ chatId }) },
          async (_ctx, i) => call("unpinAllChatMessages", { chat_id: i.chatId }),
        ),
        answerCallbackQuery: mutation(
          {
            description: "Answer a callback query from an inline keyboard button press.",
            input: object({ callbackQueryId: string({ minLength: 1 }), text: string().optional(), showAlert: boolean().optional() }),
          },
          async (_ctx, i) =>
            call("answerCallbackQuery", { callback_query_id: i.callbackQueryId, text: i.text, show_alert: i.showAlert }),
        ),
      },
      { title: "Messages", description: "Send, edit, forward, pin and delete messages and media." },
    ),
    chats: router(
      {
        get: query({ description: `Get chat details. ${idDesc}`, input: object({ chatId }) }, async (_ctx, i) =>
          call("getChat", { chat_id: i.chatId }),
        ),
        getMemberCount: query({ description: "Count the members of a chat.", input: object({ chatId }) }, async (_ctx, i) =>
          call("getChatMemberCount", { chat_id: i.chatId }),
        ),
        getMember: query(
          { description: "Get one member's status in a chat.", input: object({ chatId, userId: number() }) },
          async (_ctx, i) => call("getChatMember", { chat_id: i.chatId, user_id: i.userId }),
        ),
        getAdministrators: query({ description: "List the administrators of a chat.", input: object({ chatId }) }, async (_ctx, i) =>
          call("getChatAdministrators", { chat_id: i.chatId }),
        ),
        setTitle: mutation(
          { description: "Change the title of a group, supergroup or channel.", input: object({ chatId, title: string({ minLength: 1 }) }) },
          async (_ctx, i) => call("setChatTitle", { chat_id: i.chatId, title: i.title }),
        ),
        setDescription: mutation(
          { description: "Change the description of a group, supergroup or channel.", input: object({ chatId, description: string() }) },
          async (_ctx, i) => call("setChatDescription", { chat_id: i.chatId, description: i.description }),
        ),
        exportInviteLink: mutation(
          { description: "Generate a new primary invite link, revoking the previous one.", input: object({ chatId }) },
          async (_ctx, i) => call("exportChatInviteLink", { chat_id: i.chatId }),
        ),
        createInviteLink: mutation(
          {
            description: "Create an additional invite link. expireDate is a unix timestamp.",
            input: object({ chatId, name: string().optional(), expireDate: number().optional(), memberLimit: number().optional() }),
          },
          async (_ctx, i) =>
            call("createChatInviteLink", { chat_id: i.chatId, name: i.name, expire_date: i.expireDate, member_limit: i.memberLimit }),
        ),
        ban: mutation(
          { description: "Ban a user from a group, supergroup or channel.", input: object({ chatId, userId: number(), untilDate: number().optional(), revokeMessages: boolean().optional() }) },
          async (_ctx, i) =>
            call("banChatMember", { chat_id: i.chatId, user_id: i.userId, until_date: i.untilDate, revoke_messages: i.revokeMessages }),
        ),
        unban: mutation(
          { description: "Unban a user. onlyIfBanned avoids removing a current member.", input: object({ chatId, userId: number(), onlyIfBanned: boolean().optional() }) },
          async (_ctx, i) => call("unbanChatMember", { chat_id: i.chatId, user_id: i.userId, only_if_banned: i.onlyIfBanned }),
        ),
        restrict: mutation(
          {
            description: "Restrict a supergroup member. permissions is a ChatPermissions object, for example { can_send_messages: false }.",
            input: object({ chatId, userId: number(), permissions: json(), untilDate: number().optional() }),
          },
          async (_ctx, i) =>
            call("restrictChatMember", { chat_id: i.chatId, user_id: i.userId, permissions: i.permissions, until_date: i.untilDate }),
        ),
        leave: mutation({ description: "Make the bot leave a chat.", input: object({ chatId }) }, async (_ctx, i) =>
          call("leaveChat", { chat_id: i.chatId }),
        ),
      },
      { title: "Chats", description: "Inspect and administer chats, members and invite links." },
    ),
    files: router(
      {
        getFile: query(
          {
            description:
              "Get file metadata and its file_path for a file_id. Download links need the bot token and are not returned by this tool. Files up to 20 MB.",
            input: object({ fileId: string({ minLength: 1 }) }),
          },
          async (_ctx, i) => call("getFile", { file_id: i.fileId }),
        ),
        getUserProfilePhotos: query(
          { description: "List a user's profile pictures.", input: object({ userId: number(), offset: number().optional(), limit: number().optional() }) },
          async (_ctx, i) => call("getUserProfilePhotos", { user_id: i.userId, offset: i.offset, limit: i.limit }),
        ),
      },
      { title: "Files", description: "File metadata and profile photos." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { telegram: telegram.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.telegram ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Telegram",
        description: "Run a Telegram bot: send and edit messages, media and polls, manage chats and members, and configure webhooks.",
        icons,
      },
    ),
  }),
);

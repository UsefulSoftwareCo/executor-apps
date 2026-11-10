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
  record,
  router,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Zoho runs nine data centers, each with its own accounts server and Mail API host.
const regions = {
  us: { accounts: "https://accounts.zoho.com", api: "https://mail.zoho.com" },
  eu: { accounts: "https://accounts.zoho.eu", api: "https://mail.zoho.eu" },
  in: { accounts: "https://accounts.zoho.in", api: "https://mail.zoho.in" },
  au: { accounts: "https://accounts.zoho.com.au", api: "https://mail.zoho.com.au" },
  jp: { accounts: "https://accounts.zoho.jp", api: "https://mail.zoho.jp" },
  ca: { accounts: "https://accounts.zohocloud.ca", api: "https://mail.zohocloud.ca" },
  sa: { accounts: "https://accounts.zoho.sa", api: "https://mail.zoho.sa" },
  ae: { accounts: "https://accounts.zoho.ae", api: "https://mail.zoho.ae" },
  cn: { accounts: "https://accounts.zoho.com.cn", api: "https://mail.zoho.com.cn" },
} as const;
type Region = keyof typeof regions;

const regionOfMethod = {
  oauthUs: "us",
  oauthEu: "eu",
  oauthIn: "in",
  oauthAu: "au",
  oauthJp: "jp",
  oauthCa: "ca",
  oauthSa: "sa",
  oauthAe: "ae",
  oauthCn: "cn",
} as const satisfies Record<string, Region>;

// Zoho has no registration endpoint: the connect page asks for the client created in the API console.
// Zoho's OAuth guide shows client_id and client_secret as parameters of the token POST (as query
// parameters in its examples) and never mentions HTTP Basic. We send them form-encoded in the body
// (client_secret_post).
// Refresh tokens are returned only for access_type=offline.
const oauth = (region: Region) =>
  oauth2({
    authorizationUrl: `${regions[region].accounts}/oauth/v2/auth`,
    tokenUrl: `${regions[region].accounts}/oauth/v2/token`,
    revocationUrl: `${regions[region].accounts}/oauth/v2/token/revoke`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopeSeparator: ",",
    scopes: [
      "ZohoMail.accounts.READ",
      "ZohoMail.messages.ALL",
      "ZohoMail.folders.ALL",
      "ZohoMail.tags.ALL",
      "ZohoMail.notes.ALL",
      "ZohoMail.tasks.ALL",
    ],
    authorizationParams: { access_type: "offline", prompt: "consent" },
  });

const Accounts = object({
  data: array(object({ accountId: string(), type: string().optional() })),
});

const zohoMail = defineProvider({
  name: "Zoho Mail",
  hosts: Object.values(regions).flatMap((region) => [region.accounts.slice(8), region.api.slice(8)]),
  auth: {
    oauthUs: oauth("us"),
    oauthEu: oauth("eu"),
    oauthIn: oauth("in"),
    oauthAu: oauth("au"),
    oauthJp: oauth("jp"),
    oauthCa: oauth("ca"),
    oauthSa: oauth("sa"),
    oauthAe: oauth("ae"),
    oauthCn: oauth("cn"),
  },
  async health({ account, fetch, signal }) {
    const region = regionOfMethod[account.method];
    const response = await fetch(`${regions[region].api}/api/accounts`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { data } = await decodeJson(response, Accounts);
    const first = data.find((item) => item.type === "ZOHO_ACCOUNT") ?? data[0];
    if (!first) throw new Error("The account has no Zoho Mail mailbox.");
    return { accountInfo: { externalId: `${region}:${first.accountId}`, displayName: `${first.accountId} (${region})` } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}/api${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  // Mail data lives under an account id. When the caller omits it, use the first mailbox.
  let cached: string | undefined;
  const accountId = async (given: string | undefined): Promise<string> => {
    if (given !== undefined) return given;
    if (cached !== undefined) return cached;
    const { data } = (await call("GET", "/accounts")) as { data?: { accountId?: string; type?: string }[] };
    const first = (data ?? []).find((item) => item.type === "ZOHO_ACCOUNT") ?? data?.[0];
    if (first?.accountId === undefined) throw new Error("This Zoho account has no mailbox.");
    cached = String(first.accountId);
    return cached;
  };
  return { call, accountId };
}

type Client = ReturnType<typeof client>;

const acct = string().optional();
const ids = array(string({ minLength: 1 }));

// PUT /accounts/{id}/updatemessage performs one operation per `mode` on messages or whole threads.
const updateInput = object({
  accountId: acct,
  messageIds: ids.optional(),
  threadIds: ids.optional(),
  folderId: string().optional(),
});

const idsOf = (list: readonly string[] | undefined) => (list === undefined ? undefined : list.map((id) => Number(id)));

function build(c: Client) {
  const update = (description: string, mode: string) =>
    mutation(
      { description: `${description} Pass messageIds, or threadIds for whole threads.`, input: updateInput, approval: always() },
      async (_ctx, input) => {
        const id = await c.accountId(input.accountId);
        if (input.messageIds === undefined && input.threadIds === undefined) throw new Error("Pass messageIds or threadIds.");
        return c.call("PUT", `/accounts/${id}/updatemessage`, {}, {
          mode,
          ...(input.messageIds === undefined ? {} : { messageId: idsOf(input.messageIds) }),
          ...(input.threadIds === undefined ? {} : { threadId: idsOf(input.threadIds) }),
          ...(input.folderId === undefined ? {} : { isFolderSpecific: true, folderId: Number(input.folderId) }),
        });
      },
    );

  const compose = object({
    accountId: acct,
    fromAddress: string({ minLength: 1 }),
    toAddress: string({ minLength: 1 }),
    ccAddress: string().optional(),
    bccAddress: string().optional(),
    subject: string().optional(),
    content: string().optional(),
    mailFormat: string().optional(),
    askReceipt: string().optional(),
  });
  const composeBody = (input: Params) => {
    const { accountId: _ignored, ...rest } = input;
    return rest as Params;
  };

  return router({
    accounts: router(
      {
        list: query({ description: "List the mailboxes of the signed-in user, with their accountId.", input: object({}) }, async () =>
          c.call("GET", "/accounts"),
        ),
        get: query(
          { description: "Retrieve one mailbox's settings (send-as addresses, forwarding, vacation reply, storage).", input: object({ accountId: acct }) },
          async (_ctx, input) => c.call("GET", `/accounts/${await c.accountId(input.accountId)}`),
        ),
      },
      { title: "Accounts", description: "Mailboxes of the signed-in Zoho user." },
    ),
    messages: router(
      {
        list: query(
          {
            description:
              "List emails in a folder, newest first. start is a 1-based position, limit 1-200. status: read, unread or all. Fields are strings.",
            input: object({
              accountId: acct,
              folderId: string().optional(),
              start: number().optional(),
              limit: number().optional(),
              status: string().optional(),
              labelId: string().optional(),
              threadId: string().optional(),
              sortBy: string().optional(),
              ascending: boolean().optional(),
              includeTo: boolean().optional(),
              includeArchive: boolean().optional(),
            }),
          },
          async (_ctx, input) =>
            c.call("GET", `/accounts/${await c.accountId(input.accountId)}/messages/view`, {
              folderId: input.folderId,
              start: input.start,
              limit: input.limit,
              status: input.status,
              labelid: input.labelId,
              threadId: input.threadId,
              sortBy: input.sortBy,
              sortorder: input.ascending,
              includeto: input.includeTo,
              includearchive: input.includeArchive,
            }),
        ),
        search: query(
          {
            description:
              "Search emails with Zoho's search syntax (see https://www.zoho.com/mail/help/search-syntax.html), for example 'entire:invoice::sender:alice@example.com'. receivedTime is a millisecond epoch cutoff.",
            input: object({
              accountId: acct,
              searchKey: string({ minLength: 1 }),
              receivedTime: number().optional(),
              start: number().optional(),
              limit: number().optional(),
              includeTo: boolean().optional(),
            }),
          },
          async (_ctx, input) =>
            c.call("GET", `/accounts/${await c.accountId(input.accountId)}/messages/search`, {
              searchKey: input.searchKey,
              receivedTime: input.receivedTime,
              start: input.start,
              limit: input.limit,
              includeto: input.includeTo,
            }),
        ),
        getMetadata: query(
          { description: "Retrieve an email's headers and metadata (subject, addresses, dates, flags).", input: object({ accountId: acct, folderId: string({ minLength: 1 }), messageId: string({ minLength: 1 }) }) },
          async (_ctx, input) =>
            c.call("GET", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}/messages/${encodeURIComponent(input.messageId)}/details`),
        ),
        getContent: query(
          {
            description: "Retrieve an email's HTML body. includeBlockContent also returns quoted text.",
            input: object({ accountId: acct, folderId: string({ minLength: 1 }), messageId: string({ minLength: 1 }), includeBlockContent: boolean().optional() }),
          },
          async (_ctx, input) =>
            c.call(
              "GET",
              `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}/messages/${encodeURIComponent(input.messageId)}/content`,
              { includeBlockContent: input.includeBlockContent },
            ),
        ),
        getHeaders: query(
          { description: "Retrieve an email's raw header block.", input: object({ accountId: acct, folderId: string({ minLength: 1 }), messageId: string({ minLength: 1 }) }) },
          async (_ctx, input) =>
            c.call("GET", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}/messages/${encodeURIComponent(input.messageId)}/header`),
        ),
        getAttachmentInfo: query(
          { description: "List an email's attachments (names, sizes, attachmentId).", input: object({ accountId: acct, folderId: string({ minLength: 1 }), messageId: string({ minLength: 1 }) }) },
          async (_ctx, input) =>
            c.call("GET", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}/messages/${encodeURIComponent(input.messageId)}/attachmentinfo`),
        ),
        send: mutation(
          {
            description:
              "Send an email. fromAddress must belong to the account; toAddress, ccAddress and bccAddress take comma-separated addresses. mailFormat is html (default) or plaintext; askReceipt is yes or no.",
            input: compose,
            approval: always(),
          },
          async (_ctx, input) => c.call("POST", `/accounts/${await c.accountId(input.accountId)}/messages`, {}, composeBody(input)),
        ),
        saveDraft: mutation(
          {
            description: "Save an email as a draft without sending it. Takes the same fields as send.",
            input: compose,
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("POST", `/accounts/${await c.accountId(input.accountId)}/messages`, {}, { ...composeBody(input), mode: "draft" }),
        ),
        reply: mutation(
          {
            description: "Reply to an email by messageId. Takes the same fields as send; fromAddress and toAddress are required.",
            input: object({ accountId: acct, messageId: string({ minLength: 1 }), fromAddress: string({ minLength: 1 }), toAddress: string({ minLength: 1 }), ccAddress: string().optional(), bccAddress: string().optional(), subject: string().optional(), content: string().optional(), mailFormat: string().optional(), askReceipt: string().optional() }),
            approval: always(),
          },
          async (_ctx, input) => {
            const { accountId, messageId, ...rest } = input;
            return c.call("POST", `/accounts/${await c.accountId(accountId)}/messages/${encodeURIComponent(messageId)}`, {}, { ...rest, action: "reply" });
          },
        ),
        markRead: update("Mark emails as read.", "markAsRead"),
        markUnread: update("Mark emails as unread.", "markAsUnread"),
        archive: update("Archive emails.", "archiveMails"),
        markSpam: update("Move emails to spam.", "moveToSpam"),
        flag: mutation(
          {
            description: "Set a flag on emails or threads: info, important, followup or flag_not_set.",
            input: object({ accountId: acct, messageIds: ids.optional(), threadIds: ids.optional(), flagId: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, input) => {
            if (input.messageIds === undefined && input.threadIds === undefined) throw new Error("Pass messageIds or threadIds.");
            return c.call("PUT", `/accounts/${await c.accountId(input.accountId)}/updatemessage`, {}, {
              mode: "setFlag",
              flagid: input.flagId,
              ...(input.messageIds === undefined ? {} : { messageId: idsOf(input.messageIds) }),
              ...(input.threadIds === undefined ? {} : { threadId: idsOf(input.threadIds) }),
            });
          },
        ),
        move: mutation(
          {
            description: "Move emails (or whole threads) to another folder.",
            input: object({ accountId: acct, messageIds: ids.optional(), threadIds: ids.optional(), destFolderId: string({ minLength: 1 }), folderId: string().optional() }),
            approval: always(),
          },
          async (_ctx, input) => {
            if (input.messageIds === undefined && input.threadIds === undefined) throw new Error("Pass messageIds or threadIds.");
            return c.call("PUT", `/accounts/${await c.accountId(input.accountId)}/updatemessage`, {}, {
              mode: "moveMessage",
              destfolderId: Number(input.destFolderId),
              ...(input.messageIds === undefined ? {} : { messageId: idsOf(input.messageIds) }),
              ...(input.threadIds === undefined ? {} : { threadId: idsOf(input.threadIds) }),
              ...(input.folderId === undefined ? {} : { isFolderSpecific: true, folderId: Number(input.folderId) }),
            });
          },
        ),
        applyLabel: mutation(
          {
            description: "Apply labels to emails or threads.",
            input: object({ accountId: acct, messageIds: ids.optional(), threadIds: ids.optional(), labelIds: ids }),
            approval: always(),
          },
          async (_ctx, input) => {
            if (input.messageIds === undefined && input.threadIds === undefined) throw new Error("Pass messageIds or threadIds.");
            return c.call("PUT", `/accounts/${await c.accountId(input.accountId)}/updatemessage`, {}, {
              mode: "applyLabel",
              labelId: idsOf(input.labelIds),
              ...(input.messageIds === undefined ? {} : { messageId: idsOf(input.messageIds) }),
              ...(input.threadIds === undefined ? {} : { threadId: idsOf(input.threadIds) }),
            });
          },
        ),
        delete: mutation(
          {
            description: "Delete an email. It moves to Trash unless expunge is true, which deletes it permanently.",
            input: object({ accountId: acct, folderId: string({ minLength: 1 }), messageId: string({ minLength: 1 }), expunge: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call(
              "DELETE",
              `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}/messages/${encodeURIComponent(input.messageId)}`,
              { expunge: input.expunge },
            ),
        ),
      },
      { title: "Messages", description: "Send, read, search and organize email." },
    ),
    folders: router(
      {
        list: query({ description: "List all folders with their folderId.", input: object({ accountId: acct }) }, async (_ctx, input) =>
          c.call("GET", `/accounts/${await c.accountId(input.accountId)}/folders`),
        ),
        get: query(
          { description: "Retrieve one folder.", input: object({ accountId: acct, folderId: string({ minLength: 1 }) }) },
          async (_ctx, input) => c.call("GET", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}`),
        ),
        create: mutation(
          {
            description: "Create a folder. folderName must be unique and use letters only.",
            input: object({ accountId: acct, folderName: string({ minLength: 1 }), parentFolderId: string().optional() }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("POST", `/accounts/${await c.accountId(input.accountId)}/folders`, {}, {
              folderName: input.folderName,
              ...(input.parentFolderId === undefined ? {} : { parentFolderId: Number(input.parentFolderId) }),
            }),
        ),
        rename: mutation(
          {
            description: "Rename a folder.",
            input: object({ accountId: acct, folderId: string({ minLength: 1 }), folderName: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("PUT", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}`, {}, { mode: "rename", folderName: input.folderName }),
        ),
        markRead: mutation(
          { description: "Mark every email in a folder as read.", input: object({ accountId: acct, folderId: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, input) =>
            c.call("PUT", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}`, {}, { mode: "markAsRead" }),
        ),
        delete: mutation(
          { description: "Delete a folder and its emails.", input: object({ accountId: acct, folderId: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, input) =>
            c.call("DELETE", `/accounts/${await c.accountId(input.accountId)}/folders/${encodeURIComponent(input.folderId)}`),
        ),
      },
      { title: "Folders", description: "Mail folders." },
    ),
    labels: router(
      {
        list: query({ description: "List labels with their labelId.", input: object({ accountId: acct }) }, async (_ctx, input) =>
          c.call("GET", `/accounts/${await c.accountId(input.accountId)}/labels`),
        ),
        create: mutation(
          {
            description: "Create a label. color is a hex value such as #ffd700.",
            input: object({ accountId: acct, displayName: string({ minLength: 1 }), color: string().optional() }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("POST", `/accounts/${await c.accountId(input.accountId)}/labels`, {}, {
              displayName: input.displayName,
              ...(input.color === undefined ? {} : { color: input.color }),
            }),
        ),
        delete: mutation(
          { description: "Delete a label.", input: object({ accountId: acct, labelId: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, input) =>
            c.call("DELETE", `/accounts/${await c.accountId(input.accountId)}/labels/${encodeURIComponent(input.labelId)}`),
        ),
      },
      { title: "Labels", description: "Labels (tags) for emails." },
    ),
    notes: router(
      {
        list: query(
          {
            description: "List personal notes, or a group's notes when groupId is given. limit 1-399; after is a 1-based position.",
            input: object({ groupId: string().optional(), fields: string().optional(), after: number().optional(), limit: number().optional(), ascending: boolean().optional() }),
          },
          async (_ctx, input) =>
            c.call("GET", input.groupId === undefined ? "/notes/me" : `/notes/groups/${encodeURIComponent(input.groupId)}`, {
              fields: input.fields,
              after: input.after,
              limit: input.limit,
              isPrev: input.ascending,
            }),
        ),
        get: query(
          { description: "Retrieve one note.", input: object({ noteId: string({ minLength: 1 }), groupId: string().optional() }) },
          async (_ctx, input) =>
            c.call("GET", `${input.groupId === undefined ? "/notes/me" : `/notes/groups/${encodeURIComponent(input.groupId)}`}/${encodeURIComponent(input.noteId)}`),
        ),
        create: mutation(
          {
            description: "Create a note. color: 0 blue, 1 green, 2 yellow, 3 red.",
            input: object({ groupId: string().optional(), content: string({ minLength: 1 }), title: string().optional(), color: number().optional(), bookId: string().optional() }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("POST", input.groupId === undefined ? "/notes/me" : `/notes/groups/${encodeURIComponent(input.groupId)}`, {}, {
              content: input.content,
              ...(input.title === undefined ? {} : { title: input.title }),
              ...(input.color === undefined ? {} : { color: input.color }),
              ...(input.bookId === undefined ? {} : { bookId: Number(input.bookId) }),
            }),
        ),
        delete: mutation(
          { description: "Delete a note.", input: object({ noteId: string({ minLength: 1 }), groupId: string().optional() }), approval: always() },
          async (_ctx, input) =>
            c.call("DELETE", `${input.groupId === undefined ? "/notes/me" : `/notes/groups/${encodeURIComponent(input.groupId)}`}/${encodeURIComponent(input.noteId)}`),
        ),
      },
      { title: "Notes", description: "Zoho Mail notes." },
    ),
    tasks: router(
      {
        list: query(
          {
            description: "List personal tasks, or a group's tasks when groupId (zgid) is given. limit 1-499; from is a 0-based index.",
            input: object({ groupId: string().optional(), from: number().optional(), limit: number().optional() }),
          },
          async (_ctx, input) =>
            c.call("GET", input.groupId === undefined ? "/tasks/me" : `/tasks/groups/${encodeURIComponent(input.groupId)}`, { from: input.from, limit: input.limit }),
        ),
        get: query(
          { description: "Retrieve one task.", input: object({ taskId: string({ minLength: 1 }), groupId: string().optional() }) },
          async (_ctx, input) =>
            c.call("GET", `${input.groupId === undefined ? "/tasks/me" : `/tasks/groups/${encodeURIComponent(input.groupId)}`}/${encodeURIComponent(input.taskId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a task, personal or in a group (groupId). status: inprogress or completed. priority: high, medium or low. dueDate is DD/MM/YYYY. extra takes any further documented body field such as reminderDate or recurringType.",
            input: object({
              groupId: string().optional(),
              title: string({ minLength: 1 }),
              description: string().optional(),
              status: string().optional(),
              priority: string().optional(),
              dueDate: string().optional(),
              projectId: string().optional(),
              extra: record(json()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) =>
            c.call("POST", input.groupId === undefined ? "/tasks/me" : `/tasks/groups/${encodeURIComponent(input.groupId)}`, {}, {
              ...(input.extra ?? {}),
              title: input.title,
              ...(input.description === undefined ? {} : { description: input.description }),
              ...(input.status === undefined ? {} : { status: input.status }),
              ...(input.priority === undefined ? {} : { priority: input.priority }),
              ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
              ...(input.projectId === undefined ? {} : { projectId: Number(input.projectId) }),
            }),
        ),
      },
      { title: "Tasks", description: "Zoho Mail tasks." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { zohoMail: zohoMail.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zohoMail ?? [],
        (account) => build(client(regions[regionOfMethod[account.method]].api, account.fields.access_token, fetch, signal)),
        { signal },
      ),
      {
        title: "Zoho Mail",
        description: "Send, read, search and organize Zoho Mail email, folders, labels, notes and tasks.",
        instructions:
          "Ids (accountId, folderId, messageId, labelId) are strings. accountId is optional everywhere and defaults to the user's first mailbox; list accounts to see others. Get folderId from folders.list and messageId from messages.list or messages.search. Mail list calls page with start and limit.",
        icons,
      },
    ),
  }),
);

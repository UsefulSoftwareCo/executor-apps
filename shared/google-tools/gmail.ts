// Gmail tools shaped for agents: search returns readable thread summaries across every linked
// account, reads return decoded text, and writes take plain fields instead of raw MIME.
import { array, boolean, mutation, number, object, query, string } from "apps";
import { always } from "apps/operations/approval";
import {
  base64Lines,
  base64url,
  decodeBody,
  defined,
  encodeHeader,
  fanOut,
  google,
  GoogleError,
  htmlToText,
  mapLimit,
  pathId,
  select,
  single,
  type Base,
  type Context,
  type Source,
  type Target,
  type WriteContext,
} from "./shared.js";

const base = "https://gmail.googleapis.com/gmail/v1/users/me";
const account = string().optional();

interface Part {
  readonly mimeType?: string;
  readonly filename?: string;
  readonly headers?: readonly { readonly name: string; readonly value: string }[];
  readonly body?: { readonly data?: string; readonly size?: number; readonly attachmentId?: string };
  readonly parts?: readonly Part[];
}
interface Message {
  readonly id: string;
  readonly threadId: string;
  readonly labelIds?: readonly string[];
  readonly snippet?: string;
  readonly internalDate?: string;
  readonly payload?: Part;
}

const header = (part: Part | undefined, name: string) =>
  part?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

const charset = (part: Part) => /charset="?([^";]+)"?/i.exec(header(part, "Content-Type") ?? "")?.[1];

/** The message text: its text/plain part, else its HTML part as text. Attachments are listed, not read. */
const content = (payload: Part | undefined) => {
  let plain: string | undefined;
  let html: string | undefined;
  const attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[] = [];
  const walk = (part: Part) => {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        size: part.body.size ?? 0,
        attachmentId: part.body.attachmentId,
      });
      return;
    }
    if (part.body?.data && part.mimeType === "text/plain" && plain === undefined) plain = decodeBody(part.body.data, charset(part));
    if (part.body?.data && part.mimeType === "text/html" && html === undefined) html = decodeBody(part.body.data, charset(part));
    for (const child of part.parts ?? []) walk(child);
  };
  if (payload) walk(payload);
  return { body: (plain ?? (html === undefined ? "" : htmlToText(html))).trim(), attachments };
};

/** Label IDs to names; system labels keep their IDs (INBOX, UNREAD, STARRED...). */
const labelNames = async (ctx: Base, target: Target) => {
  const { labels = [] } = await google(ctx, target, `${base}/labels`);
  return new Map<string, string>((labels as { id: string; name: string }[]).map((label) => [label.id, label.name]));
};

const summary = (target: Target, message: Message, names: Map<string, string>) => ({
  account: target.email,
  messageId: message.id,
  threadId: message.threadId,
  from: header(message.payload, "From") ?? "",
  to: header(message.payload, "To") ?? "",
  subject: header(message.payload, "Subject") ?? "",
  date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : "",
  snippet: message.snippet ?? "",
  unread: message.labelIds?.includes("UNREAD") ?? false,
  labels: (message.labelIds ?? []).filter((id) => id !== "UNREAD").map((id) => names.get(id) ?? id),
});

const full = (target: Target, message: Message, names: Map<string, string>) => ({
  ...summary(target, message, names),
  cc: header(message.payload, "Cc") ?? "",
  replyTo: header(message.payload, "Reply-To") ?? "",
  ...content(message.payload),
});

/** Resolves label names or IDs, case-insensitively, to IDs. */
const labelIds = (names: Map<string, string>, wanted: readonly string[]) => {
  const byName = new Map([...names].map(([id, name]) => [name.toLowerCase(), id]));
  return wanted.map((label) => {
    const id = names.has(label) ? label : byName.get(label.toLowerCase());
    if (id === undefined) throw new Error(`No Gmail label named ${label}. Create it first, or list labels with gmail.labels.`);
    return id;
  });
};

const Compose = {
  account,
  to: array(string()).optional(),
  cc: array(string()).optional(),
  bcc: array(string()).optional(),
  subject: string().optional(),
  body: string(),
  html: boolean().optional(),
  replyToMessageId: string().optional(),
  replyAll: boolean().optional(),
  from: string().optional(),
};
type ComposeInput = {
  readonly account?: string;
  readonly to?: readonly string[];
  readonly cc?: readonly string[];
  readonly bcc?: readonly string[];
  readonly subject?: string;
  readonly body: string;
  readonly html?: boolean;
  readonly replyToMessageId?: string;
  readonly replyAll?: boolean;
  readonly from?: string;
};

const addresses = (value: string | undefined) =>
  (value ?? "")
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((item) => item.trim())
    .filter(Boolean);
const bare = (address: string) => (/<([^>]+)>/.exec(address)?.[1] ?? address).trim().toLowerCase();

/** The reply headers that tie a message to the one it answers. */
interface ReplyHeaders {
  readonly inReplyTo?: string;
  readonly references?: string;
}

/**
 * Builds the RFC 2822 message. A reply takes the original's thread, subject and references, and
 * addresses its sender (and, with replyAll, everyone else on it except this account). `kept` carries
 * a reply draft's existing reply headers when no replyToMessageId is given.
 */
const compose = async (ctx: Base, target: Target, input: ComposeInput, kept: ReplyHeaders = {}) => {
  let to = [...(input.to ?? [])];
  let cc = [...(input.cc ?? [])];
  let subject = input.subject;
  let threadId: string | undefined;
  let threadSubject: string | undefined;
  let reply = kept;
  if (input.replyToMessageId) {
    const original: Message = await google(ctx, target, `${base}/messages/${pathId("replyToMessageId", input.replyToMessageId)}`, {
      search: { format: "metadata", metadataHeaders: ["From", "To", "Cc", "Subject", "Message-ID", "References", "Reply-To"] },
    });
    threadId = original.threadId;
    const messageId = header(original.payload, "Message-ID");
    reply = messageId ? { inReplyTo: messageId, references: [header(original.payload, "References"), messageId].filter(Boolean).join(" ") } : {};
    const originalSubject = header(original.payload, "Subject") ?? "";
    threadSubject = originalSubject;
    subject ??= /^re:/i.test(originalSubject) ? originalSubject : `Re: ${originalSubject}`;
    const self = target.email.toLowerCase();
    const sender = header(original.payload, "Reply-To") ?? header(original.payload, "From") ?? "";
    // Replying to your own message goes back to its recipients.
    const fromSelf = bare(header(original.payload, "From") ?? "") === self;
    if (to.length === 0) to = fromSelf ? addresses(header(original.payload, "To")) : addresses(sender);
    if (input.replyAll) {
      const already = new Set([...to, ...cc].map(bare));
      for (const address of [...addresses(header(original.payload, "To")), ...addresses(header(original.payload, "Cc"))]) {
        if (bare(address) === self || already.has(bare(address))) continue;
        already.add(bare(address));
        cc.push(address);
      }
    }
  }
  const lines = [
    ...(input.from ? [`From: ${input.from}`] : []),
    ...(to.length ? [`To: ${to.join(", ")}`] : []),
    ...(cc.length ? [`Cc: ${cc.join(", ")}`] : []),
    ...(input.bcc?.length ? [`Bcc: ${input.bcc.join(", ")}`] : []),
    `Subject: ${encodeHeader(subject ?? "")}`,
    ...(reply.inReplyTo ? [`In-Reply-To: ${reply.inReplyTo}`] : []),
    ...(reply.references ? [`References: ${reply.references}`] : []),
    "MIME-Version: 1.0",
    `Content-Type: ${input.html ? "text/html" : "text/plain"}; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(input.body),
  ];
  return { raw: base64url(lines.join("\r\n")), threadId, threadSubject, reply, to, cc, subject: subject ?? "" };
};

/** Matching threads across targets, newest first, each summarised by its latest message. */
export const searchMail = async (ctx: Base, targets: readonly Target[], q: string, max: number) => {
  const { items, errors } = await fanOut(targets, async (target) => {
    const [{ threads = [] }, names] = await Promise.all([
      google(ctx, target, `${base}/threads`, { search: { q, maxResults: max } }),
      labelNames(ctx, target),
    ]);
    return mapLimit(threads as { id: string }[], 10, async ({ id }) => {
      const thread: { messages?: Message[] } = await google(ctx, target, `${base}/threads/${pathId("threadId", id)}`, {
        search: { format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] },
      });
      const messages = thread.messages ?? [];
      const latest = messages.at(-1)!;
      return {
        ...summary(target, latest, names),
        messageCount: messages.length,
        unread: messages.some((message) => message.labelIds?.includes("UNREAD")),
      };
    });
  });
  items.sort((a, b) => b.date.localeCompare(a.date));
  return { threads: items.slice(0, max), errors };
};

/**
 * Runs a send. A refusal (4xx) means nothing went out and is reported as it is; anything else (a
 * 5xx, a dropped connection, a cancelled call) leaves it unknown whether Gmail sent the message, so
 * the error says to check before retrying rather than risk sending twice.
 */
const uncertain = async <T>(check: string, run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof GoogleError && error.status < 500) throw error;
    throw new Error(
      `Gmail did not confirm the send${error instanceof GoogleError ? ` (it answered ${error.status})` : ""}, so the message may or may not have gone. Before retrying, ${check}, so it is not sent twice.`,
    );
  }
};

const subjectKey = (subject: string | undefined) =>
  (subject ?? "").replace(/^(\s*(re|fwd?|aw|sv)\s*:\s*)+/i, "").replace(/\s+/g, " ").trim().toLowerCase();

/** A short hash of a draft's raw MIME message, which binds a send to the exact bytes approved. */
const version = async (raw: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)))]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const excerptLength = 1000;
const listedAttachments = 20;

/**
 * What sending a draft would send, read from Gmail now: the fields its approval shows, and the raw
 * message they were read from. Both reads must name the same message, or the draft changed between
 * them.
 */
const draftPreview = async (ctx: Base, target: Target, draftId: string) => {
  const url = `${base}/drafts/${pathId("draftId", draftId)}`;
  const hints = { 404: "No such draft: it may have been sent or deleted already. List drafts with gmail.drafts." };
  const [full, raw]: { message: Message & { raw?: string } }[] = await Promise.all([
    google(ctx, target, url, { search: { format: "full" }, hints }),
    google(ctx, target, url, { search: { format: "raw" }, hints }),
  ]);
  if (full.message.id !== raw.message.id || raw.message.raw === undefined)
    throw new Error("The draft changed while it was being read. Read it again.");
  const { body, attachments } = content(full.message.payload);
  const payload = full.message.payload;
  return {
    message: full.message,
    raw: raw.message.raw,
    body,
    attachments,
    send: {
      account: target.email,
      draftId,
      from: header(payload, "From") ?? "(not set: the account's default address)",
      to: header(payload, "To") ?? "",
      cc: header(payload, "Cc") ?? "",
      bcc: header(payload, "Bcc") ?? "",
      subject: header(payload, "Subject") ?? "",
      excerpt: body.length > excerptLength ? `${body.slice(0, excerptLength)}…` : body,
      bodyLength: body.length,
      attachments: [
        ...attachments.slice(0, listedAttachments).map((a) => `${a.filename} (${a.mimeType}, ${a.size} bytes)`),
        ...(attachments.length > listedAttachments ? [`and ${attachments.length - listedAttachments} more`] : []),
      ],
      version: await version(raw.message.raw),
    },
  };
};

/** The fields sendDraft's approval shows, in the order readDraft returns them. */
const SendFields = {
  account: string({ minLength: 1 }),
  draftId: string({ minLength: 1 }),
  from: string(),
  to: string(),
  cc: string(),
  bcc: string(),
  subject: string(),
  excerpt: string(),
  bodyLength: number(),
  attachments: array(string()),
  version: string({ minLength: 1 }),
};

/** The curated tools and their router's metadata; `source` names the package's accounts. */
export const gmail = (source: Source) => ({
  tools: {
    search: query(
      {
        description:
          "Search mail with Gmail search syntax (from:, to:, subject:, is:unread, has:attachment, newer_than:7d, label:, in:inbox...) across every linked Google account, or one. Returns matching threads, newest first, each with its latest message's sender, subject, date and snippet. Read one with readThread.",
        input: object({
          query: string(),
          account,
          max: number().optional(),
        }),
      },
      async (ctx: Context, input) =>
        searchMail(ctx, await select(ctx, source, input.account), input.query, Math.min(Math.max(input.max ?? 20, 1), 100)),
    ),
    readThread: query(
      {
        description: "Read a whole thread as decoded text: every message's headers, body and attachment list, oldest first.",
        input: object({ account, threadId: string({ minLength: 1 }) }),
      },
      async (ctx: Context, input) => {
        const url = `${base}/threads/${pathId("threadId", input.threadId)}`;
        const target = await single(ctx, source, input.account);
        const [thread, names] = await Promise.all([
          google(ctx, target, url, { search: { format: "full" } }),
          labelNames(ctx, target),
        ]);
        return { account: target.email, threadId: input.threadId, messages: ((thread.messages ?? []) as Message[]).map((m) => full(target, m, names)) };
      },
    ),
    readMessage: query(
      {
        description: "Read one message as decoded text: headers, body (HTML converted to text) and attachment list.",
        input: object({ account, messageId: string({ minLength: 1 }) }),
      },
      async (ctx: Context, input) => {
        const url = `${base}/messages/${pathId("messageId", input.messageId)}`;
        const target = await single(ctx, source, input.account);
        const [message, names] = await Promise.all([
          google(ctx, target, url, { search: { format: "full" } }),
          labelNames(ctx, target),
        ]);
        return full(target, message, names);
      },
    ),
    labels: query(
      {
        description: "List each account's labels with their unread and total counts.",
        input: object({ account }),
      },
      async (ctx: Context, input) =>
        fanOut(await select(ctx, source, input.account), async (target) => {
          const { labels = [] } = await google(ctx, target, `${base}/labels`);
          return mapLimit(labels as { id: string; name: string; type: string }[], 10, async (label) => {
            const detail = await google(ctx, target, `${base}/labels/${pathId("labelId", label.id)}`);
            return {
              account: target.email,
              id: label.id,
              name: label.name,
              type: label.type,
              unreadThreads: detail.threadsUnread ?? 0,
              threads: detail.threadsTotal ?? 0,
            };
          });
        }).then(({ items, errors }) => ({ labels: items, errors })),
    ),
    send: mutation(
      {
        description:
          "Send an email. For a reply, pass replyToMessageId: it stays in the thread, gets a Re: subject and goes to the original sender unless `to` is given; replyAll also copies the other recipients. `from` must be one of the account's send-as aliases.",
        input: object(Compose),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        if (input.replyToMessageId !== undefined) pathId("replyToMessageId", input.replyToMessageId);
        const target = await single(ctx, source, input.account);
        const message = await compose(ctx, target, input);
        if (message.to.length === 0 && message.cc.length === 0 && !input.bcc?.length) throw new Error("Pass at least one recipient.");
        const sent = await uncertain("search Sent (gmail.search with in:sent) for it", () =>
          google(ctx, target, `${base}/messages/send`, {
            method: "POST",
            body: { raw: message.raw, ...(message.threadId ? { threadId: message.threadId } : {}) },
          }),
        );
        return { account: target.email, messageId: sent.id, threadId: sent.threadId, to: message.to, cc: message.cc, subject: message.subject };
      },
    ),
    draft: mutation(
      {
        description:
          "Save a draft without sending it. Takes the same fields as send, and recipients may be left out. List drafts with drafts; change, send or delete one with updateDraft, sendDraft or deleteDraft.",
        input: object(Compose),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        if (input.replyToMessageId !== undefined) pathId("replyToMessageId", input.replyToMessageId);
        const target = await single(ctx, source, input.account);
        const message = await compose(ctx, target, input);
        const draft = await google(ctx, target, `${base}/drafts`, {
          method: "POST",
          body: { message: { raw: message.raw, ...(message.threadId ? { threadId: message.threadId } : {}) } },
        });
        return { account: target.email, draftId: draft.id, messageId: draft.message?.id, threadId: draft.message?.threadId };
      },
    ),
    drafts: query(
      {
        description:
          "List drafts across every linked Google account (or one), newest first, with their recipients, subject and snippet. query takes Gmail search syntax. Read one in full with readDraft.",
        input: object({ account, query: string().optional(), max: number().optional() }),
      },
      async (ctx: Context, input) => {
        const max = Math.min(Math.max(input.max ?? 20, 1), 100);
        const { items, errors } = await fanOut(await select(ctx, source, input.account), async (target) => {
          const { drafts = [] } = await google(ctx, target, `${base}/drafts`, { search: { q: input.query, maxResults: max } });
          return mapLimit(drafts as { id: string }[], 10, async ({ id }) => {
            const draft: { id: string; message: Message } = await google(ctx, target, `${base}/drafts/${pathId("draftId", id)}`, {
              search: { format: "metadata" },
            });
            const message = draft.message;
            return {
              account: target.email,
              draftId: draft.id,
              messageId: message.id,
              threadId: message.threadId,
              to: header(message.payload, "To") ?? "",
              cc: header(message.payload, "Cc") ?? "",
              subject: header(message.payload, "Subject") ?? "",
              date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : "",
              snippet: message.snippet ?? "",
            };
          });
        });
        items.sort((a, b) => b.date.localeCompare(a.date));
        return { drafts: items.slice(0, max), errors };
      },
    ),
    readDraft: query(
      {
        description:
          "Read a draft as it would be sent: account, From, To, Cc, Bcc, subject, body and attachments. Its `send` field is sendDraft's input: pass it unchanged, so the person approving the send sees what will go out.",
        input: object({ account, draftId: string({ minLength: 1 }) }),
      },
      async (ctx: Context, input) => {
        pathId("draftId", input.draftId);
        const target = await single(ctx, source, input.account);
        const draft = await draftPreview(ctx, target, input.draftId);
        return {
          account: target.email,
          draftId: input.draftId,
          messageId: draft.message.id,
          threadId: draft.message.threadId,
          from: draft.send.from,
          to: draft.send.to,
          cc: draft.send.cc,
          bcc: draft.send.bcc,
          subject: draft.send.subject,
          body: draft.body,
          attachments: draft.attachments,
          send: draft.send,
        };
      },
    ),
    updateDraft: mutation(
      {
        description:
          "Replace a draft's content with new fields, as draft takes them. The draft is rewritten whole, so pass every field it should keep (recipients, subject, body). A reply draft keeps its reply headers (In-Reply-To, References) and its thread, but Gmail shows it in that conversation only while its subject still matches the thread's: the result has a warning when it may not.",
        input: object({ ...Compose, draftId: string({ minLength: 1 }) }),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        const url = `${base}/drafts/${pathId("draftId", input.draftId)}`;
        if (input.replyToMessageId !== undefined) pathId("replyToMessageId", input.replyToMessageId);
        const target = await single(ctx, source, input.account);
        const current: { message?: Message } = await google(ctx, target, url, {
          search: { format: "metadata", metadataHeaders: ["Subject", "In-Reply-To", "References"] },
          hints: { 404: "No such draft: it may have been sent or deleted already. List drafts with gmail.drafts." },
        });
        const existing = current.message?.payload;
        const line = (name: string) => header(existing, name)?.replace(/[\r\n]+/g, " ");
        const message = await compose(ctx, target, input, { inReplyTo: line("In-Reply-To"), references: line("References") });
        const threadId = message.threadId ?? current.message?.threadId;
        const draft = await google(ctx, target, url, {
          method: "PUT",
          body: { id: input.draftId, message: { raw: message.raw, ...(threadId ? { threadId } : {}) } },
        });
        // Only a reply draft is tied to a conversation; any other draft has a thread of its own.
        const threadSubject = message.threadSubject ?? header(existing, "Subject");
        const isReply = message.reply.inReplyTo !== undefined || message.reply.references !== undefined;
        const warning =
          isReply && subjectKey(message.subject) !== subjectKey(threadSubject)
            ? `The subject no longer matches the thread's ("${threadSubject ?? ""}"), so Gmail may show this draft as a new conversation instead of in its thread.`
            : undefined;
        return defined({ account: target.email, draftId: draft.id, messageId: draft.message?.id, threadId: draft.message?.threadId, warning });
      },
    ),
    sendDraft: mutation(
      {
        description:
          "Send a saved draft. Read it with readDraft first and pass its `send` field unchanged: the person approving sees the account, From, To, Cc, Bcc, subject, the start of the body and the attachments. If the draft has changed since it was read, nothing is sent: read it again and ask for approval of what it now says.",
        input: object(SendFields),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        pathId("draftId", input.draftId);
        const target = await single(ctx, source, input.account);
        const now = await draftPreview(ctx, target, input.draftId);
        const changed = (Object.keys(SendFields) as (keyof typeof SendFields)[]).filter(
          (field) => JSON.stringify(input[field]) !== JSON.stringify(now.send[field]),
        );
        if (changed.length > 0)
          throw new Error(
            `Nothing was sent: the draft is not what was approved (${changed.join(", ")} differ). It may have been edited since it was read. Read it again with readDraft and ask for approval of what it now says.`,
          );
        // Sending the raw message that was just checked means the bytes approved are the bytes sent,
        // even if the draft is edited again from here on.
        const sent = await uncertain("check Sent (gmail.search with in:sent) and whether gmail.drafts still lists the draft", () =>
          google(ctx, target, `${base}/drafts/send`, {
            method: "POST",
            body: { id: input.draftId, message: { raw: now.raw, ...(now.message.threadId ? { threadId: now.message.threadId } : {}) } },
            hints: { 404: "No such draft: it may have been sent or deleted already. Check Sent and gmail.drafts." },
          }),
        );
        return { account: target.email, draftId: input.draftId, messageId: sent.id, threadId: sent.threadId };
      },
    ),
    deleteDraft: mutation(
      {
        description: "Delete a draft permanently. It does not go to Trash and cannot be recovered.",
        input: object({ account, draftId: string({ minLength: 1 }) }),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        const url = `${base}/drafts/${pathId("draftId", input.draftId)}`;
        const target = await single(ctx, source, input.account);
        await google(ctx, target, url, {
          method: "DELETE",
          hints: { 404: "No such draft: it may have been sent or deleted already. List drafts with gmail.drafts." },
        });
        return { account: target.email, draftId: input.draftId, deleted: true };
      },
    ),
    modify: mutation(
      {
        description:
          "Change threads: archive (leave the inbox), mark read or unread, star or unstar, move to trash, and add or remove labels by name. Applies to every message in each thread.",
        input: object({
          account,
          threadIds: array(string({ minLength: 1 })),
          archive: boolean().optional(),
          read: boolean().optional(),
          starred: boolean().optional(),
          trash: boolean().optional(),
          addLabels: array(string()).optional(),
          removeLabels: array(string()).optional(),
        }),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        const threads = input.threadIds.map((id) => pathId("threadId", id));
        const target = await single(ctx, source, input.account);
        const names = await labelNames(ctx, target);
        const add = labelIds(names, input.addLabels ?? []);
        const remove = labelIds(names, input.removeLabels ?? []);
        if (input.archive) remove.push("INBOX");
        if (input.read === true) remove.push("UNREAD");
        if (input.read === false) add.push("UNREAD");
        if (input.starred === true) add.push("STARRED");
        if (input.starred === false) remove.push("STARRED");
        await mapLimit(threads, 10, async (thread) => {
          if (input.trash) await google(ctx, target, `${base}/threads/${thread}/trash`, { method: "POST" });
          if (add.length || remove.length)
            await google(ctx, target, `${base}/threads/${thread}/modify`, {
              method: "POST",
              body: { addLabelIds: add, removeLabelIds: remove },
            });
        });
        return { account: target.email, threads: input.threadIds.length, added: add, removed: remove, trashed: input.trash ?? false };
      },
    ),
    attachment: query(
      {
        description:
          "Read an attachment listed by readMessage or readThread. Text attachments (text/*, JSON, CSV, XML) come back as text; others as base64.",
        input: object({ account, messageId: string({ minLength: 1 }), attachmentId: string({ minLength: 1 }), mimeType: string().optional() }),
      },
      async (ctx: Context, input) => {
        const url = `${base}/messages/${pathId("messageId", input.messageId)}/attachments/${pathId("attachmentId", input.attachmentId)}`;
        const target = await single(ctx, source, input.account);
        const { data = "", size } = await google(ctx, target, url);
        const text = /^(text\/|application\/(json|xml|csv))/.test(input.mimeType ?? "");
        return text ? { size, text: decodeBody(data) } : { size, base64: (data as string).replaceAll("-", "+").replaceAll("_", "/") };
      },
    ),
  },
  meta: {
    title: "Gmail",
    description: "Search, read and send mail across every linked Google account.",
    instructions: `search and drafts span every linked account unless \`account\` (an address) is given; their results carry the account, and reads and writes take that account. Writes need \`account\` only when several accounts are linked. The full Gmail API (filters, vacation replies, send-as aliases, label edits, history) is under ${source.api("gmail")}.`,
  },
});

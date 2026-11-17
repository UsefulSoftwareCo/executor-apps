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

interface Attachment {
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
  /** Shown in the body (an image a `cid:` link places), rather than only attached. */
  readonly inline: boolean;
  /** Set when Gmail stores the data apart, for the attachment tool; small parts carry it in the message. */
  readonly attachmentId?: string;
}

/**
 * A message's parts by what they are, not by how Gmail stores them. Each part is classified before
 * it is opened: a named part, or one marked `Content-Disposition: attachment`, is an attachment even
 * when it is a container (an attached bundle of parts is listed, not read as body). Other multipart
 * containers are opened. A part is body text only when it is text/plain or text/html, unnamed and not
 * an attachment; every other part (a file, an image, an attached message, a calendar invite...) is
 * an attachment, whether its data is in the message or stored apart under an attachmentId.
 */
const parts = (payload: Part | undefined) => {
  const plain: Part[] = [];
  const html: Part[] = [];
  const attachments: Attachment[] = [];
  const walk = (part: Part) => {
    const type = (part.mimeType ?? "").toLowerCase();
    const disposition = (header(part, "Content-Disposition") ?? "").trim().toLowerCase();
    const named = Boolean(part.filename);
    const attached = named || disposition.startsWith("attachment");
    if (!attached && type.startsWith("multipart/") && part.parts) return part.parts.forEach(walk);
    if (!attached && (type === "text/plain" || type === "text/html"))
      return (type === "text/plain" ? plain : html).push(part);
    attachments.push(
      defined({
        filename: part.filename || "(no name)",
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body?.size ?? 0,
        inline: disposition.startsWith("inline") || header(part, "Content-ID") !== undefined,
        attachmentId: part.body?.attachmentId,
      }),
    );
  };
  if (payload) walk(payload);
  return { plain, html, attachments };
};

const text = (part: Part | undefined) => (part?.body?.data ? decodeBody(part.body.data, charset(part)) : undefined);

/** The message text: its first text/plain part, else its HTML part as text. Attachments are listed, not read. */
const content = (payload: Part | undefined) => {
  const found = parts(payload);
  const plain = text(found.plain[0]);
  const html = text(found.html[0]);
  return { body: (plain ?? (html === undefined ? "" : htmlToText(html))).trim(), attachments: found.attachments };
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

// ---------------------------------------------------------------------------------------------
// What sendDraft sends: an allow-list. A draft is sent only when every header, every MIME part and
// everything in its HTML is listed in `sendable` and is shown in the approval. Anything else is
// refused, with nothing sent: the checks name what is allowed, never what is forbidden.

/**
 * Executor's approval shows a call's arguments exactly only while they print, as JSON indented by
 * two spaces, in this many characters (`approvalPreviewChars` in `apps`); longer ones are shortened.
 */
const approvalLimit = 4000;

/** Everything sendDraft accepts in a draft. sendDraft's description is written from this. */
const sendable = {
  /** Message headers the approval shows, with encoded words decoded. Each at most once. */
  shownHeaders: ["From", "Sender", "Reply-To", "To", "Cc", "Bcc", "Subject"],
  /** Message headers allowed unshown: they neither route mail nor change its sender or text. */
  quietHeaders: ["MIME-Version", "Date", "Message-ID", "In-Reply-To", "References", "Content-Type", "Content-Transfer-Encoding", "Content-Language"],
  /** Headers a part inside the message may have. */
  partHeaders: ["Content-Type", "Content-Transfer-Encoding", "Content-Disposition", "Content-ID", "X-Attachment-Id"],
  /** Containers that are opened, unless named or marked as an attachment. */
  containers: ["multipart/mixed", "multipart/alternative", "multipart/related"],
  /** Body text: an unnamed part of one of these types, not marked as an attachment, each at most once. */
  bodyTypes: ["text/plain", "text/html"],
  transferEncodings: ["7bit", "8bit", "binary", "base64", "quoted-printable"],
  /** Charsets text and headers are decoded from. Text without a charset must be ASCII. */
  charsets: ["utf-8", "us-ascii", "iso-8859-1", "windows-1252"],
  /** HTML elements, each with the attributes it may have. */
  elements: {
    a: ["href", "target"],
    b: [],
    blockquote: [],
    br: [],
    div: [],
    em: [],
    hr: [],
    i: [],
    img: ["src", "alt", "width", "height"],
    li: [],
    ol: [],
    p: [],
    span: [],
    strong: [],
    u: [],
    ul: [],
    wbr: [],
  } as Readonly<Record<string, readonly string[]>>,
  /** Attributes any of those elements may have, with only these values. */
  anywhere: { dir: ["ltr"], class: ["gmail_signature", "gmail_signature_prefix"], "data-smartmail": ["gmail_signature"] } as Readonly<
    Record<string, readonly string[]>
  >,
  /** Values for the element attributes above. */
  values: {
    href: "an http:, https: or mailto: address, shown as the link's `label <target>`",
    target: "_blank",
    src: "cid: naming one of the draft's inline attachments",
    alt: "text, shown as [image: alt]",
    width: "digits",
    height: "digits",
  },
  linkSchemes: ["http:", "https:", "mailto:"],
  /** Named character references; numeric ones are read too. */
  entities: { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " } as Readonly<Record<string, string>>,
} as const;

/** Elements that end a line of text, and elements with no closing tag. */
const blocks = new Set(["blockquote", "div", "hr", "li", "ol", "p", "ul"]);
const voids = new Set(["br", "hr", "img", "wbr"]);

/** A reason sendDraft will not send a draft. */
class Refusal extends Error {}
const refuse = (reason: string): never => {
  throw new Refusal(reason);
};

/**
 * Characters that hide or reorder text: controls other than tab and line breaks, format characters
 * (zero-width, bidirectional controls, invisible tags), private-use and unassigned code points, line
 * and paragraph separators, and characters drawn blank.
 */
const hiding = /(?![\t\n\r])[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Zl}\p{Zp}͏ᅟᅠㅤﾠ]/u;
const visible = (value: string, where: string) => {
  const found = hiding.exec(value);
  if (found) refuse(`${where} has a character that hides or reorders text (U+${found[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`);
  return value;
};

/** Text from bytes in one of the allowed charsets; anything else, or bytes not valid in it, is refused. */
const decodeText = (bytes: Uint8Array, charset: string, where: string) => {
  const label = charset.toLowerCase();
  if (!(sendable.charsets as readonly string[]).includes(label)) refuse(`${where} is in the ${charset} charset, which it does not read`);
  if (label === "us-ascii") {
    if (bytes.some((byte) => byte > 0x7f)) refuse(`${where} has bytes that are not ASCII but names no charset`);
    return String.fromCharCode(...bytes);
  }
  try {
    // WHATWG reads iso-8859-1 as windows-1252, as mail apps do.
    return new TextDecoder(label === "utf-8" ? "utf-8" : "windows-1252", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return refuse(`${where} is not valid ${charset}`);
  }
};

const base64Bytes = (data: string) => Uint8Array.from(atob(data.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

/** A header value with RFC 2047 encoded words decoded; an encoded word it cannot read is refused. */
const decodeWords = (value: string, where: string) => {
  const decoded = value
    .replace(/(\?=)\s+(?==\?)/g, "$1")
    .replace(/=\?([^?\s]+)\?([bq])\?([^?\s]*)\?=/gi, (_, charset: string, encoding: string, data: string) => {
      if (encoding.toLowerCase() === "b") {
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) refuse(`${where} has an encoded word it cannot read`);
        return decodeText(base64Bytes(data), charset, where);
      }
      if (!/^(?:[!-<>@-~]|=[0-9A-Fa-f]{2})*$/.test(data.replaceAll("_", " ").replaceAll(" ", "!"))) refuse(`${where} has an encoded word it cannot read`);
      const bytes: number[] = [];
      for (let at = 0; at < data.length; at++)
        if (data[at] === "=") bytes.push(parseInt(data.slice(at + 1, (at += 2) + 1), 16));
        else bytes.push(data[at] === "_" ? 0x20 : data.charCodeAt(at));
      return decodeText(Uint8Array.from(bytes), charset, where);
    });
  if (decoded.includes("=?")) refuse(`${where} has an encoded word it cannot read`);
  return visible(decoded, where);
};

/** A MIME header value's token and parameters (RFC 2045); any other form is refused. */
const mimeValue = (value: string, where: string) => {
  const head = /^\s*([^\s;"]+)\s*/.exec(value) ?? refuse(`${where} is not in a form it reads`);
  const params = new Map<string, string>();
  let rest = value.slice(head[0].length);
  while (rest.length > 0) {
    if (/^;\s*$/.test(rest)) break;
    const param =
      /^;\s*([A-Za-z0-9!#$%&'+.^_`|~-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^\s;"]+))\s*/.exec(rest) ?? refuse(`${where} is not in a form it reads`);
    const name = param[1]!.toLowerCase();
    if (params.has(name)) refuse(`${where} names ${name} twice`);
    params.set(name, param[2] === undefined ? param[3]! : param[2].replace(/\\(.)/g, "$1"));
    rest = rest.slice(param[0].length);
  }
  return { value: head[1]!.toLowerCase(), params };
};

interface Shown {
  readonly plain?: string;
  readonly html?: string;
  readonly attachments: { readonly text: string; readonly contentId?: string }[];
}

/** Reads every part of a draft by the allow-list, classifying each part before opening it. */
const readParts = (payload: Part) => {
  let plain: string | undefined;
  let html: string | undefined;
  const attachments: { text: string; contentId?: string }[] = [];
  const walk = (part: Part, top: boolean) => {
    const allowed = top ? [...sendable.shownHeaders, ...sendable.quietHeaders] : sendable.partHeaders;
    const seen = new Set<string>();
    for (const { name } of part.headers ?? []) {
      const key = name.toLowerCase();
      if (seen.has(key)) refuse(`it has more than one ${name} header`);
      seen.add(key);
      if (!allowed.some((other) => other.toLowerCase() === key))
        refuse(top ? `it has a ${name} header, which the approval would not show` : `a part of it has a ${name} header`);
    }
    const type = (part.mimeType ?? "").toLowerCase();
    const declared = header(part, "Content-Type");
    const params = declared === undefined ? new Map<string, string>() : mimeValue(declared, "a Content-Type header").params;
    if (declared !== undefined && mimeValue(declared, "a Content-Type header").value !== type) refuse("a part's Content-Type disagrees with Gmail's reading of it");
    const encoding = header(part, "Content-Transfer-Encoding");
    if (encoding !== undefined && !(sendable.transferEncodings as readonly string[]).includes(encoding.trim().toLowerCase()))
      refuse(`a part of it uses the ${encoding.trim()} transfer encoding, which it does not read`);
    const dispositionHeader = header(part, "Content-Disposition");
    const disposition = dispositionHeader === undefined ? undefined : mimeValue(dispositionHeader, "a Content-Disposition header");
    if (disposition && (!["inline", "attachment"].includes(disposition.value) || [...disposition.params.keys()].some((key) => key !== "filename")))
      refuse(`a part of it has a Content-Disposition it does not read (${dispositionHeader})`);
    const name = part.filename ?? "";
    for (const given of [params.get("name"), disposition?.params.get("filename")])
      if (given !== undefined && decodeWords(given, "an attachment's name") !== name) refuse("an attachment's name cannot be read reliably");
    const attached = name !== "" || disposition?.value === "attachment";

    if (type.startsWith("multipart/")) {
      if (attached) refuse(`it has an attached ${type} part (${name || "no name"}), which it does not open`);
      if (!(sendable.containers as readonly string[]).includes(type)) refuse(`it has a ${type} part`);
      if (!part.parts?.length) refuse(`it has an empty ${type} part`);
      return part.parts!.forEach((child) => walk(child, false));
    }
    if (part.parts?.length || type.startsWith("message/")) refuse(`it has an attached ${type || "message"} part, which it does not open`);
    if (!attached && (sendable.bodyTypes as readonly string[]).includes(type)) {
      if (part.body?.attachmentId !== undefined || (part.body?.data === undefined && (part.body?.size ?? 0) > 0))
        refuse("its text is stored apart from the message, so the approval could not show it");
      const text = decodeText(base64Bytes(part.body?.data ?? ""), params.get("charset") ?? "us-ascii", "its text").replace(/\r\n/g, "\n");
      if ((type === "text/plain" ? plain : html) !== undefined) refuse("it has more than one text part");
      if (type === "text/plain") plain = visible(text, "its text");
      else html = text;
      return;
    }
    if (name === "") refuse(`it has an unnamed ${type} part`);
    visible(name, "an attachment's name");
    const contentId = header(part, "Content-ID")?.trim().replace(/^<(.*)>$/, "$1");
    const inline = disposition?.value === "inline" || contentId !== undefined;
    attachments.push({ text: `${name} (${type}, ${part.body?.size ?? 0} bytes${inline ? ", shown in the body" : ""})`, contentId });
  };
  walk(payload, true);
  return { plain, html, attachments } satisfies Shown;
};

/** Text with its character references decoded; only the named ones listed, and numeric ones, are read. */
const htmlCharacters = (raw: string) =>
  visible(
    raw.replace(/&[^;]*;?/g, (reference) => {
      const named = /^&([A-Za-z]+);$/.exec(reference);
      if (named) return sendable.entities[named[1]!] ?? refuse(`its HTML has a character reference it does not read (${reference})`);
      const numeric = /^&#(?:([0-9]{1,7})|[xX]([0-9A-Fa-f]{1,6}));$/.exec(reference);
      const code = numeric ? (numeric[1] === undefined ? parseInt(numeric[2]!, 16) : Number(numeric[1])) : -1;
      if (code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) refuse(`its HTML has a character reference it does not read (${reference.slice(0, 12)})`);
      return String.fromCodePoint(code);
    }),
    "its HTML",
  );

/**
 * What a draft's HTML shows, as text with every link's real target, read by the allow-list: a
 * tokenizer that reads each tag's element and attribute names as HTML does, and refuses any tag,
 * attribute, value, reference or nesting it does not positively recognise.
 */
const htmlText = (html: string, inlineIds: ReadonlySet<string>) => {
  const out: string[] = [];
  const open: { name: string; href?: string; at: number }[] = [];
  let at = 0;
  while (at < html.length) {
    const next = html.indexOf("<", at);
    const chunk = html.slice(at, next === -1 ? html.length : next);
    if (chunk) out.push(htmlCharacters(chunk).replace(/[ \t\n\r\f]+/g, " "));
    if (next === -1) break;
    at = next;
    const rest = html.slice(at);
    const close = /^<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/.exec(rest);
    if (close) {
      const name = close[1]!.toLowerCase();
      const top = open.pop();
      if (top?.name !== name) refuse(`its HTML closes <${name}> where that element is not open`);
      if (name === "a") {
        const label = out.splice(top!.at).join("");
        out.push(label.trim() === top!.href ? top!.href! : `${label} <${top!.href}>`);
      }
      if (blocks.has(name) && name !== "li") out.push("\n");
      at += close[0].length;
      continue;
    }
    const start = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(rest) ?? refuse("its HTML has a < that does not open an element it allows (a comment, a declaration or a stray <)");
    const name = start[1]!.toLowerCase();
    const allowed = sendable.elements[name] ?? refuse(`its HTML uses the element <${name}>`);
    at += start[0].length;
    const attributes = new Map<string, string>();
    for (;;) {
      const end = /^\s*(\/?)>/.exec(html.slice(at));
      if (end) {
        if (end[1] && !voids.has(name)) refuse(`its HTML writes <${name}/>, which HTML does not read as closed`);
        at += end[0].length;
        break;
      }
      const attribute =
        /^\s+([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/.exec(html.slice(at)) ?? refuse(`its HTML has a <${name}> tag it cannot read`);
      const key = attribute[1]!.toLowerCase();
      if (attributes.has(key)) refuse(`its HTML has two ${key} attributes on one <${name}>`);
      attributes.set(key, htmlCharacters(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""));
      at += attribute[0].length;
    }
    for (const [key, value] of attributes) {
      const fixed = sendable.anywhere[key];
      if (fixed) {
        const words = key === "class" ? value.split(/\s+/).filter(Boolean) : [value];
        if (words.length === 0 || words.some((word) => !fixed.includes(word))) refuse(`its HTML has ${key}="${value}" on <${name}>`);
      } else if (!allowed.includes(key)) refuse(`its HTML has the attribute ${key} on <${name}>`);
    }
    let shown = "";
    if (name === "a") {
      if (open.some((element) => element.name === "a")) refuse("its HTML has a link inside a link");
      const href = attributes.get("href") ?? refuse("its HTML has a link with no target");
      if (/\s/.test(href) || !(sendable.linkSchemes as readonly string[]).includes(/^[a-z][a-z0-9+.-]*:/i.exec(href)?.[0].toLowerCase() ?? ""))
        refuse(`its HTML links to ${JSON.stringify(href.slice(0, 60))}, which is not an http:, https: or mailto: address`);
      if (attributes.has("target") && attributes.get("target") !== "_blank") refuse("its HTML has a link target other than _blank");
      open.push({ name, href, at: out.length });
      continue;
    }
    if (name === "img") {
      const src = attributes.get("src") ?? "";
      if (/^https?:/i.test(src)) refuse("its HTML loads an image from the web");
      if (!/^cid:/i.test(src) || !inlineIds.has(src.slice(4))) refuse("its HTML shows an image that is not one of the draft's inline attachments");
      for (const size of ["width", "height"]) if (attributes.has(size) && !/^\d{1,4}$/.test(attributes.get(size)!)) refuse(`its HTML has an image ${size} that is not a number`);
      const alt = attributes.get("alt")?.trim();
      shown = alt ? `[image: ${alt}]` : "[image]";
    }
    if (name === "br") shown = "\n";
    else if (name === "li") shown = "\n- ";
    else if (blocks.has(name)) shown = `\n${shown}`;
    out.push(shown);
    if (!voids.has(name)) open.push({ name, at: out.length });
  }
  if (open.length > 0) refuse(`its HTML leaves <${open.at(-1)!.name}> open`);
  return out
    .join("")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/** Text compared as words: runs of spaces and line breaks count as one space. */
const words = (value: string) => value.replace(/\s+/g, " ").trim();

/** The draft as its approval shows it, or a Refusal saying what the allow-list does not cover. */
const approvable = (payload: Part | undefined) => {
  if (payload === undefined) return refuse("Gmail returned no content for it");
  const found = readParts(payload);
  let body = found.plain ?? "";
  let format = found.plain === undefined ? "no body" : "plain text";
  if (found.html !== undefined) {
    const inlineIds = new Set(found.attachments.flatMap((a) => (a.contentId === undefined ? [] : [a.contentId])));
    const shown = htmlText(found.html, inlineIds);
    if (found.plain === undefined) [body, format] = [shown, "HTML, shown as text with each link's target in <>"];
    else if (words(shown) !== words(found.plain))
      refuse("its HTML version says something other than its plain text (compared word for word, with each link as label <target>)");
    else format = "plain text, with an HTML copy of the same text";
  }
  const shownHeader = (name: string) => {
    const value = header(payload, name);
    return value === undefined ? undefined : decodeWords(value, `its ${name} header`);
  };
  return {
    from: shownHeader("From") ?? "(not set: the account's default address)",
    sender: shownHeader("Sender") ?? "",
    replyTo: shownHeader("Reply-To") ?? "",
    to: shownHeader("To") ?? "",
    cc: shownHeader("Cc") ?? "",
    bcc: shownHeader("Bcc") ?? "",
    subject: shownHeader("Subject") ?? "",
    format,
    body,
    attachments: found.attachments.map((a) => a.text),
  };
};

/** sendDraft's rule in words, written from `sendable`, for its description. */
const sendableRule = [
  `It sends only a draft whose every header, part and HTML element is on its allow-list and shown in the approval, within ${approvalLimit} characters of approval text.`,
  `Headers: ${sendable.shownHeaders.join(", ")} (shown, once each), and unshown only ${sendable.quietHeaders.join(", ")}.`,
  `Parts: ${sendable.containers.join(", ")} (opened unless named or attached); one ${sendable.bodyTypes.join(" and one ")} body; any other part only as a named attachment, listed with its type and size; parts may carry only ${sendable.partHeaders.join(", ")}.`,
  `Encodings: ${sendable.transferEncodings.join(", ")}; charsets ${sendable.charsets.join(", ")}.`,
  `HTML elements: ${Object.entries(sendable.elements)
    .map(([element, attributes]) => (attributes.length ? `<${element}> (${attributes.join(", ")})` : `<${element}>`))
    .join(", ")}; on any of them only ${Object.entries(sendable.anywhere)
    .map(([key, values]) => `${key}=${values.join("|")}`)
    .join(", ")}.`,
  `Values: ${Object.entries(sendable.values)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ")}. Character references: ${Object.keys(sendable.entities).join(", ")} and numeric.`,
  "HTML must say, word for word with each link as label <target>, what the plain text says. No character that hides or reorders text (zero-width, bidirectional controls and the like).",
  "Everything else is refused with nothing sent: for example any style attribute or <style>, comments, web images, data- attributes other than the one listed, attached emails, text stored apart from the message, other charsets, and Gmail's quoted replies and most formatted signatures. The person can send a refused draft from Gmail.",
].join(" ");

/**
 * What sending a draft would send, read from Gmail now: the fields its approval shows, the raw
 * message they were read from, and why sendDraft would refuse it, if it would. Both reads must name
 * the same message, or the draft changed between them.
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
  try {
    const send = { account: target.email, draftId, ...approvable(full.message.payload), version: await version(raw.message.raw) };
    const length = JSON.stringify(send, null, 2).length;
    if (length > approvalLimit)
      refuse(`it is too long for an approval to show in full (${length} characters as the approval prints it; the limit is ${approvalLimit})`);
    return { message: full.message, raw: raw.message.raw, send, problems: [] as string[] };
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    return { message: full.message, raw: raw.message.raw, send: undefined, problems: [error.message] };
  }
};

/** Why sendDraft will not send a draft, in words for the person. */
const refusal = (problems: readonly string[]) =>
  `sendDraft only sends a draft whose whole content its approval shows, and ${problems.join("; ")}. The person can open the draft in Gmail and send it from there.`;

/** The fields sendDraft's approval shows, in the order readDraft returns them. */
const SendFields = {
  account: string({ minLength: 1 }),
  draftId: string({ minLength: 1 }),
  from: string(),
  sender: string(),
  replyTo: string(),
  to: string(),
  cc: string(),
  bcc: string(),
  subject: string(),
  format: string(),
  body: string(),
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
          "Read a draft as it would be sent: its addresses, subject, body and attachments. When sendDraft can send it, `send` is sendDraft's input: pass it unchanged, so the person approving sees everything that will go out. When it cannot, `cannotSend` says why; tell the person, who can send it from Gmail.",
        input: object({ account, draftId: string({ minLength: 1 }) }),
      },
      async (ctx: Context, input) => {
        pathId("draftId", input.draftId);
        const target = await single(ctx, source, input.account);
        const draft = await draftPreview(ctx, target, input.draftId);
        const { body, attachments } = content(draft.message.payload);
        return defined({
          account: target.email,
          draftId: input.draftId,
          messageId: draft.message.id,
          threadId: draft.message.threadId,
          from: header(draft.message.payload, "From") ?? "",
          sender: header(draft.message.payload, "Sender") ?? "",
          replyTo: header(draft.message.payload, "Reply-To") ?? "",
          to: header(draft.message.payload, "To") ?? "",
          cc: header(draft.message.payload, "Cc") ?? "",
          bcc: header(draft.message.payload, "Bcc") ?? "",
          subject: header(draft.message.payload, "Subject") ?? "",
          body,
          attachments,
          send: draft.send,
          cannotSend: draft.problems.length === 0 ? undefined : refusal(draft.problems),
        });
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
          `Send a saved draft, but only one whose whole content its approval can show. Read it with readDraft first and pass its \`send\` field unchanged: the person approving sees the account, every address header, the subject, the complete body (HTML shown as text with each link's real target) and every attachment's name, type and size. If readDraft says cannotSend, tell the person why; they can send it from Gmail. ${sendableRule} If the draft changed since it was read, nothing is sent: read it again and ask for approval of what it now says.`,
        input: object(SendFields),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        pathId("draftId", input.draftId);
        const target = await single(ctx, source, input.account);
        const now = await draftPreview(ctx, target, input.draftId);
        if (now.send === undefined) throw new Error(`Nothing was sent: ${refusal(now.problems)}`);
        const approvedNow = now.send;
        const changed = (Object.keys(SendFields) as (keyof typeof SendFields)[]).filter(
          (field) => JSON.stringify(input[field]) !== JSON.stringify(approvedNow[field]),
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

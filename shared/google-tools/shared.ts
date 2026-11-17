// Helpers for the curated tools: choosing accounts, calling Google with one of them, running a read
// across every linked account, and the encodings Gmail and Calendar need.
import { decodeJson, json, object, string, type MutationContext, type QueryContext } from "apps";

export type Context = QueryContext;
export type WriteContext = MutationContext;
/** What the helpers use of a query or mutation context. */
export type Base = Pick<Context, "fetch" | "signal" | "cache">;
/** A linked Google account, as any of the Google packages' slots provides it. */
export interface Account {
  readonly id: string;
  readonly fields: { readonly access_token: string };
}

/** How a package reads an account's address with the scopes it already has. */
export type Address = (load: { readonly fetch: typeof fetch; readonly signal: AbortSignal }, account: Account) => Promise<string>;

/** The accounts a package's curated tools run with, and how it names them. */
export interface Source {
  readonly accounts: readonly Account[];
  readonly address: Address;
  /** Where the package mounts a product's complete API (`gmail` → `api.gmail`), named in the tools' instructions. */
  readonly api: (product: string) => string;
}

const read =
  <T>(url: string, schema: Parameters<typeof decodeJson<T>>[1], pick: (body: T) => string): Address =>
  async ({ fetch, signal }, account) =>
    pick(await decodeJson(await fetch(url, { signal, headers: { Authorization: `Bearer ${account.fields.access_token}` } }), schema));

/** Address lookups for each package's scopes. */
export const addresses = {
  /** Needs the `email` scope; `url` is the userinfo endpoint on a host the provider allows. */
  userinfo: (url: string) => read(url, object({ email: string() }), (body) => body.email),
  gmail: read("https://gmail.googleapis.com/gmail/v1/users/me/profile", object({ emailAddress: string() }), (body) => body.emailAddress),
  /** The primary calendar's ID is the account's address. */
  calendar: read("https://www.googleapis.com/calendar/v3/calendars/primary", object({ id: string() }), (body) => body.id),
  drive: read(
    "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
    object({ user: object({ emailAddress: string() }) }),
    (body) => body.user.emailAddress,
  ),
  /** For scopes that reveal no address, such as Tasks': accounts are named by their ID. */
  id: (async (_load, account) => account.id) as Address,
};

/** One linked account with the address it signs in as. */
export interface Target {
  readonly account: Account;
  readonly email: string;
}

/** The account's address, cached per account so a fan-out costs one request per account at most once a day. */
const emailOf = (ctx: Base, source: Source, account: Account) =>
  ctx.cache.forAccount(account).get({
    key: "email",
    schema: string(),
    freshFor: "1 day",
    load: (load) => source.address(load, account),
  });

/** Every linked account with its address. */
export const linked = (ctx: Base, source: Source): Promise<Target[]> =>
  Promise.all(source.accounts.map(async (account) => ({ account, email: await emailOf(ctx, source, account) })));

/** The accounts a call names: one by address or account ID, or all of them when `account` is omitted. */
export const select = async (ctx: Base, source: Source, account: string | undefined): Promise<Target[]> => {
  const all = await linked(ctx, source);
  if (all.length === 0) throw new Error("No Google account is linked to this app. Connect one first.");
  if (account === undefined) return all;
  const wanted = account.trim().toLowerCase();
  const match = all.filter((target) => target.email.toLowerCase() === wanted || target.account.id === account);
  if (match.length === 0)
    throw new Error(`No linked Google account matches ${account}. Linked accounts: ${all.map((t) => t.email).join(", ")}.`);
  return match;
};

/** The one account a write uses: the named one, or the only linked account. */
export const single = async (ctx: Base, source: Source, account: string | undefined): Promise<Target> => {
  const targets = await select(ctx, source, account);
  if (targets.length > 1)
    throw new Error(`Several Google accounts are linked; pass account as one of: ${targets.map((t) => t.email).join(", ")}.`);
  return targets[0]!;
};

/**
 * Runs a read on each target at once. One account's failure does not hide the others' results: it
 * is reported under `errors` with the account's address.
 */
export const fanOut = async <T>(
  targets: readonly Target[],
  run: (target: Target) => Promise<readonly T[]>,
): Promise<{ readonly items: T[]; readonly errors: { readonly account: string; readonly message: string }[] }> => {
  const settled = await Promise.allSettled(targets.map(run));
  const items: T[] = [];
  const errors: { account: string; message: string }[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") items.push(...result.value);
    else errors.push({ account: targets[index]!.email, message: result.reason instanceof Error ? result.reason.message : String(result.reason) });
  });
  return { items, errors };
};

/** Drops undefined fields, which tool results cannot carry: results must be plain JSON. */
export const defined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

/**
 * A Google ID as a URL path segment. IDs come from the caller, so anything that cannot be an ID is
 * refused before a URL is built: blank, a dot segment ("." or "..", which URL parsing would resolve
 * to the parent path), a slash, whitespace or a control character, or an implausible length.
 * Calendar IDs are addresses (and may hold "#" or "+"), so no narrower alphabet is assumed.
 */
export const pathId = (name: string, value: string) => {
  if (value.length === 0 || value.length > 1024 || /^\.+$/.test(value) || /[/\\\s\x00-\x1f\x7f]/.test(value))
    throw new Error(`${name} ${JSON.stringify(value.slice(0, 80))} is not a Google ID. Use the ID a list or search tool returned.`);
  return encodeURIComponent(value);
};

/** A safe next step for a failed call, by status. Google's response body is never included. */
const nextStep: Readonly<Record<number, string>> = {
  400: "Google refused the request as invalid: check the IDs and values passed.",
  401: "The account's sign-in has expired or was revoked: reconnect the Google account in Executor.",
  403: "The account may lack access to this item, or its sign-in may be missing a permission this tool needs: check its access, or reconnect it and grant everything asked for. Google also answers 403 when a usage limit is hit; if so, wait a minute before retrying.",
  404: "Not found: the ID may be wrong, or the item was deleted.",
  409: "Conflict: the item already exists or changed at the same moment. Read it again before retrying.",
  410: "The item was already deleted.",
  412: "The item changed since it was read. Read it again before retrying.",
  429: "Google is rate limiting this account: wait a minute before retrying.",
};

/** A non-2xx answer from Google: the status and a next step, never the response body. */
export class GoogleError extends Error {
  constructor(
    readonly status: number,
    hint?: string,
  ) {
    super(
      `Google answered ${status}. ${hint ?? nextStep[status] ?? (status >= 500 ? "Google had a temporary problem: wait a moment, then retry." : "The request failed.")}`,
    );
    this.name = "GoogleError";
  }
}

/** Calls a Google JSON API with the target's token. `search` values left undefined are omitted. */
export const google = async (
  ctx: Base,
  target: Target,
  url: string,
  init: {
    readonly method?: string;
    readonly body?: unknown;
    readonly search?: Readonly<Record<string, string | number | boolean | readonly string[] | undefined>>;
    readonly headers?: Readonly<Record<string, string>>;
    /** Next steps that say more than the generic ones for this call, by status. */
    readonly hints?: Readonly<Record<number, string>>;
  } = {},
): Promise<any> => {
  const address = new URL(url);
  for (const [key, value] of Object.entries(init.search ?? {})) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) address.searchParams.append(key, String(item));
  }
  const response = await ctx.fetch(address.toString(), {
    method: init.method ?? "GET",
    signal: ctx.signal,
    headers: {
      Authorization: `Bearer ${target.account.fields.access_token}`,
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...init.headers,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) throw new GoogleError(response.status, init.hints?.[response.status]);
  if (response.status === 204) return {};
  return decodeJson(response, json());
};

/** Fetches a body as text, for exports and downloads. */
export const googleText = async (ctx: Base, target: Target, url: string): Promise<string> => {
  const response = await ctx.fetch(url, {
    signal: ctx.signal,
    headers: { Authorization: `Bearer ${target.account.fields.access_token}` },
  });
  if (!response.ok) throw new GoogleError(response.status);
  return response.text();
};

/** Bounded parallelism, so a 50-thread search does not open 50 connections at once. */
export const mapLimit = async <T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const bytesToBinary = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return binary;
};

/** UTF-8 text as base64url, the encoding Gmail's `raw` field takes. */
export const base64url = (text: string) =>
  btoa(bytesToBinary(new TextEncoder().encode(text))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

/** Base64 for a MIME body, wrapped at 76 characters. */
export const base64Lines = (text: string) => btoa(bytesToBinary(new TextEncoder().encode(text))).replace(/.{76}/g, "$&\r\n");

/** Decodes a Gmail body part (base64url bytes) in the part's charset. */
export const decodeBody = (data: string, charset = "utf-8") => {
  const binary = atob(data.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
};

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Readable text from an HTML body: block elements become line breaks, tags and scripts go. */
export const htmlToText = (html: string) =>
  html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) =>
      text.trim() && !href.startsWith("mailto:") && text.trim() !== href ? `${text} (${href})` : text,
    )
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) return String.fromCodePoint(parseInt(code.slice(2), 16));
      if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
      return entities[code.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** A header value with non-ASCII text as an RFC 2047 encoded word. */
export const encodeHeader = (value: string) =>
  /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${btoa(bytesToBinary(new TextEncoder().encode(value)))}?=`;

/** Milliseconds a zone is ahead of UTC at an instant. */
const zoneOffset = (zone: string, instant: number) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!);
  return asUtc - Math.floor(instant / 1000) * 1000;
};

/** The instant a wall-clock time in a zone names. */
export const zonedTime = (zone: string, year: number, month: number, day: number, hour = 0, minute = 0) => {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - zoneOffset(zone, guess);
  return first - (zoneOffset(zone, first) - zoneOffset(zone, guess));
};

/** The calendar date (year, month, day) of an instant in a zone. */
export const zonedDate = (zone: string, instant: number) => {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(instant))
    .split("-")
    .map(Number) as [number, number, number];
  return { year, month, day };
};

const pad = (value: number, width = 2) => String(value).padStart(width, "0");
const offsetText = (offset: number) => {
  const minutes = Math.abs(offset) / 60000;
  return `${offset < 0 ? "-" : "+"}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};

/**
 * An instant as wall-clock time in a zone, with the zone's offset at that instant
 * (2026-12-02T09:00:00-05:00), so it means the same instant wherever it is read.
 */
export const zonedIso = (zone: string, instant: number) => {
  const offset = zoneOffset(zone, instant);
  return new Date(Math.floor(instant / 1000) * 1000 + offset).toISOString().slice(0, 19) + offsetText(offset);
};

/**
 * The instant a wall-clock time with seconds and milliseconds names in a zone. Refuses a time the
 * zone skips (clocks going forward) and one it passes twice (clocks going back), naming the offsets
 * that would make it exact, rather than picking an hour.
 */
const wallClock = (zone: string, y: number, mo: number, d: number, h: number, mi: number, s: number, ms: number) => {
  const local = Date.UTC(y, mo - 1, d, h, mi, s);
  const text = `${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${ms ? `.${pad(ms, 3)}` : ""}`;
  // A zone's offset changes at most once within a day either side, so these are the only candidates.
  const offsets = [...new Set([zoneOffset(zone, local - 86_400_000), zoneOffset(zone, local + 86_400_000)])];
  const valid = offsets.filter((offset) => zoneOffset(zone, local - offset) === offset);
  if (valid.length === 0)
    throw new Error(`${text} does not exist in ${zone}: the clocks skip forward over it. Give a time outside the skipped hour, or an offset.`);
  if (valid.length > 1)
    throw new Error(
      `${text} happens twice in ${zone}, because the clocks go back then. Give it with an offset: ${valid.map((offset) => text + offsetText(offset)).join(" or ")}.`,
    );
  return local - valid[0]! + ms;
};

/**
 * An instant from what a model is likely to pass: an RFC 3339 time, a local time read in `zone`
 * (seconds and milliseconds kept), a date (midnight in `zone`), "now", "today", "tomorrow" or
 * "yesterday".
 */
export const parseTime = (value: string, zone: string, now = Date.now()) => {
  const text = value.trim().toLowerCase();
  if (text === "now") return now;
  const shift = { yesterday: -1, today: 0, tomorrow: 1 }[text];
  if (shift !== undefined) {
    const today = zonedDate(zone, now);
    return zonedTime(zone, today.year, today.month, today.day + shift);
  }
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (date) return zonedTime(zone, +date[1]!, +date[2]!, +date[3]!);
  const local = /^(\d{4})-(\d{2})-(\d{2})t(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(text);
  if (local) {
    // Date holds milliseconds; finer digits are dropped.
    const ms = local[7] === undefined ? 0 : +local[7].slice(0, 3).padEnd(3, "0");
    return wallClock(zone, +local[1]!, +local[2]!, +local[3]!, +local[4]!, +local[5]!, +(local[6] ?? 0), ms);
  }
  const instant = Date.parse(value);
  if (Number.isNaN(instant))
    throw new Error(`Could not read the time "${value}". Use RFC 3339 (2026-10-14T09:00:00-07:00), a date (2026-10-14), "now", "today" or "tomorrow".`);
  return instant;
};

/** A zone setting read with the target's token and cached for a day under `key`. */
const zoneSetting = (ctx: Base, target: Target, key: string, url: string, pick: (body: any) => unknown) =>
  ctx.cache.forAccount(target.account).get({
    key,
    schema: string(),
    freshFor: "1 day",
    load: async ({ fetch, signal }) => {
      const zone = pick(await google({ ...ctx, fetch, signal }, target, url));
      if (typeof zone !== "string" || zone === "") throw new Error("Google returned no time zone; pass timeZone.");
      return zone;
    },
  });

/** The zone of the account's Calendar settings, which reads spanning all its calendars use. */
export const accountZone = (ctx: Base, target: Target) =>
  zoneSetting(ctx, target, "calendar-zone", "https://www.googleapis.com/calendar/v3/users/me/settings/timezone", (body) => body.value);

/** A calendar's own zone, which times without an offset written to that calendar are read in. */
export const calendarZone = (ctx: Base, target: Target, calendarId: string) =>
  zoneSetting(
    ctx,
    target,
    `calendar-zone:${calendarId}`,
    `https://www.googleapis.com/calendar/v3/calendars/${pathId("calendarId", calendarId)}?fields=timeZone`,
    (body) => body.timeZone,
  );

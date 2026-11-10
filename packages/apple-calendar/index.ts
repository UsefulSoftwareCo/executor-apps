import {
  accountRouter,
  boolean,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const root = "https://caldav.icloud.com/";

type Account = { fields: { username: string; password: string } };

function basic(account: Account): string {
  return `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`;
}

const apple = defineProvider({
  name: "Apple Calendar",
  hosts: ["caldav.icloud.com", "*.icloud.com"],
  auth: {
    // Apple ID plus an app-specific password from https://account.apple.com (Sign-In and Security > App-Specific Passwords).
    appPassword: secrets({
      label: "Apple ID and app-specific password",
      fields: object({ username: plain(string({ minLength: 1 })), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(root, {
      method: "PROPFIND",
      signal,
      headers: { Authorization: basic(account), Depth: "0", "Content-Type": "application/xml; charset=utf-8" },
      body: `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`,
    });
    if (!response.ok) throw new Error(`iCloud CalDAV answered ${response.status}; check the Apple ID and app-specific password`);
    const principal = firstHref(await response.text(), "current-user-principal");
    if (!principal) throw new Error("iCloud CalDAV returned no principal for this account");
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username, email: account.fields.username } };
  },
});

// ---- XML and iCalendar helpers (iCloud answers with small, regular multistatus documents) ----

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#13;/g, "\r")
    .replace(/&#10;/g, "\n")
    .replace(/&amp;/g, "&");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function firstHref(xml: string, parent: string): string | undefined {
  const match = new RegExp(`<(?:\\w+:)?${parent}[^>]*>\\s*<(?:\\w+:)?href[^>]*>([^<]*)<`).exec(xml);
  return match?.[1] ? decodeEntities(match[1].trim()) : undefined;
}

function tagText(block: string, tag: string): string | undefined {
  const match = new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tag}>`).exec(block);
  return match?.[1] === undefined ? undefined : decodeEntities(match[1]).trim();
}

function responses(xml: string): string[] {
  return xml.match(/<(?:\w+:)?response[\s>][\s\S]*?<\/(?:\w+:)?response>/g) ?? [];
}

function unfold(ics: string): string[] {
  return ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function icsText(value: string): string {
  return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

function parseComponent(ics: string, name: string): Record<string, string> {
  const out: Record<string, string> = {};
  let inside = false;
  for (const line of unfold(ics)) {
    if (line === `BEGIN:${name}`) inside = true;
    else if (line === `END:${name}`) break;
    else if (inside && !line.startsWith("BEGIN:") && line.includes(":")) {
      const colon = line.indexOf(":");
      const head = line.slice(0, colon);
      const key = head.split(";")[0]!.toLowerCase();
      if (!(key in out)) out[key] = icsText(line.slice(colon + 1));
      if (head.includes(";TZID=") && !(`${key}_tzid` in out)) out[`${key}_tzid`] = /TZID=([^;:]+)/.exec(head)?.[1] ?? "";
    }
  }
  return out;
}

function summarize(ics: string, component: "VEVENT" | "VTODO") {
  const p = parseComponent(ics, component);
  return {
    uid: p.uid ?? null,
    summary: p.summary ?? null,
    start: p.dtstart ?? null,
    startTimeZone: p.dtstart_tzid ?? null,
    end: p.dtend ?? p.due ?? null,
    location: p.location ?? null,
    description: p.description ?? null,
    status: p.status ?? null,
    recurrence: p.rrule ?? null,
  };
}

function icsDate(value: string): { text: string; allDay: boolean } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { text: value.replace(/-/g, ""), allDay: true };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Not an ISO 8601 date or date-time: ${value}`);
  return { text: date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""), allDay: false };
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function buildEvent(input: {
  uid: string;
  summary: string;
  start: string;
  end: string;
  description?: string | undefined;
  location?: string | undefined;
  rrule?: string | undefined;
}): string {
  const start = icsDate(input.start);
  const end = icsDate(input.end);
  if (start.allDay !== end.allDay) throw new Error("start and end must both be dates (all-day) or both be date-times");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//executor.sh//apple-calendar//EN",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${icsDate(new Date().toISOString()).text}`,
    start.allDay ? `DTSTART;VALUE=DATE:${start.text}` : `DTSTART:${start.text}`,
    end.allDay ? `DTEND;VALUE=DATE:${end.text}` : `DTEND:${end.text}`,
    `SUMMARY:${escapeIcs(input.summary)}`,
    ...(input.description ? [`DESCRIPTION:${escapeIcs(input.description)}`] : []),
    ...(input.location ? [`LOCATION:${escapeIcs(input.location)}`] : []),
    ...(input.rrule ? [`RRULE:${input.rrule.replace(/^RRULE:/i, "")}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

// ---- CalDAV client ----

function client(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  let home: URL | undefined;

  const request = async (
    method: string,
    url: string | URL,
    headers: Record<string, string>,
    body?: string,
  ): Promise<Response> => {
    const target = new URL(url);
    if (target.protocol !== "https:" || !(target.hostname === "icloud.com" || target.hostname.endsWith(".icloud.com"))) {
      throw new Error(`Refusing to send iCloud credentials to ${target.host}`);
    }
    return fetcher(target.toString(), {
      method,
      signal,
      headers: { Authorization: basic(account), ...headers },
      ...(body === undefined ? {} : { body }),
    });
  };

  const xmlHeaders = (depth: string) => ({ Depth: depth, "Content-Type": "application/xml; charset=utf-8" });

  const dav = async (method: string, url: string | URL, depth: string, body: string): Promise<string> => {
    const response = await request(method, url, xmlHeaders(depth), body);
    const text = await response.text();
    if (!response.ok && response.status !== 207) {
      throw new Error(`iCloud CalDAV ${method} ${response.status}: ${text.slice(0, 300)}`);
    }
    return text;
  };

  const calendarHome = async (): Promise<URL> => {
    if (home) return home;
    const principalXml = await dav(
      "PROPFIND",
      root,
      "0",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`,
    );
    const principal = firstHref(principalXml, "current-user-principal");
    if (!principal) throw new Error("iCloud CalDAV returned no principal for this account");
    const principalUrl = new URL(principal, root);
    const homeXml = await dav(
      "PROPFIND",
      principalUrl,
      "0",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>`,
    );
    const set = firstHref(homeXml, "calendar-home-set");
    if (!set) throw new Error("iCloud CalDAV returned no calendar home for this account");
    home = new URL(set, principalUrl);
    return home;
  };

  const resolve = async (href: string): Promise<URL> => new URL(href, await calendarHome());

  const calendars = async () => {
    const base = await calendarHome();
    const xml = await dav(
      "PROPFIND",
      base,
      "1",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/"><d:prop><d:displayname/><d:resourcetype/><c:supported-calendar-component-set/><a:calendar-color/><c:calendar-description/><d:getctag/></d:prop></d:propfind>`,
    );
    return responses(xml)
      .filter((block) => /<(?:\w+:)?calendar\s*\/>/.test(block))
      .map((block) => ({
        url: new URL(tagText(block, "href") ?? "", base).toString(),
        name: tagText(block, "displayname") ?? null,
        description: tagText(block, "calendar-description") ?? null,
        color: tagText(block, "calendar-color") ?? null,
        components: [...block.matchAll(/<(?:\w+:)?comp\s+name="([A-Z]+)"/g)].map((m) => m[1]!),
      }));
  };

  const search = async (calendarUrl: string, component: "VEVENT" | "VTODO", range: { start?: string | undefined; end?: string | undefined }) => {
    const url = await resolve(calendarUrl);
    const timeRange =
      range.start || range.end
        ? `<c:time-range${range.start ? ` start="${icsDate(range.start).text.padEnd(8, "0")}${icsDate(range.start).allDay ? "T000000Z" : ""}"` : ""}${
            range.end ? ` end="${icsDate(range.end).text}${icsDate(range.end).allDay ? "T000000Z" : ""}"` : ""
          }/>`
        : "";
    const xml = await dav(
      "REPORT",
      url,
      "1",
      `<?xml version="1.0" encoding="utf-8"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag/><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="${component}">${timeRange}</c:comp-filter></c:comp-filter></c:filter></c:calendar-query>`,
    );
    return responses(xml)
      .map((block) => {
        const ics = tagText(block, "calendar-data");
        if (!ics) return undefined;
        return {
          href: new URL(tagText(block, "href") ?? "", url).toString(),
          etag: tagText(block, "getetag") ?? null,
          ...summarize(ics, component),
          ics,
        };
      })
      .filter((item) => item !== undefined);
  };

  return { request, calendars, search, resolve };
}

// ---- Tools ----

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const caldav = client(account, fetcher, signal);

  const check = async (response: Response, what: string) => {
    if (!response.ok) throw new Error(`iCloud CalDAV ${what} failed with ${response.status}: ${(await response.text()).slice(0, 300)}`);
  };

  return router({
    calendars: router(
      {
        list: query(
          {
            description:
              "List the calendars and reminder lists in the iCloud account with their URL, name, color and supported components (VEVENT for events, VTODO for reminders).",
            input: object({}),
          },
          async () => ({ calendars: await caldav.calendars() }),
        ),
      },
      { title: "Calendars", description: "Calendars and reminder lists." },
    ),
    events: router(
      {
        list: query(
          {
            description:
              "List events in a calendar, optionally between two ISO 8601 times or dates. Recurring events are returned as their master with the recurrence rule. Returns each event's href, etag, parsed fields and raw iCalendar text.",
            input: object({
              calendarUrl: string(),
              start: string().optional(),
              end: string().optional(),
            }),
          },
          async (_ctx, input) => ({ events: await caldav.search(input.calendarUrl, "VEVENT", input) }),
        ),
        get: query(
          { description: "Fetch one event by its href, with its etag and raw iCalendar text.", input: object({ href: string() }) },
          async (_ctx, { href }) => {
            const response = await caldav.request("GET", await caldav.resolve(href), { Accept: "text/calendar" });
            await check(response, "GET");
            const ics = await response.text();
            return { href, etag: response.headers.get("etag"), ...summarize(ics, "VEVENT"), ics };
          },
        ),
        create: mutation(
          {
            description:
              "Create an event. start and end are ISO 8601 date-times (stored in UTC) or both plain dates (YYYY-MM-DD) for an all-day event, where end is exclusive. rrule is an optional recurrence rule such as FREQ=WEEKLY;COUNT=4.",
            input: object({
              calendarUrl: string(),
              summary: string(),
              start: string(),
              end: string(),
              description: string().optional(),
              location: string().optional(),
              rrule: string().optional(),
              uid: string().optional(),
            }),
          },
          async (_ctx, input) => {
            const uid = input.uid ?? crypto.randomUUID();
            const ics = buildEvent({ ...input, uid });
            const target = new URL(`${encodeURIComponent(uid)}.ics`, (await caldav.resolve(input.calendarUrl)).toString().replace(/\/?$/, "/"));
            const response = await caldav.request("PUT", target, { "Content-Type": "text/calendar; charset=utf-8", "If-None-Match": "*" }, ics);
            await check(response, "PUT");
            return { href: target.toString(), uid, etag: response.headers.get("etag") };
          },
        ),
        update: mutation(
          {
            description:
              "Replace an event with a full iCalendar document. Fetch it with events.get, edit the ics, and pass back the href and etag; the update fails if the event changed since the etag.",
            input: object({ href: string(), ics: string(), etag: string().optional() }),
          },
          async (_ctx, { href, ics, etag }) => {
            const response = await caldav.request(
              "PUT",
              await caldav.resolve(href),
              { "Content-Type": "text/calendar; charset=utf-8", ...(etag ? { "If-Match": etag } : {}) },
              ics,
            );
            await check(response, "PUT");
            return { href, etag: response.headers.get("etag") };
          },
        ),
        delete: mutation(
          {
            description: "Delete an event by href. Pass the etag to refuse deleting a changed event.",
            input: object({ href: string(), etag: string().optional() }),
          },
          async (_ctx, { href, etag }) => {
            const response = await caldav.request("DELETE", await caldav.resolve(href), etag ? { "If-Match": etag } : {});
            await check(response, "DELETE");
            return { ok: true };
          },
        ),
      },
      { title: "Events", description: "Calendar events (VEVENT)." },
    ),
    reminders: router(
      {
        list: query(
          {
            description:
              "List reminders (VTODO) in a reminder list from calendars.list. Returns href, etag, parsed fields and raw iCalendar text.",
            input: object({ calendarUrl: string() }),
          },
          async (_ctx, { calendarUrl }) => ({ reminders: await caldav.search(calendarUrl, "VTODO", {}) }),
        ),
        get: query(
          { description: "Fetch one reminder by its href.", input: object({ href: string() }) },
          async (_ctx, { href }) => {
            const response = await caldav.request("GET", await caldav.resolve(href), { Accept: "text/calendar" });
            await check(response, "GET");
            const ics = await response.text();
            return { href, etag: response.headers.get("etag"), ...summarize(ics, "VTODO"), ics };
          },
        ),
        update: mutation(
          {
            description: "Replace a reminder with a full iCalendar document (fetch with reminders.get, edit, pass back the etag).",
            input: object({ href: string(), ics: string(), etag: string().optional() }),
          },
          async (_ctx, { href, ics, etag }) => {
            const response = await caldav.request(
              "PUT",
              await caldav.resolve(href),
              { "Content-Type": "text/calendar; charset=utf-8", ...(etag ? { "If-Match": etag } : {}) },
              ics,
            );
            await check(response, "PUT");
            return { href, etag: response.headers.get("etag") };
          },
        ),
        delete: mutation(
          {
            description: "Delete a reminder by href.",
            input: object({ href: string(), etag: string().optional() }),
          },
          async (_ctx, { href, etag }) => {
            const response = await caldav.request("DELETE", await caldav.resolve(href), etag ? { "If-Match": etag } : {});
            await check(response, "DELETE");
            return { ok: true };
          },
        ),
      },
      { title: "Reminders", description: "Reminders (VTODO) in iCloud reminder lists." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { applecalendar: apple.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.applecalendar ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Apple Calendar",
        description: "iCloud calendars, events and reminders over CalDAV.",
        instructions:
          "Start with calendars.list and use a calendar's url as calendarUrl. Events and reminders are addressed by the href that list/create returns. To edit, events.get, change the ics, then events.update with the etag.",
        icons,
      },
    ),
  }),
);

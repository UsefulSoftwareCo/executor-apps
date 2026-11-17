// Runs the curated Calendar and Gmail tools against a fake Google: each test records the requests a
// tool sends and checks them against Google's documented formats. All data is synthetic.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Effect } from "effect";
import { calendar } from "./tools/calendar.ts";
import { gmail } from "./tools/gmail.ts";
import { decodeBody, type Source } from "./tools/shared.ts";

const self = "user@example.com";
const source: Source = {
  accounts: [{ id: "acc_test", fields: { access_token: "token-1" } }],
  address: async () => self,
  api: (product) => `api.${product}`,
};

interface Call {
  readonly method: string;
  readonly path: string;
  readonly search: URLSearchParams;
  readonly body: any;
}
type Route = (call: Call) => unknown;

/** A fetch that answers `METHOD /path` from `routes` and records each request; unknown routes fail the test. */
const google = (routes: Record<string, Route>) => {
  const calls: Call[] = [];
  const fake: typeof fetch = async (url, init) => {
    const address = new URL(String(url));
    const call = {
      method: init?.method ?? "GET",
      path: address.pathname,
      search: address.searchParams,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer token-1");
    calls.push(call);
    const route = routes[`${call.method} ${call.path}`];
    if (route === undefined) throw new Error(`Unexpected request ${call.method} ${call.path}`);
    const result = route(call);
    return result === undefined ? new Response(null, { status: 204 }) : Response.json(result);
  };
  const ctx = {
    fetch: fake,
    signal: new AbortController().signal,
    cache: { forAccount: () => ({ get: ({ load }: { load: (l: unknown) => unknown }) => load({ fetch: fake, signal: ctx.signal }) }) },
  };
  return { calls, ctx };
};

const native = (tool: object): any => {
  const key = Object.getOwnPropertySymbols(tool).find((symbol) => symbol.description === "apps.Operation");
  assert.ok(key, "not an apps operation");
  return (tool as any)[key];
};
const run = (tool: object, ctx: unknown, input: object): Promise<any> => Effect.runPromise(native(tool).run(ctx, input));
/** What an operation's approval decides for a call: mutations here must ask the user. */
const approval = (tool: object) => {
  const decide = native(tool).approval;
  return decide === undefined ? undefined : Effect.runPromise(decide({ input: {} }));
};

const calendarTools = calendar(source).tools;
const gmailTools = gmail(source).tools;

test("every curated Calendar and Gmail write asks the user first, and reads do not", async () => {
  for (const [name, tool] of Object.entries({ ...calendarTools, ...gmailTools })) {
    if (tool.kind === "mutation") assert.equal(await approval(tool), "user-approval", name);
    else assert.equal(native(tool).approval, undefined, name);
  }
  for (const name of ["updateEvent", "deleteEvent"]) assert.equal(calendarTools[name as keyof typeof calendarTools].kind, "mutation");
  for (const name of ["updateDraft", "sendDraft", "deleteDraft"]) assert.equal(gmailTools[name as keyof typeof gmailTools].kind, "mutation");
  assert.equal(gmailTools.drafts.kind, "query");
});

const eventPath = "/calendar/v3/calendars/team%40example.com/events/evt_1";
const timed = {
  id: "evt_1",
  summary: "Planning",
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=evt_1",
  iCalUID: "evt_1@google.com",
  start: { dateTime: "2026-12-01T15:00:00Z", timeZone: "UTC" },
  end: { dateTime: "2026-12-01T15:45:00Z", timeZone: "UTC" },
  attendees: [
    { email: "user@example.com", self: true, responseStatus: "accepted" },
    { email: "alex@example.com", responseStatus: "accepted" },
    { email: "sam@example.com", responseStatus: "tentative" },
  ],
};

test("updateEvent moves an event, keeps its length, and sends only the changed fields", async () => {
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => timed,
    [`PATCH ${eventPath}`]: (call) => ({ ...timed, ...call.body }),
  });
  const result = await run(calendarTools.updateEvent, ctx, {
    calendarId: "team@example.com",
    eventId: "evt_1",
    start: "2026-12-02T09:30",
    timeZone: "Europe/London",
  });
  const patch = calls.find((call) => call.method === "PATCH")!;
  assert.deepEqual(patch.body, {
    start: { dateTime: "2026-12-02T09:30:00.000Z", timeZone: "Europe/London", date: null },
    end: { dateTime: "2026-12-02T10:15:00.000Z", timeZone: "Europe/London", date: null },
  });
  assert.equal(patch.search.get("sendUpdates"), "all");
  assert.equal(patch.search.has("conferenceDataVersion"), false);
  assert.equal(result.start, "2026-12-02T09:30:00.000Z");
  assert.equal(result.calendarId, "team@example.com");
  assert.equal(result.account, self);
});

test("updateEvent reads local times in the calendar's zone, not UTC", async () => {
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => timed,
    "GET /calendar/v3/users/me/settings/timezone": () => ({ value: "America/New_York" }),
    [`PATCH ${eventPath}`]: (call) => ({ ...timed, ...call.body }),
  });
  await run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-02T09:00", minutes: 60 });
  const patch = calls.find((call) => call.method === "PATCH")!;
  assert.deepEqual(patch.body.start, { dateTime: "2026-12-02T14:00:00.000Z", timeZone: "America/New_York", date: null });
  assert.deepEqual(patch.body.end, { dateTime: "2026-12-02T15:00:00.000Z", timeZone: "America/New_York", date: null });
});

test("updateEvent moves an all-day event by whole days and keeps how many days it spans", async () => {
  const allDay = { ...timed, start: { date: "2026-12-01" }, end: { date: "2026-12-04" } };
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => allDay,
    [`PATCH ${eventPath}`]: (call) => ({ ...allDay, ...call.body }),
  });
  const result = await run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-10", timeZone: "UTC" });
  assert.deepEqual(calls.at(-1)!.body, {
    start: { date: "2026-12-10", dateTime: null, timeZone: null },
    end: { date: "2026-12-13", dateTime: null, timeZone: null },
  });
  assert.equal(result.allDay, true);
});

// Patch merges start and end into what Google holds, and Google refuses an event with both a date
// and a dateTime, so a switch must clear the kind it leaves behind.
test("updateEvent switches a timed event to all-day and back, clearing the other kind", async () => {
  const toAllDay = google({
    [`GET ${eventPath}`]: () => timed,
    [`PATCH ${eventPath}`]: (call) => ({ ...timed, ...call.body }),
  });
  await run(calendarTools.updateEvent, toAllDay.ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-05", timeZone: "UTC" });
  assert.deepEqual(toAllDay.calls.at(-1)!.body, {
    start: { date: "2026-12-05", dateTime: null, timeZone: null },
    end: { date: "2026-12-06", dateTime: null, timeZone: null },
  });

  const allDay = { ...timed, start: { date: "2026-12-01" }, end: { date: "2026-12-02" } };
  const toTimed = google({
    [`GET ${eventPath}`]: () => allDay,
    [`PATCH ${eventPath}`]: (call) => ({ ...allDay, ...call.body }),
  });
  await run(calendarTools.updateEvent, toTimed.ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-01T13:00", timeZone: "UTC" });
  assert.deepEqual(toTimed.calls.at(-1)!.body, {
    start: { dateTime: "2026-12-01T13:00:00.000Z", timeZone: "UTC", date: null },
    end: { dateTime: "2026-12-01T13:30:00.000Z", timeZone: "UTC", date: null },
  });
});

test("updateEvent adds and removes attendees without touching others' responses, and can stay quiet", async () => {
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => timed,
    [`PATCH ${eventPath}`]: (call) => ({ ...timed, ...call.body }),
  });
  await run(calendarTools.updateEvent, ctx, {
    calendarId: "team@example.com",
    eventId: "evt_1",
    addAttendees: ["kim@example.com", "ALEX@example.com", "kim@example.com"],
    removeAttendees: ["Sam@Example.com"],
    summary: "Planning (moved)",
    meet: true,
    notify: false,
  });
  const patch = calls.at(-1)!;
  assert.deepEqual(patch.body.attendees, [
    { email: "user@example.com", self: true, responseStatus: "accepted" },
    { email: "alex@example.com", responseStatus: "accepted" },
    { email: "kim@example.com" },
  ]);
  assert.equal(patch.body.summary, "Planning (moved)");
  assert.equal(patch.body.conferenceData.createRequest.conferenceSolutionKey.type, "hangoutsMeet");
  assert.equal(patch.search.get("conferenceDataVersion"), "1");
  assert.equal(patch.search.get("sendUpdates"), "none");
  assert.equal("start" in patch.body, false);
});

test("updateEvent refuses an empty change or an end before the start, and writes nothing", async () => {
  for (const [input, message] of [
    [{}, /Pass at least one field to change/],
    [{ start: "2026-12-02T10:00:00Z", end: "2026-12-02T09:00:00Z" }, /must end after it starts/],
    [{ start: "2026-12-02", end: "2026-12-02T09:00:00Z" }, /both be dates/],
    [{ start: "2026-12-02", minutes: 60 }, /minutes applies to timed events/],
  ] as const) {
    const { calls, ctx } = google({ [`GET ${eventPath}`]: () => timed });
    await assert.rejects(run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", timeZone: "UTC", ...input }), message);
    assert.deepEqual(calls.map((call) => call.method), ["GET"]);
  }
});

test("deleteEvent deletes on the primary calendar by default and tells attendees unless notify is false", async () => {
  const path = "/calendar/v3/calendars/primary/events/evt%2F2";
  for (const [notify, expected] of [[undefined, "all"], [false, "none"]] as const) {
    const { calls, ctx } = google({ [`DELETE ${path}`]: () => undefined });
    const result = await run(calendarTools.deleteEvent, ctx, { eventId: "evt/2", notify });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.search.get("sendUpdates"), expected);
    assert.deepEqual(result, { account: self, calendarId: "primary", eventId: "evt/2", deleted: true });
  }
});

const draftMessage = (id: string, subject: string, date: string) => ({
  id: `msg_${id}`,
  threadId: `thr_${id}`,
  snippet: `About ${subject}`,
  internalDate: String(Date.parse(date)),
  payload: {
    headers: [
      { name: "To", value: "alex@example.com" },
      { name: "Subject", value: subject },
    ],
  },
});

test("drafts lists drafts newest first with their recipients and subject", async () => {
  const { calls, ctx } = google({
    "GET /gmail/v1/users/me/drafts": () => ({ drafts: [{ id: "d1" }, { id: "d2" }] }),
    "GET /gmail/v1/users/me/drafts/d1": () => ({ id: "d1", message: draftMessage("1", "Older", "2026-11-01T10:00:00Z") }),
    "GET /gmail/v1/users/me/drafts/d2": () => ({ id: "d2", message: draftMessage("2", "Newer", "2026-11-02T10:00:00Z") }),
  });
  const result = await run(gmailTools.drafts, ctx, { query: "subject:plan", max: 5 });
  assert.equal(calls[0]!.search.get("q"), "subject:plan");
  assert.equal(calls[0]!.search.get("maxResults"), "5");
  assert.ok(calls.slice(1).every((call) => call.search.get("format") === "metadata"));
  assert.deepEqual(result, {
    drafts: [
      {
        account: self,
        draftId: "d2",
        messageId: "msg_2",
        threadId: "thr_2",
        to: "alex@example.com",
        cc: "",
        subject: "Newer",
        date: "2026-11-02T10:00:00.000Z",
        snippet: "About Newer",
      },
      {
        account: self,
        draftId: "d1",
        messageId: "msg_1",
        threadId: "thr_1",
        to: "alex@example.com",
        cc: "",
        subject: "Older",
        date: "2026-11-01T10:00:00.000Z",
        snippet: "About Older",
      },
    ],
    errors: [],
  });
});

test("sendDraft posts the draft's ID as JSON to drafts/send", async () => {
  const { calls, ctx } = google({ "POST /gmail/v1/users/me/drafts/send": () => ({ id: "msg_9", threadId: "thr_9", labelIds: ["SENT"] }) });
  const result = await run(gmailTools.sendDraft, ctx, { draftId: "d9" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [["POST", "/gmail/v1/users/me/drafts/send", { id: "d9" }]]);
  assert.deepEqual(result, { account: self, draftId: "d9", messageId: "msg_9", threadId: "thr_9" });
});

test("deleteDraft deletes the draft", async () => {
  const { calls, ctx } = google({ "DELETE /gmail/v1/users/me/drafts/d%2F3": () => undefined });
  const result = await run(gmailTools.deleteDraft, ctx, { draftId: "d/3" });
  assert.equal(calls.length, 1);
  assert.deepEqual(result, { account: self, draftId: "d/3", deleted: true });
});

test("updateDraft rewrites the draft as a new RFC 2822 message in the same thread", async () => {
  const { calls, ctx } = google({
    "GET /gmail/v1/users/me/drafts/d4": () => ({ id: "d4", message: { id: "msg_4", threadId: "thr_4" } }),
    "PUT /gmail/v1/users/me/drafts/d4": (call) => ({ id: "d4", message: { id: "msg_5", threadId: call.body.message.threadId } }),
  });
  const result = await run(gmailTools.updateDraft, ctx, { draftId: "d4", to: ["alex@example.com"], subject: "Plan, take two", body: "Revised text" });
  assert.equal(calls[0]!.search.get("format"), "minimal");
  const put = calls[1]!;
  assert.equal(put.body.id, "d4");
  assert.equal(put.body.message.threadId, "thr_4");
  const mime = decodeBody(put.body.message.raw);
  assert.match(mime, /^To: alex@example\.com\r\n/m);
  assert.match(mime, /^Subject: Plan, take two\r\n/m);
  assert.equal(decodeBody(mime.split("\r\n\r\n")[1]!.replaceAll("\r\n", "")), "Revised text");
  assert.deepEqual(result, { account: self, draftId: "d4", messageId: "msg_5", threadId: "thr_4" });
});

// Runs the curated Calendar and Gmail tools against a fake Google: each test records the requests a
// tool sends and checks them against Google's documented formats. All data is synthetic.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Effect } from "effect";
import { calendar } from "./tools/calendar.ts";
import { gmail } from "./tools/gmail.ts";
import { approvalElicitation } from "apps/contracts";
import { base64url, decodeBody, parseTime, type Source } from "./tools/shared.ts";

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
  readonly headers: Headers;
  readonly body: any;
}
/** Answers a request: a value is sent as JSON, undefined as 204, and a Response as it is. */
type Route = (call: Call) => unknown;

/** Text that only ever appears in a fake Google error body: no error message may contain it. */
const privateBody = "PRIVATE-BODY-subject-Quarterly-salaries";
const status = (code: number) => new Response(JSON.stringify({ error: { code, message: privateBody } }), { status: code });

/** A fetch that answers `METHOD /path` from `routes` and records each request; unknown routes fail the test. */
const google = (routes: Record<string, Route>) => {
  const calls: Call[] = [];
  const fake: typeof fetch = async (url, init) => {
    const address = new URL(String(url));
    const call = {
      method: init?.method ?? "GET",
      path: address.pathname,
      search: address.searchParams,
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    assert.equal(call.headers.get("authorization"), "Bearer token-1");
    calls.push(call);
    const route = routes[`${call.method} ${call.path}`];
    if (route === undefined) throw new Error(`Unexpected request ${call.method} ${call.path}`);
    const result = route(call);
    if (result instanceof Response) return result;
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
/** The fields a tool's declared input has, which its approval prompt shows. */
const fields = (tool: object) => Object.keys(native(tool).input.fields);

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

// ---------------------------------------------------------------------------------------------
// Calendar

const eventPath = "/calendar/v3/calendars/team%40example.com/events/evt_1";
const timed = {
  id: "evt_1",
  etag: '"etag-1"',
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
/** An event with no one on it but the account itself. */
const solo = { ...timed, attendees: undefined };

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
    affectsGuests: true,
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

// The account is in New York; the calendar being edited is in London. 09:00 is 09:00 in London.
test("updateEvent and createEvent read local times in the selected calendar's own zone, not the account's", async () => {
  const routes = {
    "GET /calendar/v3/users/me/settings/timezone": () => ({ value: "America/New_York" }),
    "GET /calendar/v3/calendars/team%40example.com": () => ({ timeZone: "Europe/London" }),
    [`GET ${eventPath}`]: () => solo,
    [`PATCH ${eventPath}`]: (call: Call) => ({ ...solo, ...call.body }),
    "POST /calendar/v3/calendars/team%40example.com/events": (call: Call) => ({ ...solo, ...call.body }),
  };
  const update = google(routes);
  await run(calendarTools.updateEvent, update.ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-02T09:00", minutes: 60 });
  const patch = update.calls.find((call) => call.method === "PATCH")!;
  assert.deepEqual(patch.body.start, { dateTime: "2026-12-02T09:00:00.000Z", timeZone: "Europe/London", date: null });
  assert.deepEqual(patch.body.end, { dateTime: "2026-12-02T10:00:00.000Z", timeZone: "Europe/London", date: null });
  assert.equal(update.calls.some((call) => call.path.endsWith("/settings/timezone")), false);

  const create = google(routes);
  await run(calendarTools.createEvent, create.ctx, { calendarId: "team@example.com", summary: "Review", start: "2026-12-02T09:00" });
  const post = create.calls.find((call) => call.method === "POST")!;
  assert.deepEqual(post.body.start, { dateTime: "2026-12-02T09:00:00.000Z", timeZone: "Europe/London" });

  // An explicit zone still wins over the calendar's.
  const explicit = google(routes);
  await run(calendarTools.updateEvent, explicit.ctx, {
    calendarId: "team@example.com",
    eventId: "evt_1",
    start: "2026-12-02T09:00",
    timeZone: "America/New_York",
  });
  assert.equal(explicit.calls.find((call) => call.method === "PATCH")!.body.start.dateTime, "2026-12-02T14:00:00.000Z");
});

// The account is in New York; the slot is booked on a calendar in London. 09:00 New York is 14:00Z.
test("a free slot from freeBusy goes straight into createEvent on a calendar in another zone and keeps its instant", async () => {
  const { calls, ctx } = google({
    "GET /calendar/v3/users/me/settings/timezone": () => ({ value: "America/New_York" }),
    "GET /calendar/v3/users/me/calendarList": () => ({ items: [{ id: self, primary: true, accessRole: "owner" }] }),
    "POST /calendar/v3/freeBusy": () => ({ calendars: { [self]: { busy: [{ start: "2026-12-02T15:00:00Z", end: "2026-12-02T16:00:00Z" }] } } }),
    "GET /calendar/v3/calendars/team%40example.com": () => ({ timeZone: "Europe/London" }),
    "POST /calendar/v3/calendars/team%40example.com/events": (call) => ({ ...solo, ...call.body }),
  });
  const availability = await run(calendarTools.freeBusy, ctx, { from: "2026-12-02", days: 1 });
  assert.deepEqual(availability.busy, [{ start: "2026-12-02T10:00:00-05:00", end: "2026-12-02T11:00:00-05:00" }]);
  assert.deepEqual(availability.free[0], { start: "2026-12-02T09:00:00-05:00", end: "2026-12-02T10:00:00-05:00", minutes: 60 });
  await run(calendarTools.createEvent, ctx, { calendarId: "team@example.com", summary: "Sync", start: availability.free[0].start, minutes: 30 });
  const post = calls.find((call) => call.method === "POST" && call.path.endsWith("/events"))!;
  assert.equal(post.body.start.dateTime, "2026-12-02T14:00:00.000Z");
  assert.equal(post.body.end.dateTime, "2026-12-02T14:30:00.000Z");
});

test("updateEvent moves an all-day event by whole days and keeps how many days it spans", async () => {
  const allDay = { ...solo, start: { date: "2026-12-01" }, end: { date: "2026-12-04" } };
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
    [`GET ${eventPath}`]: () => solo,
    [`PATCH ${eventPath}`]: (call) => ({ ...solo, ...call.body }),
  });
  await run(calendarTools.updateEvent, toAllDay.ctx, { calendarId: "team@example.com", eventId: "evt_1", start: "2026-12-05", timeZone: "UTC" });
  assert.deepEqual(toAllDay.calls.at(-1)!.body, {
    start: { date: "2026-12-05", dateTime: null, timeZone: null },
    end: { date: "2026-12-06", dateTime: null, timeZone: null },
  });

  const allDay = { ...solo, start: { date: "2026-12-01" }, end: { date: "2026-12-02" } };
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
    affectsGuests: true,
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

// Between the read and the write, someone else adds a guest and Sam changes their answer. The write
// is conditional on the version read, so Google refuses it, and the tool works the change out again.
test("updateEvent writes only the version it read, and on a conflict reads again and keeps the other change", async () => {
  const changed = {
    ...timed,
    etag: '"etag-2"',
    attendees: [
      { email: "user@example.com", self: true, responseStatus: "accepted" },
      { email: "alex@example.com", responseStatus: "accepted" },
      { email: "sam@example.com", responseStatus: "declined" },
      { email: "lee@example.com", responseStatus: "needsAction" },
    ],
  };
  let reads = 0;
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => (reads++ === 0 ? timed : changed),
    [`PATCH ${eventPath}`]: (call) => (call.headers.get("if-match") === changed.etag ? { ...changed, ...call.body } : status(412)),
  });
  await run(calendarTools.updateEvent, ctx, {
    calendarId: "team@example.com",
    eventId: "evt_1",
    addAttendees: ["kim@example.com"],
    removeAttendees: ["alex@example.com"],
    affectsGuests: true,
  });
  const patches = calls.filter((call) => call.method === "PATCH");
  assert.deepEqual(
    patches.map((call) => call.headers.get("if-match")),
    ['"etag-1"', '"etag-2"'],
  );
  assert.deepEqual(patches[1]!.body.attendees, [
    { email: "user@example.com", self: true, responseStatus: "accepted" },
    { email: "sam@example.com", responseStatus: "declined" },
    { email: "lee@example.com", responseStatus: "needsAction" },
    { email: "kim@example.com" },
  ]);
});

test("updateEvent gives up after three conflicts, and refuses to rewrite a guest list Google shortened", async () => {
  const busy = google({ [`GET ${eventPath}`]: () => timed, [`PATCH ${eventPath}`]: () => status(412) });
  await assert.rejects(
    run(calendarTools.updateEvent, busy.ctx, { calendarId: "team@example.com", eventId: "evt_1", addAttendees: ["kim@example.com"], affectsGuests: true }),
    /changed by someone else each time it was read \(3 tries\), so nothing was changed/,
  );
  assert.equal(busy.calls.filter((call) => call.method === "PATCH").length, 3);

  const shortened = google({ [`GET ${eventPath}`]: () => ({ ...timed, attendeesOmitted: true }) });
  await assert.rejects(
    run(calendarTools.updateEvent, shortened.ctx, { calendarId: "team@example.com", eventId: "evt_1", removeAttendees: ["sam@example.com"], affectsGuests: true }),
    /attendeesOmitted.*Nothing was changed/,
  );
  assert.deepEqual(shortened.calls.map((call) => call.method), ["GET"]);
});

test("respond writes its answer only to the version of the event it read", async () => {
  const { calls, ctx } = google({
    [`GET ${eventPath}`]: () => timed,
    [`PATCH ${eventPath}`]: (call) => ({ ...timed, ...call.body }),
  });
  await run(calendarTools.respond, ctx, { calendarId: "team@example.com", eventId: "evt_1", response: "declined" });
  assert.equal(calls.at(-1)!.headers.get("if-match"), '"etag-1"');
  assert.equal(calls.at(-1)!.body.attendees[0].responseStatus, "declined");
});

test("updateEvent refuses an empty change, an end before the start, or a change guests would see unannounced, and writes nothing", async () => {
  for (const [event, input, message] of [
    [solo, {}, /Pass at least one field to change/],
    [solo, { start: "2026-12-02T10:00:00Z", end: "2026-12-02T09:00:00Z" }, /must end after it starts/],
    [solo, { start: "2026-12-02", end: "2026-12-02T09:00:00Z" }, /both be dates/],
    [solo, { start: "2026-12-02", minutes: 60 }, /minutes applies to timed events/],
    [timed, { summary: "Renamed" }, /other guests, so the change would show on their calendars too and email them. Nothing was changed/],
    [timed, { summary: "Renamed", notify: false, affectsGuests: false }, /other guests/],
    [solo, { addAttendees: ["kim@example.com"] }, /other guests/],
    [{ ...solo, attendeesOmitted: true }, { summary: "Renamed" }, /other guests/],
  ] as const) {
    const { calls, ctx } = google({ [`GET ${eventPath}`]: () => event });
    await assert.rejects(run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", timeZone: "UTC", ...input }), message);
    assert.deepEqual(calls.map((call) => call.method), ["GET"]);
  }
});

test("deleteEvent deletes on the primary calendar by default, only the version it read, and tells attendees unless notify is false", async () => {
  const path = "/calendar/v3/calendars/primary/events/evt_2";
  for (const [notify, expected] of [[undefined, "all"], [false, "none"]] as const) {
    const { calls, ctx } = google({ [`GET ${path}`]: () => ({ ...timed, id: "evt_2" }), [`DELETE ${path}`]: () => undefined });
    const result = await run(calendarTools.deleteEvent, ctx, { eventId: "evt_2", notify, affectsGuests: true });
    assert.deepEqual(calls.map((call) => call.method), ["GET", "DELETE"]);
    assert.equal(calls[1]!.search.get("sendUpdates"), expected);
    assert.equal(calls[1]!.headers.get("if-match"), '"etag-1"');
    assert.deepEqual(result, { account: self, calendarId: "primary", eventId: "evt_2", deleted: true });
  }
  const { calls, ctx } = google({ [`GET ${path}`]: () => ({ ...timed, id: "evt_2" }) });
  await assert.rejects(run(calendarTools.deleteEvent, ctx, { eventId: "evt_2" }), /other guests.*Nothing was deleted.*affectsGuests: true/);
  assert.deepEqual(calls.map((call) => call.method), ["GET"]);
});

// ".." would make `calendars/team%40example.com/events/..` resolve to the calendar itself.
test("every Calendar and Gmail tool refuses an ID that is not one before sending anything", async () => {
  const send = { account: self, from: "", sender: "", replyTo: "", to: "", cc: "", bcc: "", subject: "", format: "", body: "", attachments: [], version: "v" };
  const cases: [object, (id: string) => object][] = [
    [calendarTools.updateEvent, (id) => ({ calendarId: "team@example.com", eventId: id, summary: "x", affectsGuests: true })],
    [calendarTools.updateEvent, (id) => ({ calendarId: id, eventId: "evt_1", summary: "x", affectsGuests: true })],
    [calendarTools.deleteEvent, (id) => ({ calendarId: "team@example.com", eventId: id, affectsGuests: true })],
    [calendarTools.deleteEvent, (id) => ({ calendarId: id, eventId: "evt_1", affectsGuests: true })],
    [calendarTools.respond, (id) => ({ eventId: id, response: "accepted" })],
    [calendarTools.createEvent, (id) => ({ calendarId: id, summary: "x", start: "2026-12-02T09:00:00Z" })],
    [gmailTools.readThread, (id) => ({ threadId: id })],
    [gmailTools.readMessage, (id) => ({ messageId: id })],
    [gmailTools.attachment, (id) => ({ messageId: "msg_1", attachmentId: id })],
    [gmailTools.attachment, (id) => ({ messageId: id, attachmentId: "att_1" })],
    [gmailTools.modify, (id) => ({ threadIds: ["thr_1", id], archive: true })],
    [gmailTools.send, (id) => ({ to: ["alex@example.com"], body: "x", replyToMessageId: id })],
    [gmailTools.draft, (id) => ({ body: "x", replyToMessageId: id })],
    [gmailTools.updateDraft, (id) => ({ draftId: id, body: "x" })],
    [gmailTools.readDraft, (id) => ({ draftId: id })],
    [gmailTools.sendDraft, (id) => ({ ...send, draftId: id })],
    [gmailTools.deleteDraft, (id) => ({ draftId: id })],
  ];
  for (const [tool, input] of cases)
    for (const id of ["..", ".", "", " ", "evt_1/..", "../evt_1", "evt 1", "evt_1\n", "a\\b"]) {
      const { calls, ctx } = google({});
      await assert.rejects(run(tool, ctx, input(id)), /is not a Google ID/, `${JSON.stringify(input(id))}`);
      assert.equal(calls.length, 0);
    }
});

// ---------------------------------------------------------------------------------------------
// Local times

const iso = (instant: number) => new Date(instant).toISOString();

// These results are what parseTime gave before it kept seconds and refused times that do not exist
// once; they must not change.
test("parseTime reads valid local times, dates, offsets and relative days as before", () => {
  const now = Date.parse("2026-12-02T03:00:00Z");
  for (const [value, zone, expected] of [
    ["2026-12-02T09:00", "America/New_York", "2026-12-02T14:00:00.000Z"],
    ["2026-07-02T09:00", "America/New_York", "2026-07-02T13:00:00.000Z"],
    ["2026-12-02T09:00", "Europe/London", "2026-12-02T09:00:00.000Z"],
    ["2026-07-02T09:00", "Europe/London", "2026-07-02T08:00:00.000Z"],
    ["2026-07-02T09:00", "Asia/Kolkata", "2026-07-02T03:30:00.000Z"],
    ["2026-03-08T01:30", "America/New_York", "2026-03-08T06:30:00.000Z"],
    ["2026-03-08T03:30", "America/New_York", "2026-03-08T07:30:00.000Z"],
    ["2026-11-01T02:30", "America/New_York", "2026-11-01T07:30:00.000Z"],
    ["2026-03-29T02:30", "Europe/London", "2026-03-29T01:30:00.000Z"],
    ["2026-12-02T09:00:00", "America/New_York", "2026-12-02T14:00:00.000Z"],
    ["2026-12-02", "America/New_York", "2026-12-02T05:00:00.000Z"],
    ["2026-12-02T09:00:00-05:00", "Europe/London", "2026-12-02T14:00:00.000Z"],
    ["2026-12-02T14:00:00Z", "America/New_York", "2026-12-02T14:00:00.000Z"],
    ["today", "America/New_York", "2026-12-01T05:00:00.000Z"],
    ["tomorrow", "America/New_York", "2026-12-02T05:00:00.000Z"],
    ["now", "America/New_York", "2026-12-02T03:00:00.000Z"],
  ] as const)
    assert.equal(iso(parseTime(value, zone, now)), expected, `${value} in ${zone}`);
});

test("parseTime keeps seconds and milliseconds of a local time", () => {
  assert.equal(iso(parseTime("2026-12-02T09:00:30", "America/New_York")), "2026-12-02T14:00:30.000Z");
  assert.equal(iso(parseTime("2026-12-02T09:00:30.25", "America/New_York")), "2026-12-02T14:00:30.250Z");
});

test("parseTime refuses a local time the clocks skip, and asks for an offset for one they pass twice", () => {
  assert.throws(() => parseTime("2026-03-08T02:30", "America/New_York"), /2026-03-08T02:30:00 does not exist in America\/New_York/);
  assert.throws(() => parseTime("2026-03-29T01:15", "Europe/London"), /does not exist in Europe\/London/);
  assert.throws(
    () => parseTime("2026-11-01T01:30", "America/New_York"),
    /happens twice in America\/New_York.*2026-11-01T01:30:00-04:00 or 2026-11-01T01:30:00-05:00/,
  );
  // Either offset then reads exactly.
  assert.equal(iso(parseTime("2026-11-01T01:30:00-04:00", "America/New_York")), "2026-11-01T05:30:00.000Z");
  assert.equal(iso(parseTime("2026-11-01T01:30:00-05:00", "America/New_York")), "2026-11-01T06:30:00.000Z");
});

// ---------------------------------------------------------------------------------------------
// Gmail

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

/** A MIME part of a fake draft: a leaf with its content, or a container of parts. */
interface Piece {
  readonly type: string;
  readonly content?: string;
  readonly filename?: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** Gmail keeps the data apart, under an attachmentId, instead of in the message. */
  readonly stored?: boolean;
  readonly parts?: readonly Piece[];
}

/**
 * A draft as Gmail returns it, built from one set of parts: `full` (parsed parts, as readDraft reads
 * them) and `raw` (the MIME text that is sent). `id` names this version of its message.
 */
const fakeDraft = (id: string, headers: readonly (readonly [string, string])[], top: Piece) => {
  const lines = (pairs: readonly (readonly [string, string])[]) => pairs.map(([name, value]) => `${name}: ${value}`);
  const own = (piece: Piece) => Object.entries(piece.headers ?? {});
  const full = (piece: Piece, outer: readonly (readonly [string, string])[]): any => {
    const leaf = piece.parts === undefined;
    const named = [...outer, ["Content-Type", piece.type], ...own(piece), ...(leaf ? [["Content-Transfer-Encoding", "base64"]] : [])];
    const part = { mimeType: piece.type, filename: piece.filename ?? "", headers: named.map(([name, value]) => ({ name, value })) };
    if (!leaf) return { ...part, body: { size: 0 }, parts: piece.parts!.map((child) => full(child, [])) };
    const size = Buffer.byteLength(piece.content ?? "");
    return { ...part, body: piece.stored ? { attachmentId: `att_${piece.filename}`, size } : { data: base64url(piece.content ?? ""), size } };
  };
  const mime = (piece: Piece, outer: readonly (readonly [string, string])[], path: string): string[] => {
    if (piece.parts !== undefined)
      return [
        ...lines(outer),
        `Content-Type: ${piece.type}; boundary="b${path}"`,
        ...lines(own(piece)),
        "",
        ...piece.parts.flatMap((child, index) => [`--b${path}`, ...mime(child, [], `${path}.${index}`)]),
        `--b${path}--`,
      ];
    const type = piece.filename ? `${piece.type}; name="${piece.filename}"` : `${piece.type}; charset="UTF-8"`;
    return [...lines(outer), `Content-Type: ${type}`, ...lines(own(piece)), "Content-Transfer-Encoding: base64", "", Buffer.from(piece.content ?? "").toString("base64")];
  };
  const message = { id: `msg_${id}`, threadId: "thr_9", payload: full(top, headers) };
  const raw = base64url(mime(top, headers, "0").join("\r\n"));
  const route = (call: Call) =>
    call.search.get("format") === "raw" ? { id: "d9", message: { id: message.id, threadId: message.threadId, raw } } : { id: "d9", message };
  return Object.assign(route, { raw, message });
};

const addressed = (subject = "Plan for Q1") =>
  [
    ["From", "User <user@example.com>"],
    ["To", "alex@example.com"],
    ["Cc", "sam@example.com"],
    ["Bcc", "kim@example.com"],
    ["Subject", subject],
    ["MIME-Version", "1.0"],
  ] as const;
const planText = "Hi Alex,\n\nHere is the plan: Q1 doc <https://docs.example.com/q1>\n";
const planHtml = '<div dir="ltr">Hi Alex,<br><br>Here is the plan: <a href="https://docs.example.com/q1">Q1 doc</a></div>';
const pdf = { type: "application/pdf", filename: "plan.pdf", content: "%PDF-1.4 synthetic", stored: true, headers: { "Content-Disposition": 'attachment; filename="plan.pdf"' } };
/** A plain-text draft with the same text in HTML, a link and a PDF; `edit` 1 is the same draft edited later. */
const plan = (edit = 0) => {
  const edited = (value: string) => (edit === 0 ? value : value.replace("the plan:", "the new plan:"));
  return fakeDraft(`d9_${edit}`, addressed(edit === 0 ? "Plan for Q1" : "Plan for Q1 (revised)"), {
    type: "multipart/mixed",
    parts: [{ type: "multipart/alternative", parts: [{ type: "text/plain", content: edited(planText) }, { type: "text/html", content: edited(planHtml) }] }, pdf],
  });
};

/** The first 16 bytes of a SHA-256 hash, in hex: how a draft's raw message is versioned. */
const sha = async (text: string) =>
  Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))
    .subarray(0, 16)
    .toString("hex");

/** sendDraft's input for the unedited plan: what the person approves. */
const approved = async () => ({
  account: self,
  draftId: "d9",
  from: "User <user@example.com>",
  sender: "",
  replyTo: "",
  to: "alex@example.com",
  cc: "sam@example.com",
  bcc: "kim@example.com",
  subject: "Plan for Q1",
  format: "plain text, with an HTML copy of the same text",
  body: planText,
  attachments: ["plan.pdf (application/pdf, 18 bytes)"],
  version: await sha(plan().raw),
});
const sent = () => ({ id: "msg_sent", threadId: "thr_9", labelIds: ["SENT"] });
/** The prompt Executor shows for a call, from the `apps` host's own printer. */
const prompt = (input: object) => approvalElicitation("gmail.sendDraft", input as never).message;

test("readDraft shows the whole draft as it would be sent, the approval shows all of it, and sendDraft sends exactly that", async () => {
  const draft = plan();
  const { calls, ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": draft, "POST /gmail/v1/users/me/drafts/send": sent });
  const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
  assert.deepEqual(read.send, await approved());
  // The approval shows the input, so sendDraft's input must carry the content, not only an ID.
  assert.deepEqual(fields(gmailTools.sendDraft), Object.keys(read.send));
  const shown = prompt(read.send);
  assert.match(shown, /^Approve gmail\.sendDraft\?\n\nArguments:\n/);
  assert.ok(shown.includes(JSON.stringify(planText)), "the complete body is in the approval");

  const result = await run(gmailTools.sendDraft, ctx, read.send);
  const post = calls.find((call) => call.method === "POST")!;
  assert.deepEqual(post.body, { id: "d9", message: { raw: draft.raw, threadId: "thr_9" } });
  assert.deepEqual(result, { account: self, draftId: "d9", messageId: "msg_sent", threadId: "thr_9" });
});

test("sendDraft sends nothing when the draft is not what was approved", async () => {
  // The person approved the unedited draft; it was edited afterwards.
  const edited = google({ "GET /gmail/v1/users/me/drafts/d9": plan(1), "POST /gmail/v1/users/me/drafts/send": sent });
  await assert.rejects(run(gmailTools.sendDraft, edited.ctx, await approved()), /Nothing was sent.*\(subject, body, version differ\).*readDraft/);
  assert.equal(edited.calls.some((call) => call.method === "POST"), false);
  // The shown fields must also be the draft's: a caller cannot show one recipient and send to another.
  const { calls, ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": plan(), "POST /gmail/v1/users/me/drafts/send": sent });
  await assert.rejects(run(gmailTools.sendDraft, ctx, { ...(await approved()), to: "someone@example.com" }), /Nothing was sent.*\(to differ\)/);
  await assert.rejects(run(gmailTools.sendDraft, ctx, { ...(await approved()), account: "acc_test" }), /Nothing was sent.*\(account differ\)/);
  assert.equal(calls.some((call) => call.method === "POST"), false);
});

const plainOnly = (content: string) => ({ type: "text/plain", content });
const htmlOnly = (content: string) => ({ type: "text/html", content });
const alternative = (plain: string, html: string) => ({ type: "multipart/alternative", parts: [plainOnly(plain), htmlOnly(html)] });

test("sendDraft refuses a draft its approval could not show in full, and sends nothing", async () => {
  const basic = [["From", "user@example.com"], ["To", "alex@example.com"], ["Subject", "Lunch"]] as const;
  for (const [headers, top, reason] of [
    [basic, alternative("Lunch at noon?\n", "<p>Wire the deposit to account 12345 today.</p>"), /its HTML version says something other than its plain text/],
    [basic, alternative("Reset your password here.\n", '<p>Reset your password <a href="https://evil.example/reset">here</a>.</p>'), /HTML version says something other/],
    [basic, htmlOnly('<p>Hi</p><img src="https://tracker.example/p.gif">'), /its HTML loads an image from the web/],
    [basic, htmlOnly("<style>p { display: none }</style><p>Hi</p>"), /its HTML uses a <style> element/],
    [basic, htmlOnly('<p style="background: url(https://tracker.example/p.gif)">Hi</p>'), /attribute that loads or runs something/],
    [basic, plainOnly("All good. ".repeat(450)), /too long for an approval to show in full \(\d+ characters as the approval prints it; the limit is 4000\)/],
    [[...basic, ["Disposition-Notification-To", "alex@example.com"]], plainOnly("Hi"), /it has a Disposition-Notification-To header, which the approval would not show/],
    [[...basic, ["To", "other@example.com"]], plainOnly("Hi"), /it has more than one To header/],
    [basic, { type: "multipart/mixed", parts: [plainOnly("Hi"), plainOnly("Hidden second part")] }, /it has more than one text part/],
  ] as const) {
    const { calls, ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": fakeDraft("odd", headers, top), "POST /gmail/v1/users/me/drafts/send": sent });
    const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
    assert.equal(read.send, undefined, String(reason));
    assert.match(read.cannotSend, reason);
    assert.match(read.cannotSend, /^sendDraft only sends a draft whose whole content its approval shows, and .*The person can open the draft in Gmail and send it from there\.$/);
    const error: Error = await run(gmailTools.sendDraft, ctx, { ...(await approved()), version: "approved-elsewhere" }).then(
      () => assert.fail("sent"),
      (error) => error,
    );
    assert.match(error.message, /^Nothing was sent: sendDraft only sends a draft whose whole content its approval shows, and /);
    assert.match(error.message, reason);
    assert.match(error.message, /The person can open the draft in Gmail and send it from there\.$/);
    assert.equal(calls.some((call) => call.method === "POST"), false, String(reason));
  }
});

// The limit is the host's: the longest body sendDraft accepts is shown exactly, one more character is refused.
test("sendDraft's size limit is exactly where Executor's approval stops showing arguments in full", async () => {
  const read = async (length: number) => {
    const { ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": fakeDraft(`x${length}`, addressed(), plainOnly("x".repeat(length))) });
    return run(gmailTools.readDraft, ctx, { draftId: "d9" });
  };
  const small = (await read(10)).send;
  const longest = 10 + 4000 - JSON.stringify(small, null, 2).length;
  const fits = await read(longest);
  assert.ok(fits.send, "the longest body that fits is sendable");
  assert.match(prompt(fits.send), /^Approve gmail\.sendDraft\?\n\nArguments:\n/);
  assert.ok(prompt(fits.send).includes(JSON.stringify("x".repeat(longest))));
  const over = await read(longest + 1);
  assert.equal(over.send, undefined);
  assert.match(prompt({ ...fits.send, body: "x".repeat(longest + 1) }), /^Approve gmail\.sendDraft\?\n\nArguments, shortened for review/);
});

test("readDraft shows Sender and Reply-To, and an HTML-only draft as its text with each link's real target", async () => {
  const headers = [
    ["From", "User <user@example.com>"],
    ["Sender", "assistant@example.com"],
    ["Reply-To", "Billing <billing@example.net>"],
    ["To", "alex@example.com"],
    ["Subject", "Your account"],
  ] as const;
  const draft = fakeDraft("html", headers, htmlOnly("<p>Reset your password <a href='https://example.net/reset?a=1&amp;b=2'>here</a>.</p>"));
  const { calls, ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": draft, "POST /gmail/v1/users/me/drafts/send": sent });
  const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
  assert.equal(read.send.sender, "assistant@example.com");
  assert.equal(read.send.replyTo, "Billing <billing@example.net>");
  assert.equal(read.send.format, "HTML, shown as text with each link's target in <>");
  assert.equal(read.send.body, "Reset your password here <https://example.net/reset?a=1&b=2>.");
  await run(gmailTools.sendDraft, ctx, read.send);
  assert.equal(calls.at(-1)!.body.message.raw, draft.raw);
});

test("every attachment is listed by what it is, wherever Gmail keeps its data, inline images included", async () => {
  const draft = fakeDraft("files", addressed(), {
    type: "multipart/mixed",
    parts: [
      {
        type: "multipart/related",
        parts: [
          alternative("See attached.\n", '<p>See attached.</p><img src="cid:logo1" alt="">'),
          { type: "image/png", filename: "logo.png", content: "PNG-synthetic", headers: { "Content-Disposition": "inline", "Content-ID": "<logo1>" } },
        ],
      },
      // Small enough for Gmail to keep its data in the message: no attachmentId.
      { type: "application/pdf", filename: "invoice.pdf", content: "%PDF synthetic", headers: { "Content-Disposition": 'attachment; filename="invoice.pdf"' } },
      pdf,
    ],
  });
  const { ctx } = google({
    "GET /gmail/v1/users/me/drafts/d9": draft,
    "GET /gmail/v1/users/me/messages/msg_files": () => draft.message,
    "GET /gmail/v1/users/me/labels": () => ({ labels: [] }),
  });
  const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
  assert.deepEqual(read.send.attachments, [
    "logo.png (image/png, 13 bytes, shown in the body)",
    "invoice.pdf (application/pdf, 14 bytes)",
    "plan.pdf (application/pdf, 18 bytes)",
  ]);
  assert.equal(read.send.body, "See attached.\n");
  const message = await run(gmailTools.readMessage, ctx, { messageId: "msg_files" });
  assert.deepEqual(
    message.attachments.map((a: { filename: string }) => a.filename),
    ["logo.png", "invoice.pdf", "plan.pdf"],
  );
});

test("a send whose outcome is unknown says to check Sent and the draft before retrying", async () => {
  for (const [code, message] of [
    [503, /did not confirm the send \(it answered 503\), so the message may or may not have gone.*in:sent.*gmail\.drafts/],
    [404, /answered 404\. No such draft: it may have been sent or deleted already/],
  ] as const) {
    const { ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": plan(), "POST /gmail/v1/users/me/drafts/send": () => status(code) });
    const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
    const error: Error = await run(gmailTools.sendDraft, ctx, read.send).then(
      () => assert.fail("sent"),
      (error) => error,
    );
    assert.match(error.message, message);
    assert.equal(error.message.includes(privateBody), false);
  }
  const { ctx } = google({ "POST /gmail/v1/users/me/messages/send": () => status(500) });
  await assert.rejects(run(gmailTools.send, ctx, { to: ["alex@example.com"], body: "Hi" }), /may or may not have gone.*in:sent/);
});

test("failures name the status and a safe next step, never Google's response body", async () => {
  for (const [code, step] of [
    [401, /reconnect the Google account/],
    [403, /lack access to this item.*reconnect it/],
    [404, /Not found/],
    [409, /Conflict/],
    [429, /rate limiting this account: wait a minute/],
    [500, /temporary problem/],
  ] as const) {
    const { ctx } = google({ "GET /gmail/v1/users/me/messages/msg_1": () => status(code), "GET /gmail/v1/users/me/labels": () => ({ labels: [] }) });
    const error: Error = await run(gmailTools.readMessage, ctx, { messageId: "msg_1" }).then(
      () => assert.fail("no error"),
      (error) => error,
    );
    assert.match(error.message, new RegExp(`Google answered ${code}\\.`));
    assert.match(error.message, step);
    assert.equal(error.message.includes(privateBody), false);
  }
});

test("deleteDraft deletes the draft", async () => {
  const { calls, ctx } = google({ "DELETE /gmail/v1/users/me/drafts/d3": () => undefined });
  const result = await run(gmailTools.deleteDraft, ctx, { draftId: "d3" });
  assert.equal(calls.length, 1);
  assert.deepEqual(result, { account: self, draftId: "d3", deleted: true });
});

const mimeOf = (call: Call) => decodeBody(call.body.message.raw);
const replyDraft = {
  id: "d4",
  message: {
    id: "msg_4",
    threadId: "thr_4",
    payload: {
      headers: [
        { name: "Subject", value: "Re: Plan" },
        { name: "In-Reply-To", value: "<orig-1@example.com>" },
        { name: "References", value: "<root-0@example.com> <orig-1@example.com>" },
      ],
    },
  },
};

test("updateDraft rewrites a reply draft as RFC 2822 and keeps the headers that thread it", async () => {
  const { calls, ctx } = google({
    "GET /gmail/v1/users/me/drafts/d4": () => replyDraft,
    "PUT /gmail/v1/users/me/drafts/d4": () => ({ id: "d4", message: { id: "msg_5", threadId: "thr_4" } }),
  });
  const result = await run(gmailTools.updateDraft, ctx, { draftId: "d4", to: ["alex@example.com"], subject: "RE: plan", body: "Revised text" });
  assert.equal(calls[0]!.search.get("format"), "metadata");
  const put = calls[1]!;
  assert.equal(put.body.id, "d4");
  assert.equal(put.body.message.threadId, "thr_4");
  const mime = mimeOf(put);
  assert.match(mime, /^To: alex@example\.com\r\n/m);
  assert.match(mime, /^Subject: RE: plan\r\n/m);
  assert.match(mime, /^In-Reply-To: <orig-1@example\.com>\r\n/m);
  assert.match(mime, /^References: <root-0@example\.com> <orig-1@example\.com>\r\n/m);
  assert.equal(decodeBody(mime.split("\r\n\r\n")[1]!.replaceAll("\r\n", "")), "Revised text");
  assert.deepEqual(result, { account: self, draftId: "d4", messageId: "msg_5", threadId: "thr_4" });
});

test("updateDraft rewrites a draft that is not a reply without reply headers or a warning", async () => {
  const { calls, ctx } = google({
    "GET /gmail/v1/users/me/drafts/d6": () => ({ id: "d6", message: { id: "msg_6", threadId: "thr_6", payload: { headers: [{ name: "Subject", value: "Plan" }] } } }),
    "PUT /gmail/v1/users/me/drafts/d6": () => ({ id: "d6", message: { id: "msg_7", threadId: "thr_6" } }),
  });
  const result = await run(gmailTools.updateDraft, ctx, { draftId: "d6", to: ["alex@example.com"], subject: "Budget", body: "New text" });
  const mime = mimeOf(calls[1]!);
  assert.match(mime, /^Subject: Budget\r\n/m);
  assert.doesNotMatch(mime, /^(In-Reply-To|References):/m);
  assert.deepEqual(result, { account: self, draftId: "d6", messageId: "msg_7", threadId: "thr_6" });
});

test("updateDraft says when a new subject may take a reply draft out of its thread", async () => {
  const { calls, ctx } = google({
    "GET /gmail/v1/users/me/drafts/d4": () => replyDraft,
    "PUT /gmail/v1/users/me/drafts/d4": () => ({ id: "d4", message: { id: "msg_5", threadId: "thr_4" } }),
  });
  const result = await run(gmailTools.updateDraft, ctx, { draftId: "d4", to: ["alex@example.com"], subject: "Budget", body: "Revised text" });
  assert.match(mimeOf(calls[1]!), /^In-Reply-To: <orig-1@example\.com>\r\n/m);
  assert.match(result.warning, /subject no longer matches the thread's \("Re: Plan"\), so Gmail may show this draft as a new conversation/);
});

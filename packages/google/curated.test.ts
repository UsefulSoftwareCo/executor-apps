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

  // Without an ETag the write could not be conditional, so nothing is written.
  for (const tool of ["updateEvent", "deleteEvent", "respond"] as const) {
    const unversioned = google({ [`GET ${eventPath}`]: () => ({ ...timed, etag: undefined }) });
    const input = { calendarId: "team@example.com", eventId: "evt_1", summary: "Moved", response: "declined", affectsGuests: true };
    await assert.rejects(run(calendarTools[tool], unversioned.ctx, input), /did not return this event's version \(ETag\).*Nothing was changed/, tool);
    assert.deepEqual(unversioned.calls.map((call) => call.method), ["GET"], tool);
  }

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
    // An organizer other than this calendar and the account sees the change, listed as an attendee or not.
    [{ ...solo, organizer: { email: "lee@example.com" } }, { summary: "Renamed" }, /other guests/],
  ] as const) {
    const { calls, ctx } = google({ [`GET ${eventPath}`]: () => event });
    await assert.rejects(run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", timeZone: "UTC", ...input }), message);
    assert.deepEqual(calls.map((call) => call.method), ["GET"]);
  }
});

test("an event organized by the account or by the calendar being edited needs no affectsGuests", async () => {
  for (const organizer of [{ email: self }, { email: "team@example.com", self: true }]) {
    const { calls, ctx } = google({
      [`GET ${eventPath}`]: () => ({ ...solo, organizer }),
      [`PATCH ${eventPath}`]: (call) => ({ ...solo, organizer, ...call.body }),
      [`DELETE ${eventPath}`]: () => undefined,
    });
    await run(calendarTools.updateEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1", summary: "Renamed" });
    await run(calendarTools.deleteEvent, ctx, { calendarId: "team@example.com", eventId: "evt_1" });
    assert.deepEqual(calls.map((call) => call.method), ["GET", "PATCH", "GET", "DELETE"], organizer.email);
  }
  const other = google({ [`GET ${eventPath}`]: () => ({ ...solo, organizer: { email: "lee@example.com" } }) });
  await assert.rejects(run(calendarTools.deleteEvent, other.ctx, { calendarId: "team@example.com", eventId: "evt_1" }), /other guests.*Nothing was deleted/);
  assert.deepEqual(other.calls.map((call) => call.method), ["GET"]);
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
  /** The leaf's bytes, when they are not UTF-8 text. */
  readonly bytes?: Uint8Array;
  /** The leaf's Content-Transfer-Encoding; base64 when not given. */
  readonly transferEncoding?: string;
  /** The whole Content-Type value, when it is not the usual one for `type`. */
  readonly contentType?: string;
  readonly filename?: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** Gmail keeps the data apart, under an attachmentId, instead of in the message. */
  readonly stored?: boolean;
  readonly parts?: readonly Piece[];
}

/**
 * A draft as Gmail returns it, built from one set of parts: `full` (parsed parts and their headers,
 * as readDraft reads them) and `raw` (the MIME text that is sent). `id` names this version of its
 * message. Both carry the same headers, Content-Type values and bytes.
 */
const fakeDraft = (id: string, headers: readonly (readonly [string, string])[], top: Piece) => {
  const contentType = (piece: Piece, path: string) =>
    piece.contentType ??
    (piece.parts !== undefined ? `${piece.type}; boundary="b${path}"` : piece.filename ? `${piece.type}; name="${piece.filename}"` : `${piece.type}; charset="UTF-8"`);
  const bytes = (piece: Piece) => Buffer.from(piece.bytes ?? Buffer.from(piece.content ?? ""));
  const pairs = (piece: Piece, outer: readonly (readonly [string, string])[], path: string): (readonly [string, string])[] => [
    ...outer,
    ["Content-Type", contentType(piece, path)],
    ...Object.entries(piece.headers ?? {}),
    ...(piece.parts === undefined ? [["Content-Transfer-Encoding", piece.transferEncoding ?? "base64"] as const] : []),
  ];
  const full = (piece: Piece, outer: readonly (readonly [string, string])[], path: string): any => {
    const part = {
      mimeType: piece.type,
      filename: piece.filename ?? "",
      headers: pairs(piece, outer, path).map(([name, value]) => ({ name, value })),
    };
    if (piece.parts !== undefined) return { ...part, body: { size: 0 }, parts: piece.parts.map((child, index) => full(child, [], `${path}.${index}`)) };
    const data = bytes(piece);
    return { ...part, body: piece.stored ? { attachmentId: `att_${piece.filename ?? "text"}`, size: data.length } : { data: data.toString("base64url"), size: data.length } };
  };
  const mime = (piece: Piece, outer: readonly (readonly [string, string])[], path: string): string[] => {
    const head = pairs(piece, outer, path).map(([name, value]) => `${name}: ${value}`);
    if (piece.parts !== undefined)
      return [...head, "", ...piece.parts.flatMap((child, index) => [`--b${path}`, ...mime(child, [], `${path}.${index}`)]), `--b${path}--`];
    return [...head, "", (piece.transferEncoding ?? "base64") === "base64" ? bytes(piece).toString("base64") : bytes(piece).toString("latin1")];
  };
  const message = { id: `msg_${id}`, threadId: "thr_9", payload: full(top, headers, "0") };
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
    [basic, htmlOnly("<style>p { display: none }</style><p>Hi</p>"), /its HTML uses the element <style>/],
    [basic, htmlOnly('<p style="background: url(https://tracker.example/p.gif)">Hi</p>'), /its HTML has the attribute style on <p>/],
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
          alternative("See attached.\n[image: logo]\n", '<p>See attached.</p><img src="cid:logo1" alt="logo">'),
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
  assert.equal(read.send.body, "See attached.\n[image: logo]\n");
  const message = await run(gmailTools.readMessage, ctx, { messageId: "msg_files" });
  assert.deepEqual(
    message.attachments.map((a: { filename: string }) => a.filename),
    ["logo.png", "invoice.pdf", "plan.pdf"],
  );
});

const probeHeaders = [["From", "user@example.com"], ["To", "alex@example.com"], ["Subject", "Synthetic review"]] as const;

/** Reads a draft built from `top` and tries to send it; returns what was read, sent and refused. */
const attempt = async (top: Piece, headers: readonly (readonly [string, string])[] = probeHeaders) => {
  const draft = fakeDraft("probe", headers, top);
  const { calls, ctx } = google({ "GET /gmail/v1/users/me/drafts/d9": draft, "POST /gmail/v1/users/me/drafts/send": sent });
  const read = await run(gmailTools.readDraft, ctx, { draftId: "d9" });
  const error: Error | undefined = await run(gmailTools.sendDraft, ctx, read.send ?? { ...(await approved()), version: "approved-elsewhere" }).then(
    () => undefined,
    (error) => error,
  );
  const posts = calls.filter((call) => call.method === "POST");
  return { read, error, sentRaw: posts.length === 1 ? posts[0]!.body.message.raw : undefined, draft };
};
/** Asserts a draft is refused for `reason`, by readDraft and by sendDraft, and nothing is sent. */
const refused = async (top: Piece, reason: RegExp, headers?: readonly (readonly [string, string])[]) => {
  const { read, error, sentRaw } = await attempt(top, headers);
  assert.equal(sentRaw, undefined, `sent: ${reason}`);
  assert.equal(read.send, undefined, String(reason));
  assert.match(read.cannotSend ?? "", reason);
  assert.match(error?.message ?? "", /^Nothing was sent: sendDraft only sends a draft whose whole content its approval shows/);
  assert.match(error!.message, reason);
};
/** Asserts a draft is sent byte for byte, with its approval showing `body`. */
const sends = async (top: Piece, body: string, headers?: readonly (readonly [string, string])[]) => {
  const { read, error, sentRaw, draft } = await attempt(top, headers);
  assert.equal(read.cannotSend, undefined, `${body}: ${read.cannotSend}`);
  assert.equal(error, undefined);
  assert.equal(read.send.body, body);
  assert.equal(sentRaw, draft.raw);
  return read.send;
};

// The second review's probes: HTML whose approved text differed from what a recipient sees.
test("sendDraft refuses HTML that could show a recipient other text or links than the approval", async () => {
  await refused(alternative("Pay here <https://safe.example>", '<a data-href="https://safe.example" href="https://evil.example">Pay here</a>'), /its HTML has the attribute data-href on <a>/);
  await refused(htmlOnly('<img data-src="cid:logo" src="https://tracker.example/p.gif">Hi'), /its HTML has the attribute data-src on <img>/);
  await refused(alternative("Do not pay this invoice.", '<span style="display:none">Do not </span>pay this invoice.'), /its HTML has the attribute style on <span>/);
  await refused(alternative("Do not pay this invoice.", "<span hidden>Do not </span>pay this invoice."), /its HTML has the attribute hidden on <span>/);
  await refused(alternative("Send to account 12345", '<p>Send to account <bdo dir="rtl">12345</bdo></p>'), /its HTML uses the element <bdo>/);
  await refused(alternative("Hi", '<abbr title="Wire money to account 54321">Hi</abbr>'), /its HTML uses the element <abbr>/);
  await refused(
    { type: "multipart/related", parts: [alternative("Hi", '<p>Hi</p><img src="cid:logo" alt="Wire money to 54321">'), { type: "image/png", filename: "logo.png", content: "PNG", headers: { "Content-ID": "<logo>", "Content-Disposition": "inline" } }] },
    /its HTML version says something other than its plain text/,
  );
  await refused(alternative("Pay​ now", "<p>Pay&#8203; now</p>"), /hides or reorders text \(U\+200B\)/);
  await refused(plainOnly("account ‮12345‬"), /its text has a character that hides or reorders text \(U\+202E\)/);
});

// Text Gmail keeps apart from the message, encoded headers and other charsets: shown decoded, or refused.
test("sendDraft shows text only as it is decoded, and refuses text it has not read", async () => {
  await refused({ type: "text/plain", content: `WIRE MONEY TO ACCOUNT 54321 ${"x".repeat(8000)}`, stored: true }, /its text is stored apart from the message/);
  await refused({ type: "text/html", content: "<p>WIRE MONEY TO ACCOUNT 54321</p>", stored: true }, /its text is stored apart from the message/);
  const encoded = await sends(plainOnly("Hi"), "Hi", [
    ["From", "=?UTF-8?B?QmlsbGluZw==?= <user@example.com>"],
    ["To", "alex@example.com"],
    ["Subject", "=?UTF-8?B?V2lyZSBtb25leSB0byBhY2NvdW50IDU0MzIx?="],
  ]);
  assert.equal(encoded.subject, "Wire money to account 54321");
  assert.equal(encoded.from, "Billing <user@example.com>");
  const cp1252 = Uint8Array.from([0x48, 0x69, 0x20, 0x93, 0x41, 0x6c, 0x65, 0x78, 0x94]);
  for (const contentType of ["text/plain; charset=windows-1252", "text/plain; charset = windows-1252", 'text/plain; charset="windows-1252"'])
    await sends({ type: "text/plain", contentType, bytes: cp1252 }, "Hi “Alex”");
  // A parameter whose name merely contains "charset" is not read as the charset: it is refused.
  await refused({ type: "text/plain", contentType: 'text/plain; xcharset=utf-8; charset="windows-1252"', bytes: cp1252 }, /a text\/plain part has a Content-Type parameter it does not read \(xcharset\)/);
  await refused({ type: "text/plain", contentType: "text/plain; charset=shift_jis", bytes: cp1252 }, /in the shift_jis charset, which it does not read/);
  await refused({ type: "text/plain", contentType: "text/plain", bytes: cp1252 }, /bytes that are not ASCII but names no charset/);
  await refused({ type: "text/plain", contentType: "text/plain; charset=utf-8", bytes: cp1252 }, /its text is not valid utf-8/);
  await refused(plainOnly("Hi"), /its Subject header is in the x-unknown charset, which it does not read/, [...probeHeaders.slice(0, 2), ["Subject", "=?x-unknown?B?SGk=?="]]);
  await refused(plainOnly("Hi"), /its Subject header has an encoded word it cannot read/, [...probeHeaders.slice(0, 2), ["Subject", "=?UTF-8?B?not base64!?="]]);
});

// An attached container used to be opened as if it were body, and its name dropped.
test("sendDraft refuses an attached bundle of parts or an attached email instead of opening it", async () => {
  const bundle = {
    type: "multipart/alternative",
    filename: "bundle.mime",
    headers: { "Content-Disposition": 'attachment; filename="bundle.mime"' },
    // Its text matches the body's, so the old reading saw nothing to refuse and dropped the attachment.
    parts: [htmlOnly("Hi")],
  };
  await refused({ type: "multipart/mixed", parts: [plainOnly("Hi"), bundle] }, /it has an attached multipart\/alternative part \(bundle\.mime\), which it does not open/);
  await refused({ type: "multipart/mixed", parts: [plainOnly("Hi"), { type: "message/rfc822", filename: "old.eml", parts: [plainOnly("Private forwarded text")] }] }, /attached message\/rfc822 part/);
  // Reading the message lists the bundle as an attachment rather than reading it as body.
  const draft = fakeDraft("bundle", probeHeaders, { type: "multipart/mixed", parts: [plainOnly("Hi"), bundle] });
  const { ctx } = google({ "GET /gmail/v1/users/me/messages/msg_bundle": () => draft.message, "GET /gmail/v1/users/me/labels": () => ({ labels: [] }) });
  const message = await run(gmailTools.readMessage, ctx, { messageId: "msg_bundle" });
  assert.equal(message.body, "Hi");
  assert.deepEqual(
    message.attachments.map((a: { filename: string; mimeType: string }) => [a.filename, a.mimeType]),
    [["bundle.mime", "multipart/alternative"]],
  );
});

// A container's start or type can make a part other than the shown text the one a mail client
// displays (RFC 2387), so only the parameters sendDraft reads are accepted on any part.
test("sendDraft refuses Content-Type parameters it does not read, such as a related container's start", async () => {
  const root = { type: "text/html", filename: "root.html", content: "<p>Send the money to account 54321</p>", headers: { "Content-ID": "<root>" } };
  await refused(
    { type: "multipart/related", contentType: 'multipart/related; boundary="b0"; start="<root>"', parts: [plainOnly("Hi"), root] },
    /a multipart\/related part has a Content-Type parameter it does not read \(start\)/,
  );
  await refused(
    { type: "multipart/related", contentType: 'multipart/related; boundary="b0"; type="text/html"', parts: [plainOnly("Hi"), root] },
    /a multipart\/related part has a Content-Type parameter it does not read \(type\)/,
  );
  await refused({ type: "text/plain", contentType: 'text/plain; charset="UTF-8"; format=flowed', content: "Hi" }, /a text\/plain part has a Content-Type parameter it does not read \(format\)/);
  await refused(
    { type: "multipart/mixed", parts: [plainOnly("Hi"), { ...pdf, contentType: 'application/pdf; name="plan.pdf"; x-mac-type="50444620"' }] },
    /an? application\/pdf part has a Content-Type parameter it does not read \(x-mac-type\)/,
  );
  // The parameters it reads are still accepted on each kind of part.
  await sends(
    { type: "multipart/related", contentType: 'multipart/related; boundary="b0"', parts: [plainOnly("Hi"), { ...pdf, contentType: 'application/pdf; name="plan.pdf"' }] },
    "Hi",
  );
  assert.match(native(gmailTools.sendDraft).description, /Content-Type only the parameter boundary \(container\), charset \(text\), name \(attachment\)/);
});

const inlineLogo = { type: "image/png", filename: "logo.png", content: "PNG", headers: { "Content-ID": "<logo>", "Content-Disposition": 'inline; filename="logo.png"' } };

// One allowed and one refused example for each class on the allow-list.
test("the sendDraft allow-list: what each element, attribute, value, reference, character and part class accepts and refuses", async () => {
  const cases: [string, Piece, string | RegExp, (readonly (readonly [string, string])[])?][] = [
    // Text elements.
    ["formatting", htmlOnly("<p><b>B</b> <strong>S</strong> <i>I</i> <em>E</em> <u>U</u> <span>N</span><wbr>W</p><hr><blockquote>Q</blockquote>"), "B S I E U NW\n\nQ"],
    ["lists", htmlOnly("<ul><li>One</li><li>Two</li></ul><ol><li>Three</li></ol>"), "- One\n- Two\n\n- Three"],
    ["line breaks", htmlOnly('<div dir="ltr">Hi Alex,<div><br></div><div>Lunch?</div></div>'), "Hi Alex,\n\nLunch?"],
    ["unlisted element", htmlOnly("<font color=white>Hi</font>"), /its HTML uses the element <font>/],
    ["table", htmlOnly("<table><tr><td>Hi</td></tr></table>"), /its HTML uses the element <table>/],
    ["style element", htmlOnly("<style>p { display: none }</style><p>Hi</p>"), /its HTML uses the element <style>/],
    ["script", htmlOnly("<script>alert(1)</script>Hi"), /its HTML uses the element <script>/],
    ["form", htmlOnly("<form>Hi</form>"), /its HTML uses the element <form>/],
    // Attributes on any element, with fixed values.
    ["dir ltr", htmlOnly('<p dir="ltr">Hi</p>'), "Hi"],
    ["dir rtl", htmlOnly('<p dir="rtl">Hi</p>'), /its HTML has dir="rtl" on <p>/],
    ["signature class", htmlOnly('<div class="gmail_signature" data-smartmail="gmail_signature">User</div>'), "User"],
    ["other class", htmlOnly('<div class="gmail_quote">User</div>'), /its HTML has class="gmail_quote" on <div>/],
    ["other data attribute", htmlOnly('<div data-x="1">User</div>'), /its HTML has the attribute data-x on <div>/],
    ["style attribute", htmlOnly('<p style="color: black">Hi</p>'), /its HTML has the attribute style on <p>/],
    ["event attribute", htmlOnly('<p onclick="x()">Hi</p>'), /its HTML has the attribute onclick on <p>/],
    ["title attribute", htmlOnly('<p title="secret">Hi</p>'), /its HTML has the attribute title on <p>/],
    ["two of one attribute", htmlOnly('<p dir="ltr" dir="rtl">Hi</p>'), /two dir attributes on one <p>/],
    // Links: the real href, http, https or mailto.
    ["link", htmlOnly('<p>See <a href="https://example.com/a?b=1&amp;c=2" target="_blank">the doc</a></p>'), "See the doc <https://example.com/a?b=1&c=2>"],
    ["link labelled with its target", htmlOnly('<a href="mailto:alex@example.com">mailto:alex@example.com</a>'), "mailto:alex@example.com"],
    ["link labelled with another address", htmlOnly('<a href="https://evil.example">https://safe.example</a>'), "https://safe.example <https://evil.example>"],
    ["data link", htmlOnly('<a href="data:text/html,Hello">Hi</a>'), /links to "data:text\/html,Hello", which is not an http:, https: or mailto: address/],
    ["javascript link", htmlOnly('<a href="javascript:alert(1)">Hi</a>'), /which is not an http:, https: or mailto: address/],
    ["link with a space in its target", htmlOnly('<a href="https://example.com/ x">Hi</a>'), /which is not an http:, https: or mailto: address/],
    ["other link target", htmlOnly('<a href="https://example.com" target="frame">Hi</a>'), /link target other than _blank/],
    ["link inside a link", htmlOnly('<a href="https://a.example"><a href="https://b.example">Hi</a></a>'), /a link inside a link/],
    // Images: inline attachments only, alt shown.
    ["inline image", { type: "multipart/related", parts: [htmlOnly('<p>Logo</p><img src="cid:logo" alt="logo" width="10" height="10">'), inlineLogo] }, "Logo\n[image: logo]"],
    ["web image", htmlOnly('<img src="https://example.com/logo.png">Hi'), /its HTML loads an image from the web/],
    ["data image", htmlOnly('<img src="data:image/png;base64,AA==">Hi'), /not one of the draft's inline attachments/],
    ["missing inline image", htmlOnly('<img src="cid:missing" alt="Unshown text">Hi'), /not one of the draft's inline attachments/],
    ["image size not a number", { type: "multipart/related", parts: [htmlOnly('<img src="cid:logo" width="0px">'), inlineLogo] }, /image width that is not a number/],
    // References, markup and characters.
    ["references", htmlOnly("<p>Fish &amp; chips &lt;3 &#233;&#x263A;&nbsp;!</p>"), "Fish & chips <3 é☺ !"],
    ["unknown reference", htmlOnly("<p>&NotEqualTilde;</p>"), /character reference it does not read \(&NotEqualTilde;\)/],
    ["bare ampersand", htmlOnly("<p>Fish & chips</p>"), /character reference it does not read/],
    ["comment", htmlOnly("Hi<!-- Wire money -->"), /a < that does not open an element it allows/],
    ["doctype", htmlOnly("<!DOCTYPE html><p>Hi</p>"), /a < that does not open an element it allows/],
    ["stray <", htmlOnly("<p>1 < 2</p>"), /a < that does not open an element it allows/],
    ["unclosed element", htmlOnly("<div>Hi"), /leaves <div> open/],
    ["misnested elements", htmlOnly("<b><i>Hi</b></i>"), /closes <b> where that element is not open/],
    ["self-closed container", htmlOnly("<div/>Hi"), /writes <div\/>/],
    ["attributes run together", htmlOnly('<a href="https://a.example"target="_blank">Hi</a>'), /a <a> tag it cannot read/],
    ["zero-width character", plainOnly("Pay​now"), /U\+200B/],
    ["word joiner", plainOnly("Pay⁠now"), /U\+2060/],
    ["private-use character", plainOnly("Paynow"), /U\+E000/],
    ["tag character", plainOnly("Hi\u{e0041}"), /U\+E0041/],
    ["accents and scripts", plainOnly("Café, Ελληνικά, 日本語, עברית"), "Café, Ελληνικά, 日本語, עברית"],
    // Parts.
    ["plain text", plainOnly("Hi Alex,\nLunch at noon?"), "Hi Alex,\nLunch at noon?"],
    ["matching plain and HTML", alternative("Hi\nUser <https://example.com>", '<div dir="ltr">Hi<div class="gmail_signature"><a href="https://example.com">User</a></div></div>'), "Hi\nUser <https://example.com>"],
    ["named attachment", { type: "multipart/mixed", parts: [plainOnly("Hi"), pdf] }, "Hi"],
    ["unnamed attachment", { type: "multipart/mixed", parts: [plainOnly("Hi"), { type: "application/pdf", content: "PDF" }] }, /it has an unnamed application\/pdf part/],
    ["name only in Content-Type", { type: "multipart/mixed", parts: [plainOnly("Hi"), { type: "text/plain", contentType: 'text/plain; name="secret.txt"', content: "secret" }] }, /an attachment's name cannot be read reliably/],
    ["RFC 2231 name", { type: "multipart/mixed", parts: [plainOnly("Hi"), { type: "application/pdf", content: "PDF", headers: { "Content-Disposition": "attachment; filename*=utf-8''private%20doc.pdf" } }] }, /a Content-Disposition header is not in a form it reads/],
    ["signed message", { type: "multipart/signed", parts: [plainOnly("Hi")] }, /it has a multipart\/signed part/],
    ["two text parts", { type: "multipart/mixed", parts: [plainOnly("Hi"), plainOnly("Different")] }, /more than one text part/],
    ["quoted-printable", { type: "text/plain", content: "Hi", transferEncoding: "quoted-printable" }, "Hi"],
    ["unread transfer encoding", { type: "text/plain", content: "Hi", transferEncoding: "x-uuencode" }, /uses the x-uuencode transfer encoding, which it does not read/],
    ["two transfer encodings", { type: "text/plain", content: "Hi", headers: { "Content-Transfer-Encoding": "quoted-printable" } }, /more than one Content-Transfer-Encoding header/],
    ["part header not listed", { type: "multipart/mixed", parts: [plainOnly("Hi"), { ...pdf, headers: { ...pdf.headers, "Content-Location": "https://example.com/x" } }] }, /a part of it has a Content-Location header/],
    // Message headers.
    ["Reply-To and Sender", plainOnly("Hi"), "Hi", [...probeHeaders, ["Reply-To", "billing@example.net"], ["Sender", "assistant@example.com"]]],
    ...["Return-Path", "Resent-To", "Resent-From", "Disposition-Notification-To", "List-Post", "X-Mailer"].map(
      (name) => [`${name} header`, plainOnly("Hi"), new RegExp(`it has a ${name} header, which the approval would not show`), [...probeHeaders, [name, "other@example.com"]]] as [string, Piece, RegExp, (readonly (readonly [string, string])[])],
    ),
    ["two To headers", plainOnly("Hi"), /more than one To header/, [...probeHeaders, ["To", "other@example.com"]]],
    ["hidden character in a header", plainOnly("Hi"), /its Subject header has a character that hides or reorders text/, [...probeHeaders.slice(0, 2), ["Subject", "Invoice ‮paid"]]],
  ];
  for (const [name, top, expected, headers] of cases) {
    if (typeof expected === "string") await sends(top, expected, headers).catch((error) => assert.fail(`${name}: ${error.message}`));
    else await refused(top, expected, headers).catch((error) => assert.fail(`${name}: ${error.message}`));
  }
});

// Known limits: Gmail's quoted replies (and signatures laid out with styles or web images) are refused today.
test("sendDraft refuses Gmail's quoted replies and image signatures, as its description says", async () => {
  await refused(
    alternative(
      "Thanks!\nOn Tue, Alex wrote:\n> Lunch?",
      '<div dir="ltr">Thanks!</div><br><div class="gmail_quote"><div class="gmail_attr">On Tue, Alex wrote:<br></div><blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">Lunch?</blockquote></div>',
    ),
    /class="gmail_quote"/,
  );
  await refused(alternative("Hi", '<div dir="ltr">Hi<img src="https://example.com/logo.png"></div>'), /loads an image from the web/);
  assert.match(native(gmailTools.sendDraft).description, /Gmail's quoted replies and most formatted signatures/);
});

// What gmail.draft writes must stay sendable: its MIME is read back as Gmail would return it.
test("a draft written by gmail.draft is shown in full and sent by sendDraft", async () => {
  const made = google({ "POST /gmail/v1/users/me/drafts": () => ({ id: "d9", message: { id: "m" } }) });
  await run(gmailTools.draft, made.ctx, { to: ["alex@example.com"], cc: ["sam@example.com"], subject: "Café plans", body: "Hi Alex,\nLunch at noon? — User" });
  const raw: string = made.calls.at(-1)!.body.message.raw;
  const [head, encoded] = decodeBody(raw).split("\r\n\r\n") as [string, string];
  const headers = [{ name: "From", value: "User <user@example.com>" }, ...head.split("\r\n").map((line) => ({ name: line.slice(0, line.indexOf(":")), value: line.slice(line.indexOf(":") + 1).trim() }))];
  const data = Buffer.from(encoded.replaceAll("\r\n", ""), "base64");
  const payload = { mimeType: "text/plain", filename: "", headers, body: { data: data.toString("base64url"), size: data.length } };
  const saved = google({
    "GET /gmail/v1/users/me/drafts/d9": (call) => ({ id: "d9", message: call.search.get("format") === "raw" ? { id: "m", raw } : { id: "m", payload } }),
    "POST /gmail/v1/users/me/drafts/send": sent,
  });
  const read = await run(gmailTools.readDraft, saved.ctx, { draftId: "d9" });
  assert.equal(read.cannotSend, undefined);
  assert.equal(read.send.body, "Hi Alex,\nLunch at noon? — User");
  assert.equal(read.send.subject, "Café plans");
  await run(gmailTools.sendDraft, saved.ctx, read.send);
  assert.equal(saved.calls.at(-1)!.body.message.raw, raw);
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
  // drafts.get takes only format (Gmail's Discovery document); its metadata form has every header.
  assert.deepEqual([...calls[0]!.search.keys()], ["format"]);
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

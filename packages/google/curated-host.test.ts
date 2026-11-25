// Runs the curated Calendar and Gmail writes through the `apps` host handler, in the all-in-one
// `google` package and in `gmail` and `google-calendar`, against the recording fake Google in
// scripts/fake-google.ts. Where curated.test.ts calls each tool's handler directly, these go
// through the host: a write without the user's approval must stop before any request reaches
// Google, and an approved one must send Google the request its API documents. All data is
// synthetic (example.com). Run with `bun test packages/google`.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { hostPackage, token, type Host, type Recorded } from "../../scripts/fake-google.ts";

const self = "user@example.com";
const eventPath = "/calendar/v3/calendars/team%40example.com/events/evt_1";
const event = {
  id: "evt_1",
  etag: '"etag-1"',
  summary: "Planning",
  status: "confirmed",
  start: { dateTime: "2026-12-01T15:00:00Z", timeZone: "UTC" },
  end: { dateTime: "2026-12-01T15:45:00Z", timeZone: "UTC" },
  attendees: [
    { email: self, self: true, responseStatus: "accepted" },
    { email: "alex@example.com", responseStatus: "accepted" },
  ],
};

/** A plain-text draft as Gmail returns it in `full` and `raw` form, from the same headers and bytes. */
const draft = (subject: string) => {
  const text = "Hi Alex,\n\nThe plan is attached to the doc.\n";
  const headers = [
    ["From", `User <${self}>`],
    ["To", "alex@example.com"],
    ["Subject", subject],
    ["MIME-Version", "1.0"],
    ["Content-Type", 'text/plain; charset="UTF-8"'],
    ["Content-Transfer-Encoding", "base64"],
  ] as const;
  const bytes = Buffer.from(text);
  const message = {
    id: `msg_${subject.length}`,
    threadId: "thr_9",
    payload: {
      mimeType: "text/plain",
      filename: "",
      headers: headers.map(([name, value]) => ({ name, value })),
      body: { data: bytes.toString("base64url"), size: bytes.length },
    },
  };
  const raw = Buffer.from([...headers.map(([name, value]) => `${name}: ${value}`), "", bytes.toString("base64")].join("\r\n")).toString("base64url");
  return { message, raw };
};

/**
 * Answers the fake Google: account lookups, the event, the draft (`current()` is what Gmail holds
 * now) and each write's documented response.
 */
const answers = (current: () => ReturnType<typeof draft>) => (request: Recorded) => {
  const route = `${request.method} ${request.path}`;
  if (route === "GET /oauth2/v3/userinfo") return { sub: "1", email: self };
  if (route === "GET /gmail/v1/users/me/profile") return { emailAddress: self };
  if (route === "GET /calendar/v3/calendars/primary") return { id: self };
  if (route === `GET ${eventPath}`) return event;
  if (route === `PATCH ${eventPath}`) return { ...event, ...JSON.parse(request.body.toString()) };
  if (route === `DELETE ${eventPath}`) return {};
  if (route === "GET /gmail/v1/users/me/drafts/d9") {
    const { message, raw } = current();
    return request.query.get("format") === "raw" ? { id: "d9", message: { id: message.id, threadId: message.threadId, raw } } : { id: "d9", message };
  }
  if (route === "PUT /gmail/v1/users/me/drafts/d9") return { id: "d9", message: { id: "msg_new", threadId: "thr_9" } };
  if (route === "POST /gmail/v1/users/me/drafts/send") return { id: "msg_sent", threadId: "thr_9", labelIds: ["SENT"] };
  if (route === "DELETE /gmail/v1/users/me/drafts/d9") return {};
  return { unexpected: route };
};

/** A valid call of every curated Calendar and Gmail write, so the host reaches its approval check. */
const writes: Record<string, { readonly product: "calendar" | "gmail"; readonly input: object }> = {
  createEvent: { product: "calendar", input: { summary: "Sync", start: "2026-12-02T09:00:00Z", end: "2026-12-02T09:30:00Z" } },
  respond: { product: "calendar", input: { calendarId: "team@example.com", eventId: "evt_1", response: "accepted" } },
  updateEvent: { product: "calendar", input: { calendarId: "team@example.com", eventId: "evt_1", summary: "Planning (moved)", affectsGuests: true } },
  deleteEvent: { product: "calendar", input: { calendarId: "team@example.com", eventId: "evt_1", affectsGuests: true } },
  send: { product: "gmail", input: { to: ["alex@example.com"], subject: "Hello", body: "Hi." } },
  draft: { product: "gmail", input: { to: ["alex@example.com"], subject: "Hello", body: "Hi." } },
  updateDraft: { product: "gmail", input: { draftId: "d9", to: ["alex@example.com"], subject: "Plan", body: "New text." } },
  sendDraft: {
    product: "gmail",
    input: { account: self, draftId: "d9", from: "", sender: "", replyTo: "", to: "", cc: "", bcc: "", subject: "", format: "", body: "", attachments: [], version: "v" },
  },
  deleteDraft: { product: "gmail", input: { draftId: "d9" } },
  modify: { product: "gmail", input: { threadIds: ["thr_9"], archive: true } },
};

const packages = [
  { name: "google", tool: (product: string, name: string) => `${product}.${name}`, products: ["calendar", "gmail"] },
  { name: "gmail", tool: (_: string, name: string) => name, products: ["gmail"] },
  { name: "google-calendar", tool: (_: string, name: string) => name, products: ["calendar"] },
] as const;

for (const pkg of packages) {
  describe(`curated writes through the host in ${pkg.name}`, () => {
    let host: Host;
    let current = () => draft("Plan for Q1");
    before(async () => {
      host = await hostPackage(pkg.name);
      host.answer(answers(() => current()));
    });
    after(() => host.close());

    /** Calls a write without approval (refused, nothing sent), then approved; returns what the approved call sent. */
    const approvedCall = async (tool: string, input: object) => {
      const before = host.requests.length;
      const refused = await host.call(tool, input);
      assert.equal(refused.ok ? "ok" : refused.error._tag, "HostToolApprovalRequired", `${tool} ran without approval`);
      assert.equal(host.requests.length, before, `${tool} reached Google before approval`);
      const approved = await host.call(tool, input, { approve: true });
      assert.ok(approved.ok, `${tool} failed: ${JSON.stringify(approved)}`);
      const sent = host.requests.slice(before);
      for (const request of sent) assert.equal(request.authorization, `Bearer ${token}`);
      return { result: approved.value, sent: sent.filter((request) => request.method !== "GET") };
    };
    const json = (request: Recorded) => {
      assert.match(request.contentType ?? "", /^application\/json/);
      return JSON.parse(request.body.toString());
    };

    test("every curated Calendar and Gmail write is refused without approval and sends nothing", async () => {
      const listed = await host.tools();
      const curatedWrites = listed
        .filter((tool) => !tool.readOnly && !tool.name.startsWith("api."))
        .map((tool) => tool.name)
        .filter((name) => pkg.products.some((product) => pkg.name !== "google" || name.startsWith(`${product}.`)));
      const expected = Object.entries(writes)
        .filter(([, write]) => (pkg.products as readonly string[]).includes(write.product))
        .map(([name, write]) => pkg.tool(write.product, name));
      // A new write must be added to `writes`, so this test covers it.
      assert.deepEqual([...curatedWrites].sort(), [...expected].sort());
      for (const name of ["updateEvent", "deleteEvent", "updateDraft", "sendDraft", "deleteDraft"]) {
        const write = writes[name]!;
        if ((pkg.products as readonly string[]).includes(write.product)) assert.ok(curatedWrites.includes(pkg.tool(write.product, name)), name);
      }
      for (const name of expected) {
        const write = writes[name.split(".").at(-1)!]!;
        const sent = host.requests.length;
        const refused = await host.call(name, write.input);
        assert.equal(refused.ok ? "ok" : refused.error._tag, "HostToolApprovalRequired", `${name} ran without approval`);
        assert.equal(host.requests.length, sent, `${name} reached Google before approval`);
      }
      // Approval is for the exact call: approving one input does not approve another.
      for (const name of expected) {
        const write = writes[name.split(".").at(-1)!]!;
        const sent = host.requests.length;
        const other = await host.call(name, { ...write.input, account: "someone-else@example.com" }, { approve: true, approved: write.input });
        assert.equal(other.ok ? "ok" : other.error._tag, "HostInputInvalid", name);
        assert.equal(host.requests.length, sent, name);
      }
    });

    if (pkg.products.includes("calendar" as never)) {
      test("updateEvent and deleteEvent, once approved, write only the version they read", async () => {
        const update = await approvedCall(pkg.tool("calendar", "updateEvent"), writes.updateEvent!.input);
        assert.equal(update.sent.length, 1);
        const patch = update.sent[0]!;
        assert.equal(patch.method, "PATCH");
        assert.equal(patch.host, "www.googleapis.com");
        assert.equal(patch.path, eventPath);
        assert.deepEqual(json(patch), { summary: "Planning (moved)" });
        assert.equal(patch.query.get("sendUpdates"), "all");

        const remove = await approvedCall(pkg.tool("calendar", "deleteEvent"), writes.deleteEvent!.input);
        assert.deepEqual(remove.sent.map((request) => `${request.method} ${request.path}`), [`DELETE ${eventPath}`]);
        assert.equal(remove.sent[0]!.body.length, 0);
        assert.equal(remove.sent[0]!.query.get("sendUpdates"), "all");
        assert.deepEqual(remove.result, { account: self, calendarId: "team@example.com", eventId: "evt_1", deleted: true });
      });
    }

    if (pkg.products.includes("gmail" as never)) {
      test("updateDraft, sendDraft and deleteDraft, once approved, send Gmail's documented requests", async () => {
        current = () => draft("Plan for Q1");
        const update = await approvedCall(pkg.tool("gmail", "updateDraft"), writes.updateDraft!.input);
        assert.deepEqual(update.sent.map((request) => `${request.method} ${request.path}`), ["PUT /gmail/v1/users/me/drafts/d9"]);
        const body = json(update.sent[0]!);
        assert.deepEqual(Object.keys(body).sort(), ["id", "message"]);
        assert.equal(body.id, "d9");
        // The draft read had no reply headers; the thread Gmail named stays with it.
        assert.deepEqual(Object.keys(body.message).sort(), ["raw", "threadId"]);
        const mime = Buffer.from(body.message.raw, "base64url").toString();
        assert.match(mime, /^To: alex@example\.com\r$/m);
        assert.match(mime, /^Subject: Plan\r$/m);

        const read = await host.call(pkg.tool("gmail", "readDraft"), { draftId: "d9" });
        assert.ok(read.ok, JSON.stringify(read));
        const send = read.value.send;
        assert.equal(send.subject, "Plan for Q1");
        assert.equal(send.body, "Hi Alex,\n\nThe plan is attached to the doc.\n");
        const sent = await approvedCall(pkg.tool("gmail", "sendDraft"), send);
        assert.deepEqual(sent.sent.map((request) => `${request.method} ${request.path}`), ["POST /gmail/v1/users/me/drafts/send"]);
        // drafts.send takes a Draft: its id, and the exact raw message that was read and approved.
        assert.deepEqual(json(sent.sent[0]!), { id: "d9", message: { raw: draft("Plan for Q1").raw, threadId: "thr_9" } });
        assert.deepEqual(sent.result, { account: self, draftId: "d9", messageId: "msg_sent", threadId: "thr_9" });

        const remove = await approvedCall(pkg.tool("gmail", "deleteDraft"), writes.deleteDraft!.input);
        assert.deepEqual(remove.sent.map((request) => `${request.method} ${request.path}`), ["DELETE /gmail/v1/users/me/drafts/d9"]);
        assert.equal(remove.sent[0]!.body.length, 0);
      });

      test("sendDraft sends only the draft content that was approved", async () => {
        current = () => draft("Plan for Q1");
        const read = await host.call(pkg.tool("gmail", "readDraft"), { draftId: "d9" });
        assert.ok(read.ok, JSON.stringify(read));
        const send = read.value.send;
        const tool = pkg.tool("gmail", "sendDraft");
        const posts = () => host.requests.filter((request) => request.method === "POST").length;
        const before = posts();

        // An approval of the draft as read does not cover a call that shows something else.
        const altered = await host.call(tool, { ...send, to: "alex@example.com, mallory@example.com" }, { approve: true, approved: send });
        assert.equal(altered.ok ? "ok" : altered.error._tag, "HostInputInvalid");

        // Approved as shown, but the input does not match the draft: nothing is sent.
        const mismatch = await host.call(tool, { ...send, subject: "Something else" }, { approve: true });
        assert.equal(mismatch.ok, false);
        assert.match(JSON.stringify(mismatch), /Nothing was sent: the draft is not what was approved \(subject differ/);

        // The draft was edited after it was read and approved: nothing is sent.
        current = () => draft("Plan for Q1 (revised)");
        const edited = await host.call(tool, send, { approve: true });
        assert.equal(edited.ok, false);
        assert.match(JSON.stringify(edited), /Nothing was sent: the draft is not what was approved/);
        assert.equal(posts(), before, "a draft that is not what was approved was sent");
        current = () => draft("Plan for Q1");
      });
    }
  });
}

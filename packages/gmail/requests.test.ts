// Runs the generated Gmail tools, in this package and in the all-in-one `google` package, through
// the apps host against a recording fake Google, and checks each request against Gmail's documented
// formats. Messages, ids and tokens are synthetic. Run with `bun test packages/gmail`.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { accountId, hostPackage, token, type Host, type Recorded } from "../../scripts/fake-google.ts";

const mime = (headers: Record<string, string>, text: string) =>
  [...Object.entries(headers).map(([name, value]) => `${name}: ${value}`), "Content-Type: text/plain; charset=UTF-8", "", text].join("\r\n");
const message = mime(
  { From: "sender@example.com", To: "recipient@example.com", Subject: "Synthetic test", "Message-ID": "<original-1@example.com>" },
  "Hello from a test. Café ✓",
);
const reply = mime(
  {
    From: "sender@example.com",
    To: "recipient@example.com",
    Subject: "Re: Synthetic test",
    "In-Reply-To": "<original-1@example.com>",
    References: "<original-1@example.com>",
  },
  "A synthetic reply.",
);
const raw = Buffer.from(message).toString("base64url");
const replyRaw = Buffer.from(reply).toString("base64url");
const me = { userId: "me" };
const credentialParameters = ["access_token", "oauth_token", "key"];

/** The JSON operations that take a whole message, and the request Gmail documents for each. */
const jsonCases = [
  { name: "messages.send", tool: "gmailUsersMessagesSend", path: me, body: { raw }, method: "POST", url: "/gmail/v1/users/me/messages/send" },
  {
    name: "messages.send as a reply",
    tool: "gmailUsersMessagesSend",
    path: me,
    body: { raw: replyRaw, threadId: "thread-1" },
    method: "POST",
    url: "/gmail/v1/users/me/messages/send",
  },
  {
    name: "drafts.create",
    tool: "gmailUsersDraftsCreate",
    path: me,
    body: { message: { raw: replyRaw, threadId: "thread-1" } },
    method: "POST",
    url: "/gmail/v1/users/me/drafts",
  },
  { name: "drafts.update", tool: "gmailUsersDraftsUpdate", path: { ...me, id: "draft-1" }, body: { message: { raw } }, method: "PUT", url: "/gmail/v1/users/me/drafts/draft-1" },
  { name: "drafts.send", tool: "gmailUsersDraftsSend", path: me, body: { id: "draft-1" }, method: "POST", url: "/gmail/v1/users/me/drafts/send" },
  { name: "messages.insert", tool: "gmailUsersMessagesInsert", path: me, body: { raw }, method: "POST", url: "/gmail/v1/users/me/messages" },
  { name: "messages.import", tool: "gmailUsersMessagesImport", path: me, body: { raw }, method: "POST", url: "/gmail/v1/users/me/messages/import" },
] as const;

/** The upload operations: a simple upload of the RFC 822 message to Gmail's /upload path. */
const mediaCases = [
  { tool: "gmailUsersMessagesSendMedia", path: me, method: "POST", url: "/upload/gmail/v1/users/me/messages/send" },
  { tool: "gmailUsersMessagesInsertMedia", path: me, method: "POST", url: "/upload/gmail/v1/users/me/messages" },
  { tool: "gmailUsersMessagesImportMedia", path: me, method: "POST", url: "/upload/gmail/v1/users/me/messages/import" },
  { tool: "gmailUsersDraftsCreateMedia", path: me, method: "POST", url: "/upload/gmail/v1/users/me/drafts" },
  { tool: "gmailUsersDraftsUpdateMedia", path: { ...me, id: "draft-1" }, method: "PUT", url: "/upload/gmail/v1/users/me/drafts/draft-1" },
] as const;

/**
 * Calls a write twice: first without approval, which must stop before any request reaches Google,
 * then with the user's approval. Returns the one request the approved call sent.
 */
const approvedCall = async (host: Host, tool: string, input: unknown): Promise<Recorded> => {
  const sent = host.requests.length;
  const unapproved = await host.call(tool, input);
  assert.equal(unapproved.ok ? "ok" : unapproved.error._tag, "HostToolApprovalRequired", `${tool} ran without approval`);
  assert.equal(host.requests.length, sent, `${tool} reached Google before approval`);
  const approved = await host.call(tool, input, { approve: true });
  assert.ok(approved.ok, `${tool} failed: ${JSON.stringify(approved)}`);
  assert.equal(host.requests.length, sent + 1, `${tool} should send exactly one request`);
  const request = host.requests.at(-1)!;
  assert.equal(request.host, "gmail.googleapis.com");
  assert.equal(request.authorization, `Bearer ${token}`);
  return request;
};

/** The same Gmail API, standalone and as `api.gmail` in the all-in-one package. */
for (const mount of [
  { pkg: "gmail", prefix: "api.users." },
  { pkg: "google", prefix: "api.gmail.users." },
]) {
  describe(`${mount.pkg}: generated Gmail tools`, () => {
    let host: Host;
    before(async () => {
      host = await hostPackage(mount.pkg);
      host.answer(() => ({ id: "result-1" }));
    });
    after(() => host.close());

    for (const c of jsonCases) {
      test(`${c.name} asks first, then sends JSON to ${c.method} ${c.url}`, async () => {
        const input = { accountId, input: { path: c.path, contentType: "application/json", body: c.body } };
        const request = await approvedCall(host, mount.prefix + c.tool, input);
        assert.equal(request.method, c.method);
        assert.equal(request.path, c.url);
        assert.equal([...request.query].length, 0);
        assert.match(request.contentType ?? "", /^application\/json\b/);
        assert.deepEqual(JSON.parse(request.body.toString("utf8")), c.body);
      });
    }

    test("a reply's raw message carries the thread's subject and references", async () => {
      const input = { accountId, input: { path: me, contentType: "application/json", body: { raw: replyRaw, threadId: "thread-1" } } };
      const sent = JSON.parse((await approvedCall(host, `${mount.prefix}gmailUsersMessagesSend`, input)).body.toString("utf8"));
      assert.equal(sent.threadId, "thread-1");
      const headers = Buffer.from(sent.raw, "base64url").toString("utf8").split("\r\n\r\n")[0]!;
      assert.match(headers, /^Subject: Re: Synthetic test$/m);
      assert.match(headers, /^In-Reply-To: <original-1@example\.com>$/m);
      assert.match(headers, /^References: <original-1@example\.com>$/m);
    });

    for (const c of mediaCases) {
      test(`${c.tool} asks first, then uploads the message's bytes to ${c.method} ${c.url}`, async () => {
        const input = {
          accountId,
          input: { path: c.path, query: { uploadType: "media" }, contentType: "message/rfc822", body: Buffer.from(message).toString("base64") },
        };
        const request = await approvedCall(host, mount.prefix + c.tool, input);
        assert.equal(request.method, c.method);
        assert.equal(request.path, c.url);
        assert.equal(request.query.get("uploadType"), "media");
        assert.equal(request.contentType, "message/rfc822");
        assert.deepEqual(request.body, Buffer.from(message));
      });
    }

    test("drafts.send has no upload tool, because an upload cannot name the draft", async () => {
      const names = new Set((await host.tools()).map((tool) => tool.name));
      const media = [...names].filter((name) => name.startsWith(mount.prefix) && name.endsWith("Media")).sort();
      assert.deepEqual(media, mediaCases.map((c) => mount.prefix + c.tool).sort());
      assert.ok(names.has(`${mount.prefix}gmailUsersDraftsSend`));
    });

    test("Google's standard query parameters, such as quotaUser, are accepted and forwarded", async () => {
      const list = await host.call(`${mount.prefix}gmailUsersMessagesList`, {
        accountId,
        input: { path: me, query: { q: "is:unread", quotaUser: "quota-user-1", fields: "messages(id)", prettyPrint: false } },
      });
      assert.ok(list.ok, JSON.stringify(list));
      const listed = host.requests.at(-1)!;
      assert.equal(listed.method, "GET");
      assert.equal(listed.path, "/gmail/v1/users/me/messages");
      assert.equal(listed.query.get("quotaUser"), "quota-user-1");
      assert.equal(listed.query.get("fields"), "messages(id)");
      assert.equal(listed.query.get("prettyPrint"), "false");
    });

    test("uploads accept Google's standard query parameters too", async () => {
      const upload = await approvedCall(host, `${mount.prefix}gmailUsersMessagesSendMedia`, {
        accountId,
        input: { path: me, query: { uploadType: "media", quotaUser: "quota-user-1" }, contentType: "message/rfc822", body: Buffer.from(message).toString("base64") },
      });
      assert.equal(upload.query.get("uploadType"), "media");
      assert.equal(upload.query.get("quotaUser"), "quota-user-1");
    });

    test("an upload accepts only a simple upload", async () => {
      const result = await host.call(`${mount.prefix}gmailUsersMessagesSendMedia`, {
        accountId,
        input: { path: me, query: { uploadType: "resumable" }, contentType: "message/rfc822", body: Buffer.from(message).toString("base64") },
      });
      assert.equal(result.ok ? "ok" : result.error._tag, "HostInputInvalid");
    });

    test("a write whose body Gmail treats as optional can still omit it", async () => {
      const request = await approvedCall(host, `${mount.prefix}gmailUsersLabelsPatch`, { accountId, input: { path: { ...me, id: "Label_1" } } });
      assert.equal(request.method, "PATCH");
      assert.equal(request.path, "/gmail/v1/users/me/labels/Label_1");
      assert.equal(request.body.length, 0);
    });

    // A credential given as a tool argument would land in the request URL and the approval prompt;
    // the account binding supplies credentials, so these standard parameters are not offered.
    test("credential query parameters are refused and never reach a request URL", async () => {
      for (const name of credentialParameters) {
        const sent = host.requests.length;
        const listed = await host.call(`${mount.prefix}gmailUsersMessagesList`, { accountId, input: { path: me, query: { [name]: "synthetic-credential" } } });
        assert.equal(listed.ok ? "ok" : listed.error._tag, "HostInputInvalid", name);
        const upload = await host.call(`${mount.prefix}gmailUsersMessagesSendMedia`, {
          accountId,
          input: { path: me, query: { uploadType: "media", [name]: "synthetic-credential" }, contentType: "message/rfc822", body: Buffer.from(message).toString("base64") },
        });
        assert.equal(upload.ok ? "ok" : upload.error._tag, "HostInputInvalid", name);
        assert.equal(host.requests.length, sent, `${name} reached Google`);
      }
      for (const request of host.requests) for (const name of credentialParameters) assert.equal(request.query.has(name), false, `${name} in ${request.path}`);
    });
  });
}

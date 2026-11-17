// Runs the generated Drive file writes, in this package and in the all-in-one `google` package,
// through the apps host against a recording fake Google, and checks that content uploads reach
// Drive's /upload path with the file's exact bytes. Files, ids and tokens are synthetic. Run with
// `bun test packages/google-drive`.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { accountId, hostPackage, token, type Host, type Recorded } from "../../scripts/fake-google.ts";

const text = "name,count\nsynthetic,1\nCafé ✓,2\n";
// Bytes no text encoding would keep intact: a PNG signature, then every byte value.
const binary = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(Array.from({ length: 256 }, (_, i) => i))]);

/** Calls a write without approval (nothing may reach Google), then approved; returns the one request it sent. */
const approvedCall = async (host: Host, tool: string, input: unknown): Promise<Recorded> => {
  const sent = host.requests.length;
  const unapproved = await host.call(tool, input);
  assert.equal(unapproved.ok ? "ok" : unapproved.error._tag, "HostToolApprovalRequired", `${tool} ran without approval`);
  assert.equal(host.requests.length, sent, `${tool} reached Google before approval`);
  const approved = await host.call(tool, input, { approve: true });
  assert.ok(approved.ok, `${tool} failed: ${JSON.stringify(approved)}`);
  assert.equal(host.requests.length, sent + 1, `${tool} should send exactly one request`);
  const request = host.requests.at(-1)!;
  assert.equal(request.host, "www.googleapis.com");
  assert.equal(request.authorization, `Bearer ${token}`);
  return request;
};

/** The same Drive API, standalone and as `api.drive` in the all-in-one package. */
for (const mount of [
  { pkg: "google-drive", prefix: "api.files." },
  { pkg: "google", prefix: "api.drive.files." },
]) {
  describe(`${mount.pkg}: Drive content uploads`, () => {
    let host: Host;
    before(async () => {
      host = await hostPackage(mount.pkg);
      host.answer(() => ({ kind: "drive#file", id: "file-1", name: "Untitled" }));
    });
    after(() => host.close());

    const uploads = [
      { name: "creates a text file", tool: "driveFilesCreateMedia", path: undefined, method: "POST", url: "/upload/drive/v3/files", type: "text/csv", body: text, bytes: Buffer.from(text) },
      {
        name: "creates a binary file",
        tool: "driveFilesCreateMedia",
        path: undefined,
        method: "POST",
        url: "/upload/drive/v3/files",
        type: "image/png",
        body: binary.toString("base64"),
        bytes: binary,
      },
      {
        name: "replaces a file's content with text",
        tool: "driveFilesUpdateMedia",
        path: { fileId: "file-1" },
        method: "PATCH",
        url: "/upload/drive/v3/files/file-1",
        type: "text/plain",
        body: text,
        bytes: Buffer.from(text),
      },
      {
        name: "replaces a file's content with binary",
        tool: "driveFilesUpdateMedia",
        path: { fileId: "file-1" },
        method: "PATCH",
        url: "/upload/drive/v3/files/file-1",
        type: "application/pdf",
        body: binary.toString("base64"),
        bytes: binary,
      },
    ] as const;

    for (const c of uploads) {
      test(`${c.tool} ${c.name}: asks first, then sends the exact bytes to ${c.method} ${c.url}`, async () => {
        const input = { accountId, input: { ...(c.path ? { path: c.path } : {}), query: { uploadType: "media" }, contentType: c.type, body: c.body } };
        const request = await approvedCall(host, mount.prefix + c.tool, input);
        assert.equal(request.method, c.method);
        assert.equal(request.path, c.url);
        assert.equal(request.query.get("uploadType"), "media");
        assert.equal(request.contentType, c.type);
        assert.deepEqual(request.body, c.bytes);
      });
    }

    test("metadata writes still ask first and send JSON to the metadata path", async () => {
      const created = await approvedCall(host, `${mount.prefix}driveFilesCreate`, {
        accountId,
        input: { contentType: "application/json", body: { name: "synthetic.csv" } },
      });
      assert.equal(created.method, "POST");
      assert.equal(created.path, "/drive/v3/files");
      assert.deepEqual(JSON.parse(created.body.toString("utf8")), { name: "synthetic.csv" });

      const renamed = await approvedCall(host, `${mount.prefix}driveFilesUpdate`, {
        accountId,
        input: { path: { fileId: "file-1" }, query: { addParents: "folder-1" }, contentType: "application/json", body: { name: "renamed.csv" } },
      });
      assert.equal(renamed.method, "PATCH");
      assert.equal(renamed.path, "/drive/v3/files/file-1");
      assert.equal(renamed.query.get("addParents"), "folder-1");
      assert.deepEqual(JSON.parse(renamed.body.toString("utf8")), { name: "renamed.csv" });
    });

    test("uploads accept only a simple upload", async () => {
      for (const uploadType of ["multipart", "resumable"]) {
        const result = await host.call(`${mount.prefix}driveFilesCreateMedia`, {
          accountId,
          input: { query: { uploadType }, contentType: "text/plain", body: text },
        });
        assert.equal(result.ok ? "ok" : result.error._tag, "HostInputInvalid", uploadType);
      }
    });

    test("credential query parameters are refused and never reach a request URL", async () => {
      for (const name of ["access_token", "oauth_token", "key"]) {
        const sent = host.requests.length;
        const listed = await host.call(`${mount.prefix}driveFilesList`, { accountId, input: { query: { [name]: "synthetic-credential" } } });
        assert.equal(listed.ok ? "ok" : listed.error._tag, "HostInputInvalid", name);
        const upload = await host.call(`${mount.prefix}driveFilesCreateMedia`, {
          accountId,
          input: { query: { uploadType: "media", [name]: "synthetic-credential" }, contentType: "text/plain", body: text },
        });
        assert.equal(upload.ok ? "ok" : upload.error._tag, "HostInputInvalid", name);
        assert.equal(host.requests.length, sent, `${name} reached Google`);
      }
      for (const request of host.requests) for (const name of ["access_token", "oauth_token", "key"]) assert.equal(request.query.has(name), false, `${name} in ${request.path}`);
    });
  });
}

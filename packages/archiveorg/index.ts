import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const archive = "https://archive.org";
const s3 = "https://s3.us.archive.org";
const wayback = "https://web.archive.org";
const iiif = "https://iiif.archive.org";
const views = "https://be-api.us.archive.org/views/v1";

const archiveorg = defineProvider({
  name: "Archive.org",
  hosts: ["archive.org", "s3.us.archive.org", "web.archive.org", "iiif.archive.org", "be-api.us.archive.org"],
  auth: {
    apiKey: secrets({
      label: "IA-S3 keys (archive.org/account/s3.php)",
      fields: object({ accessKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  // The tasks service refuses unauthenticated calls, so a success proves the key pair works.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${archive}/services/tasks.php?summary=1`, {
      signal,
      headers: { Authorization: `LOW ${account.fields.accessKey}:${account.fields.secretKey}` },
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

type Account = { fields: { accessKey: string; secretKey: string } };

const auth = (account: Account) => ({ Authorization: `LOW ${account.fields.accessKey}:${account.fields.secretKey}` });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const enc = encodeURIComponent;
const path = (value: string) => value.split("/").map(enc).join("/");

const archiveTools = (account: Account, signal: AbortSignal) => {
  // Credentials go only to endpoints that need them; public reads are sent without a key.
  const headers = auth(account);
  return router({
    search: router(
      {
        advanced: query(
          {
            description:
              "Search items with Lucene syntax (for example `collection:nasa AND mediatype:movies`). fields lists the metadata fields to return (identifier, title, creator, date, downloads, mediatype...). sort is like `downloads desc`. rows defaults to 50 (max 10000); page starts at 1.",
            input: object({
              q: string(),
              fields: array(string()).optional(),
              sort: string().optional(),
              rows: number().optional(),
              page: number().optional(),
            }),
          },
          async ({ fetch }, { fields, ...input }) =>
            decodeJson(
              await fetch(
                `${archive}/advancedsearch.php?${search({ ...input, output: "json", fl: undefined })}${(fields ?? ["identifier", "title", "mediatype"]).map((f) => `&fl[]=${enc(f)}`).join("")}`,
                { signal },
              ),
              json(),
            ),
        ),
        scrape: query(
          {
            description:
              "Cursor-based search for result sets beyond 10000 items. Pass the returned cursor to get the next page. count is 100-10000. fields is a list of metadata fields to return; sorts is like `date asc`.",
            input: object({
              q: string(),
              fields: array(string()).optional(),
              sorts: string().optional(),
              count: number().optional(),
              cursor: string().optional(),
              total_only: boolean().optional(),
            }),
          },
          async ({ fetch }, { fields, ...input }) =>
            decodeJson(
              await fetch(
                `${archive}/services/search/v1/scrape?${search({ ...input, fields: fields?.join(",") })}`,
                { signal },
              ),
              json(),
            ),
        ),
      },
      { title: "Search", description: "Find items and collections on Archive.org." },
    ),
    items: router(
      {
        metadata: query(
          {
            description:
              "Read the full metadata of an item: metadata fields, file list (name, size, format, md5), server locations, reviews and more. Pass a path such as `metadata` or `files` to read only part of it.",
            input: object({ identifier: string(), path: string().optional() }),
          },
          async ({ fetch }, { identifier, path: sub }) =>
            decodeJson(
              await fetch(`${archive}/metadata/${enc(identifier)}${sub === undefined ? "" : `/${path(sub)}`}`, {
                signal,
              }),
              json(),
            ),
        ),
        readFile: query(
          {
            description:
              "Download a text file from an item and return its text, truncated to maxBytes (default 200000). Use items.metadata to list file names. Binary files are not supported.",
            input: object({ identifier: string(), file: string(), maxBytes: number().optional() }),
          },
          async ({ fetch }, { identifier, file, maxBytes }) => {
            const response = await fetch(`${archive}/download/${enc(identifier)}/${path(file)}`, { signal });
            if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}`);
            const text = await response.text();
            const limit = maxBytes ?? 200000;
            return { truncated: text.length > limit, text: text.slice(0, limit) };
          },
        ),
        updateMetadata: mutation(
          {
            description:
              "Edit an item's metadata with a JSON Patch (RFC 6902) array, for example [{\"op\":\"add\",\"path\":\"/title\",\"value\":\"New title\"}]. target is `metadata` (default) or a file as `files/<name>`. Needs write access to the item.",
            input: object({ identifier: string(), patch: array(json()), target: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { identifier, patch, target }) =>
            decodeJson(
              await fetch(`${archive}/metadata/${enc(identifier)}`, {
                method: "POST",
                signal,
                headers: { ...headers, "content-type": "application/x-www-form-urlencoded" },
                body: search({ "-target": target ?? "metadata", "-patch": JSON.stringify(patch) }),
              }),
              json(),
            ),
        ),
        iiifManifest: query(
          {
            description: "Fetch the IIIF Presentation (v2) manifest of a book or image item, listing its pages and image service URLs.",
            input: object({ identifier: string() }),
          },
          async ({ fetch }, { identifier }) =>
            decodeJson(await fetch(`${iiif}/iiif/2/${enc(identifier)}/manifest.json`, { signal }), json()),
        ),
        iiifImageInfo: query(
          {
            description:
              "Fetch IIIF Image API info.json (dimensions, tiles, sizes) for one image. imageId is `<identifier>$<page index>` for books or `<identifier>%2F<file path>` for files, URL-encoded as the manifest gives it.",
            input: object({ imageId: string() }),
          },
          async ({ fetch }, { imageId }) =>
            decodeJson(await fetch(`${iiif}/iiif/2/${imageId}/info.json`, { signal }), json()),
        ),
      },
      { title: "Items", description: "Read and edit item metadata and files." },
    ),
    upload: router(
      {
        putFile: mutation(
          {
            description:
              "Upload a text file to an item through the S3-like API, creating the item when createItem is true. metadata sets x-archive-meta headers on item creation (title, mediatype, collection, description, creator, date, subject). Text content only.",
            input: object({
              identifier: string(),
              file: string(),
              content: string(),
              contentType: string().optional(),
              createItem: boolean().optional(),
              metadata: record(string()).optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { identifier, file, content, contentType, createItem, metadata }) => {
            const extra: Record<string, string> = {};
            for (const [key, value] of Object.entries(metadata ?? {})) extra[`x-archive-meta-${key.replace(/_/g, "--")}`] = value;
            const response = await fetch(`${s3}/${enc(identifier)}/${path(file)}`, {
              method: "PUT",
              signal,
              headers: {
                ...headers,
                ...extra,
                ...(createItem === true ? { "x-archive-auto-make-bucket": "1" } : {}),
                "content-type": contentType ?? "text/plain",
              },
              body: content,
            });
            if (!response.ok) throw new Error(`Upload failed with HTTP ${response.status}: ${await response.text()}`);
            return { ok: true, status: response.status, url: `${archive}/download/${identifier}/${file}` };
          },
        ),
        deleteFile: mutation(
          {
            description:
              "Delete one file from an item. By default only that file is deleted; set cascade to true to also delete the files derived from it. Needs write access to the item.",
            input: object({ identifier: string(), file: string(), cascade: boolean().optional() }),
            approval: always(),
          },
          async ({ fetch }, { identifier, file, cascade }) => {
            const response = await fetch(`${s3}/${enc(identifier)}/${path(file)}`, {
              method: "DELETE",
              signal,
              headers: { ...headers, ...(cascade === true ? { "x-archive-cascade-delete": "1" } : {}) },
            });
            if (!response.ok) throw new Error(`Delete failed with HTTP ${response.status}: ${await response.text()}`);
            return { ok: true, status: response.status };
          },
        ),
        limit: query(
          {
            description: "Check whether the S3-like API is over its upload limit for an item bucket.",
            input: object({ identifier: string().optional() }),
          },
          async ({ fetch }, { identifier }) =>
            decodeJson(
              await fetch(
                `${s3}/?${search({ check_limit: 1, accesskey: account.fields.accessKey, bucket: identifier })}`,
                { signal, headers },
              ),
              json(),
            ),
        ),
      },
      { title: "Upload", description: "Create items and manage their files with the S3-like API." },
    ),
    reviews: router(
      {
        mine: query(
          {
            description:
              "Fetch the connected account's own review of an item (404 when it has none). This does not list other users' reviews; read them with items.metadata using path `reviews`.",
            input: object({ identifier: string() }),
          },
          async ({ fetch }, { identifier }) =>
            decodeJson(
              await fetch(`${archive}/services/reviews.php?${search({ identifier })}`, { signal, headers }),
              json(),
            ),
        ),
        post: mutation(
          {
            description: "Add or replace the connected account's review of an item. stars is 1-5.",
            input: object({ identifier: string(), title: string(), body: string().optional(), stars: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, { identifier, ...review }) =>
            decodeJson(
              await fetch(`${archive}/services/reviews.php?${search({ identifier })}`, {
                method: "POST",
                signal,
                headers: { ...headers, "content-type": "application/json" },
                body: JSON.stringify(review),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete the connected account's review of an item.",
            input: object({ identifier: string() }),
            approval: always(),
          },
          async ({ fetch }, { identifier }) =>
            decodeJson(
              await fetch(`${archive}/services/reviews.php?${search({ identifier })}`, { method: "DELETE", signal, headers }),
              json(),
            ),
        ),
      },
      { title: "Reviews", description: "Read and write item reviews." },
    ),
    tasks: router(
      {
        list: query(
          {
            description:
              "List the connected account's catalog tasks (derives, edits, deletes). Filter by identifier, task cmd, or a `submitter`. summary returns counts by state instead. limit defaults to 50.",
            input: object({
              identifier: string().optional(),
              cmd: string().optional(),
              submitter: string().optional(),
              catalog: boolean().optional(),
              history: boolean().optional(),
              summary: boolean().optional(),
              limit: number().optional(),
            }),
          },
          async ({ fetch }, { catalog, history, summary, ...input }) =>
            decodeJson(
              await fetch(
                `${archive}/services/tasks.php?${search({
                  ...input,
                  catalog: catalog === false ? 0 : 1,
                  history: history === true ? 1 : 0,
                  summary: summary === true ? 1 : undefined,
                })}`,
                { signal, headers },
              ),
              json(),
            ),
        ),
        submit: mutation(
          {
            description:
              "Queue a catalog task for an item, for example cmd `derive.php` to regenerate derivatives, `make_dark.php` or `make_undark.php` to restrict or restore access (these require args {\"comment\":\"reason\"}), `rename.php` (args {\"new_identifier\":\"...\"}), `fixer.php` with args {\"ops\":\"noop\"}. Needs write access to the item.",
            input: object({ identifier: string(), cmd: string(), args: record(json()).optional(), priority: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${archive}/services/tasks.php`, {
                method: "POST",
                signal,
                headers: { ...headers, "content-type": "application/json" },
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
      },
      { title: "Tasks", description: "Inspect and queue catalog tasks." },
    ),
    stats: router(
      {
        views: query(
          {
            description: "View counts (all time, last 30 days, last 7 days) for up to many items. Pass identifiers.",
            input: object({ identifiers: array(string()) }),
          },
          async ({ fetch }, { identifiers }) =>
            decodeJson(await fetch(`${views}/short/${identifiers.map(enc).join(",")}`, { signal }), json()),
        ),
        viewsByDay: query(
          {
            description: "Daily view counts for items, with per-day totals and country breakdown where available.",
            input: object({ identifiers: array(string()) }),
          },
          async ({ fetch }, { identifiers }) =>
            decodeJson(await fetch(`${views}/long/${identifiers.map(enc).join(",")}`, { signal }), json()),
        ),
      },
      { title: "Stats", description: "Usage statistics for items." },
    ),
    wayback: router(
      {
        available: query(
          {
            description:
              "Find the archived snapshot closest to a timestamp (YYYYMMDDhhmmss, default now) for a URL. Returns the snapshot URL or an empty result.",
            input: object({ url: string(), timestamp: string().optional() }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${archive}/wayback/available?${search(input)}`, { signal }), json()),
        ),
        cdx: query(
          {
            description:
              "Search the Wayback CDX index of captures. Set matchType to exact, prefix, host or domain; from/to are timestamps; filter is like `statuscode:200` (repeatable as a list); collapse like `timestamp:8` dedupes by day; limit caps rows. Returns rows with the header first.",
            input: object({
              url: string(),
              matchType: string().optional(),
              from: string().optional(),
              to: string().optional(),
              filter: array(string()).optional(),
              collapse: string().optional(),
              limit: number().optional(),
              offset: number().optional(),
              fl: string().optional(),
            }),
          },
          async ({ fetch }, { filter, ...input }) =>
            decodeJson(
              await fetch(
                `${wayback}/cdx/search/cdx?${search({ ...input, output: "json" })}${(filter ?? []).map((f) => `&filter=${enc(f)}`).join("")}`,
                { signal },
              ),
              json(),
            ),
        ),
        save: mutation(
          {
            description:
              "Queue a Save Page Now capture of a URL. Returns the job JSON (with a job_id); the capture is not finished yet. Poll wayback.saveStatus with the job_id for the final timestamp. Counts against the account's capture quota.",
            input: object({ url: string() }),
            approval: always(),
          },
          async ({ fetch }, { url }) =>
            decodeJson(
              await fetch(`${wayback}/save`, {
                method: "POST",
                signal,
                headers: { ...headers, Accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
                body: search({ url }),
              }),
              json(),
            ),
        ),
        saveStatus: query(
          {
            description: "Check a Save Page Now job by the job_id returned from wayback.save. status is pending, success or error; on success the result includes the capture timestamp.",
            input: object({ jobId: string() }),
          },
          async ({ fetch }, { jobId }) =>
            decodeJson(
              await fetch(`${wayback}/save/status/${enc(jobId)}`, { signal, headers: { ...headers, Accept: "application/json" } }),
              json(),
            ),
        ),
      },
      { title: "Wayback Machine", description: "Look up and request web page captures." },
    ),
  });
};

export default defineApp({ user: { accounts: { archiveorg: archiveorg.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.archiveorg ?? [], (account) => archiveTools(account, signal), { signal }), {
    title: "Archive.org",
    description:
      "Internet Archive: search items, read metadata and files, query the Wayback Machine, upload items, write reviews and queue tasks.",
    icons,
  }),
}));

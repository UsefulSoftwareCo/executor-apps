// Publishes a feed directory written by scripts/feed.ts to the catalog's R2 bucket, which Executor
// Cloud serves at https://catalog.executor.sh. Readers only ever see a complete feed: new and changed
// files go up first, then index.json, and only then are objects the new index no longer names
// deleted. Unchanged files (same MD5 as the stored ETag) are skipped.
// Usage: bun scripts/publish.ts <feed dir>
// Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Workers R2 Storage write on the bucket),
//      CATALOG_BUCKET (default executor-app-catalog).
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const dir = process.argv[2];
if (dir === undefined) throw new Error("Usage: bun scripts/publish.ts <feed dir>");
const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};
const accountId = required("CLOUDFLARE_ACCOUNT_ID");
const token = required("CLOUDFLARE_API_TOKEN");
const bucket = process.env.CATALOG_BUCKET || "executor-app-catalog";

const types: Record<string, string> = {
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};
// Icons are content-addressed and never change; the index and app sources do.
const cacheControl = (key: string) =>
  key.startsWith("icons/") ? "public, max-age=31536000, immutable" : "public, max-age=300";

// R2's S3 credentials for an API token: its ID and the SHA-256 of its value.
const verify = async (path: string) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = (await response.json()) as { success: boolean; result?: { id: string } };
  return body.success ? body.result?.id : undefined;
};
const tokenId = (await verify(`accounts/${accountId}/tokens/verify`)) ?? (await verify("user/tokens/verify"));
if (tokenId === undefined) throw new Error("CLOUDFLARE_API_TOKEN did not verify");
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: tokenId, secretAccessKey: createHash("sha256").update(token).digest("hex") },
});

const walk = (path: string): string[] =>
  readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    return statSync(child).isDirectory() ? walk(child) : [relative(dir, child)];
  });
const local = new Map(
  walk(dir).map((key) => {
    const type = types[extname(key)];
    if (type === undefined) throw new Error(`no content type for ${key}`);
    const body = readFileSync(join(dir, key));
    return [key, { body, type, md5: createHash("md5").update(body).digest("hex") }];
  }),
);
if (!local.has("index.json")) throw new Error(`${dir} has no index.json`);

const remote = new Map<string, string>();
for (let cursor: string | undefined; ; ) {
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: cursor }));
  for (const object of page.Contents ?? [])
    if (object.Key !== undefined) remote.set(object.Key, (object.ETag ?? "").replaceAll('"', ""));
  if (!page.IsTruncated) break;
  cursor = page.NextContinuationToken;
}

const put = (key: string) => {
  const file = local.get(key)!;
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.body,
      ContentType: file.type,
      CacheControl: cacheControl(key),
    }),
  );
};
const changed = [...local.keys()].filter((key) => key !== "index.json" && remote.get(key) !== local.get(key)!.md5);
let next = 0;
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (next < changed.length) await put(changed[next++]!);
  }),
);
await put("index.json");
const stale = [...remote.keys()].filter((key) => !local.has(key));
for (let start = 0; start < stale.length; start += 1000)
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: stale.slice(start, start + 1000).map((Key) => ({ Key })), Quiet: true },
    }),
  );
console.log(
  `${bucket}: ${changed.length} uploaded, index.json updated, ${stale.length} deleted, ${local.size - changed.length - 1} unchanged`,
);

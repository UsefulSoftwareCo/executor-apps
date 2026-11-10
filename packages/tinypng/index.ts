import {
  accountRouter,
  array,
  boolean,
  defineApp,
  defineProvider,
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

const base = "https://api.tinify.com";
const outputPrefix = `${base}/output/`;
// Binary results are returned inline as base64, so cap what a tool call may carry.
const maxInlineBytes = 2_000_000;

const tinypng = defineProvider({
  name: "TinyPNG",
  hosts: ["api.tinify.com"],
  auth: {
    apiKey: secrets({
      label: "API key (from tinify.com/dashboard/api)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint, and every compression counts against the monthly quota.
  // POST /shrink with an empty body checks credentials first: 401 for a bad key, 400 (no input) for a good one.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/shrink`, {
      method: "POST",
      signal,
      headers: { Authorization: authHeader(account.fields.token) },
    });
    if (response.status === 401) throw new Error("TinyPNG rejected the API key (401)");
    if (response.status !== 400 && !response.ok) throw new Error(`TinyPNG health check failed (${response.status})`);
  },
});

const authHeader = (token: string) => `Basic ${btoa(`api:${token}`)}`;

type Fetch = typeof fetch;

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
};

const failure = async (response: Response) => {
  const text = await response.text();
  return new Error(`TinyPNG returned ${response.status}: ${text.slice(0, 500)}`);
};

const imageInfo = (response: Response) => ({
  compressionCount: Number(response.headers.get("compression-count") ?? "") || null,
  width: Number(response.headers.get("image-width") ?? "") || null,
  height: Number(response.headers.get("image-height") ?? "") || null,
  type: response.headers.get("content-type"),
});

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: authHeader(token) };
  const shrink = async (url: string) => {
    const response = await fetcher(`${base}/shrink`, {
      method: "POST",
      signal,
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ source: { url } }),
    });
    if (!response.ok) throw await failure(response);
    const location = response.headers.get("location");
    if (!location?.startsWith(outputPrefix)) throw new Error("TinyPNG did not return an output location");
    const body = (await response.json()) as { input?: unknown; output?: unknown };
    return {
      outputUrl: location,
      compressionCount: Number(response.headers.get("compression-count") ?? "") || null,
      input: body.input ?? null,
      output: body.output ?? null,
    };
  };
  const download = async (outputUrl: string, operations?: Record<string, unknown>) => {
    if (!outputUrl.startsWith(outputPrefix)) throw new Error(`outputUrl must start with ${outputPrefix}`);
    const response = await fetcher(outputUrl, {
      method: operations ? "POST" : "GET",
      signal,
      headers: operations ? { ...headers, "content-type": "application/json" } : headers,
      ...(operations ? { body: JSON.stringify(operations) } : {}),
    });
    if (!response.ok) throw await failure(response);
    const info = imageInfo(response);
    // A store operation answers with the stored object's location instead of image bytes.
    if (operations?.store) return { ...info, stored: true, location: response.headers.get("location") };
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > maxInlineBytes
      ? { ...info, size: buffer.byteLength, base64: null, note: `Image exceeds ${maxInlineBytes} bytes; use the store option to write it to S3 or GCS.` }
      : { ...info, size: buffer.byteLength, base64: toBase64(buffer) };
  };
  return { shrink, download };
}

const Store = object({
  service: string({ minLength: 1 }),
  path: string({ minLength: 1 }),
  awsAccessKeyId: string().optional(),
  awsSecretAccessKey: string().optional(),
  region: string().optional(),
  acl: string().optional(),
  gcpAccessToken: string().optional(),
  headers: record(string()).optional(),
});

const Resize = object({
  method: string({ minLength: 1 }),
  width: number().optional(),
  height: number().optional(),
});

export default defineApp(
  { user: { accounts: { tinypng: tinypng.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tinypng ?? [],
        (account) => {
          const api = client(account.fields.token, fetch, signal);
          return router({
            shrink: mutation(
              {
                description:
                  "Compress a WebP, JPEG, PNG or AVIF image from a public URL. Returns the input/output sizes, the compression count for the month and an outputUrl for download or further operations.",
                input: object({ url: string({ minLength: 1 }) }),
                approval: always(),
              },
              async (_ctx, { url }) => api.shrink(url),
            ),
            download: mutation(
              {
                description:
                  "Fetch a previously shrunk image by its outputUrl (https://api.tinify.com/output/...). Returns the image as base64 with its dimensions, up to 2 MB. Optionally apply resize, convert, background or preserve first; each resize or convert costs one extra compression.",
                input: object({
                  outputUrl: string({ minLength: 1 }),
                  resize: Resize.optional(),
                  convert: array(string()).optional(),
                  background: string().optional(),
                  preserve: array(string()).optional(),
                }),
                approval: always(),
              },
              async (_ctx, input) => {
                const operations = buildOperations(input);
                return api.download(input.outputUrl, Object.keys(operations).length ? operations : undefined);
              },
            ),
            process: mutation(
              {
                description:
                  "Compress an image from a URL and optionally resize, convert, flatten a transparent background, preserve metadata, and store the result in your own Amazon S3 or Google Cloud Storage bucket. resize.method is scale (width or height), fit, cover or thumb (width and height). convert is a list of MIME types (image/webp, image/jpeg, image/png, image/avif) or [\"*/*\"] for the smallest. background is a hex color or white/black. preserve is any of copyright, creation, location. store.service is s3 (awsAccessKeyId, awsSecretAccessKey, region, path as bucket/key, optional acl) or gcs (gcpAccessToken, path). Without store the image is returned as base64 up to 2 MB.",
                input: object({
                  url: string({ minLength: 1 }),
                  resize: Resize.optional(),
                  convert: array(string()).optional(),
                  background: string().optional(),
                  preserve: array(string()).optional(),
                  store: Store.optional(),
                }),
                approval: always(),
              },
              async (_ctx, input) => {
                const shrunk = await api.shrink(input.url);
                const operations = buildOperations(input);
                if (!Object.keys(operations).length) return shrunk;
                const result = await api.download(shrunk.outputUrl, operations);
                return { outputUrl: shrunk.outputUrl, input: shrunk.input, ...result };
              },
            ),
            usage: query(
              {
                description:
                  "Compressions used this calendar month, read from the Compression-Count header (null when the API omits it). Does not consume a compression.",
                input: object({ verbose: boolean().optional() }),
              },
              async () => {
                const response = await fetch(`${base}/shrink`, {
                  method: "POST",
                  signal,
                  headers: { Authorization: authHeader(account.fields.token) },
                });
                if (response.status === 401) throw new Error("TinyPNG rejected the API key (401)");
                return { compressionCount: Number(response.headers.get("compression-count") ?? "") || null };
              },
            ),
          });
        },
        { signal },
      ),
      {
        title: "TinyPNG",
        description:
          "Compress, resize and convert WebP, JPEG, PNG and AVIF images with the TinyPNG (Tinify) API, and store results in S3 or Google Cloud Storage. Images are read from public URLs.",
        icons,
      },
    ),
  }),
);

type Ops = {
  resize?: { method: string; width?: number; height?: number };
  convert?: readonly string[];
  background?: string;
  preserve?: readonly string[];
  store?: {
    service: string;
    path: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    region?: string;
    acl?: string;
    gcpAccessToken?: string;
    headers?: Readonly<Record<string, string>>;
  };
};

function buildOperations(input: Ops): Record<string, unknown> {
  const ops: Record<string, unknown> = {};
  if (input.resize) ops.resize = input.resize;
  if (input.convert?.length) ops.convert = { type: input.convert.length === 1 ? input.convert[0] : input.convert };
  if (input.background) ops.transform = { background: input.background };
  if (input.preserve?.length) ops.preserve = input.preserve;
  if (input.store) {
    const s = input.store;
    ops.store = {
      service: s.service,
      path: s.path,
      ...(s.awsAccessKeyId ? { aws_access_key_id: s.awsAccessKeyId } : {}),
      ...(s.awsSecretAccessKey ? { aws_secret_access_key: s.awsSecretAccessKey } : {}),
      ...(s.region ? { region: s.region } : {}),
      ...(s.acl ? { acl: s.acl } : {}),
      ...(s.gcpAccessToken ? { gcp_access_token: s.gcpAccessToken } : {}),
      ...(s.headers ? { headers: s.headers } : {}),
    };
  }
  return ops;
}

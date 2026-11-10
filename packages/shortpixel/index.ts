import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.shortpixel.com/v2";
// ShortPixel asks integrations to identify themselves with up to five alphanumeric characters.
const pluginVersion = "exctr";

const shortpixel = defineProvider({
  name: "ShortPixel",
  hosts: ["api.shortpixel.com"],
  auth: {
    // The key is shown in the ShortPixel dashboard and sent in the request, not in a header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    await status(account.fields.token, fetch, signal);
  },
});

type Fetcher = typeof fetch;

// api-status.php is NOT in ShortPixel's API docs. The endpoint and request shape come from the official
// shortpixel-php client (lib/ShortPixel/Client.php, Client::apiStatus: multipart POST to /v2/api-status.php
// with a `key` form field), which the client README documents as "Get account status and credits info".
// It answers HTTP 200 for a bad key too, with a negative Status.Code (observed: -402 "Wrong API Key.").
// The success Status.Code and the quota field names are unverified, so only reject negative codes.
const statusSchema = object({ Status: object({ Code: number(), Message: string() }) });

async function status(key: string, fetcher: Fetcher, signal: AbortSignal | undefined) {
  const form = new FormData();
  form.set("key", key);
  const response = await fetcher(`${api}/api-status.php`, { method: "POST", body: form, signal });
  const parsed = await decodeJson(response.clone(), statusSchema);
  if (parsed.Status.Code < 0) {
    throw new Error(`ShortPixel rejected the API key (code ${parsed.Status.Code}): ${parsed.Status.Message}`);
  }
  return await decodeJson(response, json());
}

export default defineApp(
  { user: { accounts: { shortpixel: shortpixel.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shortpixel ?? [],
        (account) => {
          const key = account.fields.token;
          return withApprovals(
            router({
              account: router({
                status: query(
                  {
                    description:
                      "Check the API key and return the raw account status JSON from the undocumented api-status.php endpoint (used by the official shortpixel-php client). Expected to include quota usage counters; the exact fields are not documented by ShortPixel. A negative Status.Code means the key was rejected.",
                    input: object({}),
                  },
                  async () => status(key, fetch, signal),
                ),
              }),
              images: router({
                optimize: mutation(
                  {
                    description:
                      "Optimize up to 100 publicly reachable images by URL (Reducer API). Consumes credits. Each result has Status.Code 1 (queued, call again with the same urls to poll) or 2 (done, with LossyURL / LosslessURL and WebP/AVIF URLs). Negative codes are errors (-401 bad key, -403 quota exceeded).",
                    input: object({
                      // ShortPixel caps urllist at 100 URLs (-107 otherwise); the apps array builder has no max, so the API enforces it.
                      urls: array(string({ minLength: 1 })),
                      lossy: number().default(1),
                      wait: number().default(20),
                      resize: number().optional(),
                      resizeWidth: number().optional(),
                      resizeHeight: number().optional(),
                      upscale: number().optional(),
                      convertTo: string().optional(),
                      bgRemove: string().optional(),
                      keepExif: number().optional(),
                      cmyk2rgb: number().optional(),
                      refresh: number().optional(),
                    }),
                  },
                  async (_ctx, args) => {
                    const body: Record<string, unknown> = {
                      plugin_version: pluginVersion,
                      key,
                      lossy: args.lossy,
                      wait: args.wait,
                      urllist: args.urls,
                    };
                    const optional: Record<string, unknown> = {
                      resize: args.resize,
                      resize_width: args.resizeWidth,
                      resize_height: args.resizeHeight,
                      upscale: args.upscale,
                      convertto: args.convertTo,
                      bg_remove: args.bgRemove,
                      keep_exif: args.keepExif,
                      cmyk2rgb: args.cmyk2rgb,
                      refresh: args.refresh,
                    };
                    for (const [name, value] of Object.entries(optional)) if (value !== undefined) body[name] = value;
                    const response = await fetch(`${api}/reducer.php`, {
                      method: "POST",
                      signal,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });
                    return { results: await decodeJson(response, json()) };
                  },
                ),
              }),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "ShortPixel",
        description: "Compress, resize, convert (WebP/AVIF), upscale and background-remove images by URL, and check ShortPixel credit usage.",
        instructions:
          "images.optimize spends credits. lossy: 0 lossless, 1 lossy, 2 glossy. resize: 0 none, 1 outer, 3 inner, 4 AI smart crop (needs resizeWidth and resizeHeight). convertTo examples: +webp, +avif, webp|avif. A result with Status.Code 1 is still processing; repeat the same call to poll.",
        icons,
      },
    ),
  }),
);

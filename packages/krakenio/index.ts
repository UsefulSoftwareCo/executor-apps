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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.kraken.io";

const krakenio = defineProvider({
  name: "Kraken.io",
  hosts: ["api.kraken.io"],
  auth: {
    // API Key and Secret come from the API Credentials page of the Kraken.io account; they travel in the JSON body.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user_status`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ auth: auth(account.fields) }),
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

type Fields = { apiKey: string; apiSecret: string };

function auth(fields: Fields) {
  return { api_key: fields.apiKey, api_secret: fields.apiSecret };
}

const options = {
  wait: boolean().optional(),
  dev: boolean().optional(),
  lossy: boolean().optional(),
  quality: number().optional(),
  resize: json().optional(),
  convert: json().optional(),
  preserve_meta: array(string()).optional(),
  auto_orient: boolean().optional(),
  chroma_subsampling: string().optional(),
  callback_url: string().optional(),
  s3_store: record(json()).optional(),
  gcs_store: record(json()).optional(),
  cf_store: record(json()).optional(),
  azure_store: record(json()).optional(),
  sl_store: record(json()).optional(),
};

const optionDocs =
  "Options: wait (default true: return results instead of an id), dev (sandbox mode, randomized results), lossy, quality (1-100), " +
  "resize ({width, height, strategy: exact|crop|portrait|landscape|auto|fit}, or an array of those with an id for image sets), " +
  "convert ({format: jpeg|png|gif|webp|avif, background, keep_extension}), preserve_meta (profile, date, copyright, geotag, orientation), " +
  "auto_orient, chroma_subsampling (4:2:0, 4:2:2, 4:4:4), callback_url, and one external store: s3_store, gcs_store, cf_store, azure_store, sl_store. " +
  "Optimized files stay on Kraken.io servers for one hour; download kraked_url promptly.";

function rest(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return router({
    optimizeUrl: mutation(
      {
        description: `Optimize, resize or convert an image that is already online, by URL. ${optionDocs}`,
        input: object({ url: string({ minLength: 1 }), ...options }),
      },
      async (_ctx, { url, ...rest }) => {
        const response = await fetcher(`${base}/v1/url`, {
          method: "POST",
          signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ auth: auth(fields), url, wait: true, ...rest }),
        });
        return decodeJson(response, json());
      },
    ),
    optimizeUpload: mutation(
      {
        description: `Upload an image as base64 data and optimize, resize or convert it. ${optionDocs}`,
        input: object({
          fileName: string({ minLength: 1 }),
          contentBase64: string({ minLength: 1 }),
          mimeType: string().optional(),
          ...options,
        }),
      },
      async (_ctx, { fileName, contentBase64, mimeType, ...rest }) => {
        const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
        const form = new FormData();
        form.set("data", JSON.stringify({ auth: auth(fields), wait: true, ...rest }));
        form.set("file", new Blob([bytes], { type: mimeType ?? "application/octet-stream" }), fileName);
        const response = await fetcher(`${base}/v1/upload`, { method: "POST", signal, body: form });
        return decodeJson(response, json());
      },
    ),
    userStatus: query(
      { description: "Get the account's plan name, active state and quota (total, used, remaining).", input: object({}) },
      async () => {
        const response = await fetcher(`${base}/user_status`, {
          method: "POST",
          signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ auth: auth(fields) }),
        });
        return decodeJson(response, json());
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { krakenio: krakenio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.krakenio ?? [],
        async (account) =>
          withApprovals(rest(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Kraken.io",
        description: "Image optimization: compress, resize and convert images from a URL or uploaded data; check quota.",
        icons,
      },
    ),
  }),
);

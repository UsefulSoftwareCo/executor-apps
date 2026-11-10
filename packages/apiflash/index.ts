import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
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

const base = "https://api.apiflash.com/v1/urltoimage";

const apiflash = defineProvider({
  name: "ApiFlash",
  hosts: ["api.apiflash.com"],
  auth: {
    // The access key is on the ApiFlash dashboard (https://apiflash.com/dashboard/access_keys).
    apiKey: secrets({
      label: "Access key",
      fields: object({ accessKey: string({ minLength: 1 }) }),
    }),
  },
  // The quota endpoint is authenticated, read-only and does not consume a capture.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/quota?access_key=${encodeURIComponent(account.fields.accessKey)}`, { signal });
    await decodeJson(response, object({ limit: number(), remaining: number() }));
  },
});

const capture = object({
  url: string({ minLength: 1 }),
  format: string().optional(),
  width: number().optional(),
  height: number().optional(),
  full_page: boolean().optional(),
  scroll_page: boolean().optional(),
  quality: number().optional(),
  scale_factor: number().optional(),
  transparent: boolean().optional(),
  thumbnail_width: number().optional(),
  delay: number().optional(),
  wait_until: string().optional(),
  wait_for: string().optional(),
  element: string().optional(),
  element_overlap: boolean().optional(),
  crop: string().optional(),
  fresh: boolean().optional(),
  ttl: number().optional(),
  no_ads: boolean().optional(),
  no_tracking: boolean().optional(),
  no_cookie_banners: boolean().optional(),
  css: string().optional(),
  js: string().optional(),
  cookies: string().optional(),
  headers: string().optional(),
  user_agent: string().optional(),
  accept_language: string().optional(),
  time_zone: string().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
  accuracy: number().optional(),
  proxy: string().optional(),
  fail_on_status: string().optional(),
  extract_html: boolean().optional(),
  extract_text: boolean().optional(),
  s3_access_key_id: string().optional(),
  s3_secret_key: string().optional(),
  s3_bucket: string().optional(),
  s3_key: string().optional(),
  s3_region: string().optional(),
  s3_endpoint: string().optional(),
});

const batch = object({
  urls: array(string({ minLength: 1 })),
  format: string().optional(),
  width: number().optional(),
  height: number().optional(),
  full_page: boolean().optional(),
  fresh: boolean().optional(),
});

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON error bodies are returned as text.
  }
  if (!response.ok) throw new Error(`ApiFlash returned ${response.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  return parsed;
}

function tools(accessKey: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const shoot = async (input: Record<string, unknown>) => {
    const target = new URL(base);
    target.searchParams.set("access_key", accessKey);
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    // JSON is the only useful response here: the image bytes cannot be returned through a tool.
    target.searchParams.set("response_type", "json");
    return readJson(await fetcher(target.toString(), { signal }));
  };
  return router({
    screenshots: router({
      capture: mutation(
        {
          description:
            "Capture a screenshot of a web page and return JSON with the screenshot URL (plus extracted HTML or text when requested). Consumes one capture of the plan quota. Optional params: format (jpeg|png|webp), width, height, full_page, scroll_page, quality (0-100), scale_factor (1|2), transparent (png), thumbnail_width, delay (0-10 s), wait_until (dom_loaded|page_loaded|network_idle), wait_for (CSS selector), element (CSS selector), crop (left,top,width,height), fresh, ttl (seconds), no_ads, no_tracking, no_cookie_banners, css, js, cookies and headers (semicolon-separated name=value), user_agent, accept_language, time_zone, latitude/longitude/accuracy, proxy, fail_on_status (e.g. 400,404,500-511), extract_html, extract_text, and s3_* fields to upload to your own S3-compatible bucket.",
          input: capture,
        },
        async (_ctx, input) => shoot(input),
      ),
      captureBatch: mutation(
        {
          description:
            "Capture screenshots of several URLs with the same viewport and format settings, one ApiFlash request per URL, and return one result (or error) per URL. Consumes one capture per URL.",
          input: batch,
        },
        async (_ctx, { urls, ...settings }) =>
          Promise.all(
            urls.map(async (url) => {
              try {
                return { url, result: await shoot({ url, ...settings }) };
              } catch (error) {
                return { url, error: error instanceof Error ? error.message : String(error) };
              }
            }),
          ),
      ),
    }),
    account: router({
      quota: query(
        { description: "Get the plan's capture limit, remaining captures and the UTC epoch second at which the quota resets.", input: object({}) },
        async () => readJson(await fetcher(`${base}/quota?access_key=${encodeURIComponent(accessKey)}`, { signal })),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { apiflash: apiflash.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apiflash ?? [],
        (account) => withApprovals(tools(account.fields.accessKey, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "ApiFlash",
        description: "Capture website screenshots with ApiFlash: viewport, full page, element, mobile and geolocation emulation, ad and cookie-banner blocking, and quota checks.",
        icons,
      },
    ),
  }),
);

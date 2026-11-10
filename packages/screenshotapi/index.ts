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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const renderUrl = "https://shot.screenshotapi.net/v3/screenshot";
const bulkUrl = "https://api.screenshotapi.net/v1/bulk";

const screenshotapi = defineProvider({
  name: "Screenshot API",
  hosts: ["shot.screenshotapi.net", "api.screenshotapi.net"],
  auth: {
    // The API key is on the dashboard at https://app.screenshotapi.net.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // ScreenshotAPI has no account endpoint. Looking up a job that does not exist is free and
  // answers 200 with {"error":"Authorization error"} when the token is wrong.
  async health({ account, fetch, signal }) {
    const params = new URLSearchParams({ token: account.fields.token, uuid: "00000000-0000-0000-0000-000000000000" });
    const response = await fetch(`${bulkUrl}/csv/status?${params}`, { signal });
    const text = await response.text();
    if (response.status === 401 || response.status === 403 || /authori[sz]ation|unauthori[sz]ed/i.test(text)) {
      throw new Error("ScreenshotAPI rejected the API key");
    }
  },
});

const fields = {
  file_type: string().optional(),
  width: number().optional(),
  height: number().optional(),
  full_page: boolean().optional(),
  thumbnail_width: number().optional(),
  retina: boolean().optional(),
  image_quality: number().optional(),
  omit_background: boolean().optional(),
  fresh: boolean().optional(),
  enable_caching: boolean().optional(),
  ttl: number().optional(),
  delay: number().optional(),
  wait_for_event: string().optional(),
  timeout: number().optional(),
  lazy_load: boolean().optional(),
  scroll_delay: number().optional(),
  selector: string().optional(),
  scroll_to_element: string().optional(),
  remove_selector: string().optional(),
  blur_selector: string().optional(),
  selector_to_click: string().optional(),
  click_recursion: number().optional(),
  adjust_top: number().optional(),
  clip: object({ x: number(), y: number(), width: number(), height: number() }).optional(),
  css: string().optional(),
  css_url: string().optional(),
  js: string().optional(),
  js_url: string().optional(),
  block_ads: boolean().optional(),
  block_tracking: boolean().optional(),
  no_cookie_banners: boolean().optional(),
  block_chat_widgets: boolean().optional(),
  block_js: boolean().optional(),
  block_stylesheets: boolean().optional(),
  block_images: boolean().optional(),
  block_media: boolean().optional(),
  block_font: boolean().optional(),
  block_xhr: boolean().optional(),
  block_fetch: boolean().optional(),
  block_web_socket: boolean().optional(),
  block_specific_requests: string().optional(),
  user_agent: string().optional(),
  accept_languages: string().optional(),
  headers: string().optional(),
  cookies: string().optional(),
  proxy: string().optional(),
  dark_mode: boolean().optional(),
  grayscale: number().optional(),
  enable_incognito: boolean().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
  timezone: string().optional(),
  template_id: string().optional(),
  extract_html: boolean().optional(),
  extract_text: boolean().optional(),
  extract_markdown: boolean().optional(),
  get_image_urls: boolean().optional(),
  pdf_options: object({
    format: string().optional(),
    page_range: string().optional(),
    landscape: boolean().optional(),
    media: string().optional(),
    print_background: boolean().optional(),
  }).optional(),
  scrolling_screenshot: boolean().optional(),
  scroll_speed: string().optional(),
  duration: number().optional(),
  scroll_back: boolean().optional(),
  start_immediately: boolean().optional(),
  video: boolean().optional(),
  result_file_name: string().optional(),
  byob: boolean().optional(),
  storage_service: string().optional(),
  bucket_name: string().optional(),
};

const render = object({
  url: string({ minLength: 1 }),
  custom_html: string().optional(),
  ...fields,
});

const bulkItem = object({ url: string({ minLength: 1 }), ...fields });

const optionsHelp =
  "Optional render options: file_type (png|jpg|webp|pdf|webm|mp4|gif), width (max 7680), height (max 4320), full_page, thumbnail_width, retina, image_quality (jpg only), omit_background (png only), fresh (default true; false with enable_caching serves the cache), enable_caching, ttl (seconds), delay (ms), wait_for_event (load|domcontentloaded|networkidle), timeout (ms), lazy_load, scroll_delay, selector, scroll_to_element, remove_selector, blur_selector, selector_to_click, click_recursion, adjust_top, clip {x,y,width,height}, css, css_url, js, js_url, block_* resource blocking, no_cookie_banners, user_agent, accept_languages, headers and cookies (semicolon-separated), proxy, dark_mode, grayscale (0-100), enable_incognito, latitude, longitude, timezone, template_id, extract_html, extract_text, extract_markdown, get_image_urls, pdf_options {format, page_range, landscape, media, print_background}, scrolling_screenshot with scroll_speed, duration, scroll_back, start_immediately, video, and byob with storage_service and bucket_name to store in your own bucket.";

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON bodies (such as the bulk result CSV) are returned as text.
  }
  if (!response.ok) {
    throw new Error(`ScreenshotAPI returned ${response.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }
  return parsed;
}

// Nested options use bracket notation in the query string: clip[x]=10, pdf_options[format]=A4.
function setParams(params: URLSearchParams, prefix: string, value: Record<string, unknown>) {
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof entry === "object") setParams(params, name, entry as Record<string, unknown>);
    else params.set(name, String(entry));
  }
}

function tools(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const bulkQuery = (extra: Record<string, string> = {}) => new URLSearchParams({ token, ...extra }).toString();
  return router({
    screenshots: router({
      render: mutation(
        {
          description: `Render a web page or custom HTML and return JSON with the stored file URL (image, PDF or scrolling video) and any extracted HTML, text, Markdown or image URLs. Consumes credits. Set custom_html to render raw HTML instead of fetching url (url is still required). ${optionsHelp}`,
          input: render,
        },
        async (_ctx, input) => {
          const { custom_html, ...rest } = input;
          if (custom_html !== undefined) {
            // Long HTML does not fit in a query string, so it goes in a JSON body.
            const params = new URLSearchParams({ token, output: "json" });
            return readBody(
              await fetcher(`${renderUrl}?${params}`, {
                method: "POST",
                signal,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token, output: "json", ...rest, custom_html }),
              }),
            );
          }
          const params = new URLSearchParams({ token, output: "json" });
          setParams(params, "", rest);
          return readBody(await fetcher(`${renderUrl}?${params}`, { signal }));
        },
      ),
    }),
    bulk: router({
      createJsonJob: mutation(
        {
          description: `Start a paid bulk job from up to 50 items. Each item needs a url (full https URL) and accepts the same render options as screenshots.render. Returns the response with the stored screenshot URLs or job id. ${optionsHelp}`,
          input: object({ urls: array(bulkItem) }),
        },
        async (_ctx, { urls }) =>
          readBody(
            await fetcher(`${bulkUrl}/json?${bulkQuery()}`, {
              method: "POST",
              signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ token, urls }),
            }),
          ),
      ),
      createCsvJob: mutation(
        {
          description:
            "Start a paid bulk job from CSV text. The first row is the header and must include a url column of full https URLs; other columns can be render options such as file_type, width, height, fresh. Returns the response containing the job uuid for bulk.status and bulk.download.",
          input: object({ csv: string({ minLength: 1 }), filename: string().optional() }),
        },
        async (_ctx, { csv, filename }) => {
          const form = new FormData();
          form.append("csv", new Blob([csv], { type: "text/csv" }), filename ?? "urls.csv");
          return readBody(await fetcher(`${bulkUrl}/csv?${bulkQuery()}`, { method: "POST", signal, body: form }));
        },
      ),
      status: query(
        {
          description: "Get a bulk job's progress (percent_complete, successful_urls, failed_urls) by the job uuid.",
          input: object({ uuid: string({ minLength: 1 }) }),
        },
        async (_ctx, { uuid }) => readBody(await fetcher(`${bulkUrl}/csv/status?${bulkQuery({ uuid })}`, { signal })),
      ),
      download: query(
        {
          description: "Download the result CSV of a finished bulk job (columns url, status, screenshot, error_message) as text.",
          input: object({ uuid: string({ minLength: 1 }) }),
        },
        async (_ctx, { uuid }) => readBody(await fetcher(`${bulkUrl}/csv/download?${bulkQuery({ uuid })}`, { signal })),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { screenshotapi: screenshotapi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.screenshotapi ?? [],
        (account) => withApprovals(tools(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Screenshot API",
        description:
          "Render web pages and custom HTML to PNG, JPG, WebP, PDF or scrolling video, extract HTML, text and Markdown, and run paid bulk capture jobs.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://onesimpleapi.com/api";

const onesimpleapi = defineProvider({
  name: "OneSimpleAPI",
  hosts: ["onesimpleapi.com"],
  auth: {
    apiKey: secrets({
      label: "API token (needs the Exchange Rate feature enabled)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // OneSimpleAPI has no account endpoint, and each endpoint is rejected when its feature is off on
  // the token. Exchange rate is the cheapest read-only call, so the token must have that feature
  // enabled to connect. An invalid token answers 302 to /login rather than 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${base}/exchange_rate?${new URLSearchParams({ token: account.fields.token, to_currency: "EUR", output: "json" })}`,
      { signal, redirect: "manual" },
    );
    if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400))
      throw new Error(
        "OneSimpleAPI rejected the token (redirected to login). Check the token, and that its Exchange Rate feature is enabled.",
      );
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | undefined>;

const search = (account: Account, params: Params) => {
  const out = new URLSearchParams({ token: account.fields.token });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out;
};

const tools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Params) => async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
    decodeJson(await fetch(`${base}/${path}?${search(account, { output: "json", ...params })}`, { signal }), json());
  // HTML bodies can be long, so they travel as a form-encoded POST body.
  const post = (path: string, params: Params) => async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
    decodeJson(
      await fetch(`${base}/${path}`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: search(account, { output: "json", ...params }),
      }),
      json(),
    );
  const run = (path: string, params: Params, useBody: boolean) =>
    async (ctx: { fetch: typeof globalThis.fetch }) => (useBody ? post(path, params)(ctx) : get(path, params)(ctx));

  return router({
    exchangeRate: query(
      {
        description:
          "Convert between currencies. to_currency is required (ISO code such as GBP); from_currency defaults to USD; fromValue defaults to 1. The JSON output also lists all rates relative to from_currency.",
        input: object({
          toCurrency: string({ minLength: 1 }),
          fromCurrency: string().optional(),
          fromValue: number().optional(),
        }),
      },
      async (ctx, i) =>
        get("exchange_rate", { to_currency: i.toCurrency, from_currency: i.fromCurrency, from_value: i.fromValue })(ctx),
    ),
    validateEmail: query(
      {
        description:
          "Validate an email address: format, domain, MX records, disposable and role-address checks, with typo suggestions.",
        input: object({ email: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("email", { email: i.email })(ctx),
    ),
    pageInfo: query(
      {
        description: "Fetch a web page's general info, meta tags, Open Graph and Twitter Card data.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("page_info", { url: i.url })(ctx),
    ),
    pageStatus: query(
      {
        description: "Check a web page's HTTP status, response headers and TLS certificate details.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("page_status", { url: i.url })(ctx),
    ),
    unshorten: query(
      {
        description: "Expand a shortened URL (bit.ly, t.co and similar) to its final destination.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("unshorten", { url: i.url })(ctx),
    ),
    imageInfo: query(
      {
        description: "Read an image's metadata from its URL: dimensions, format, camera make and model, EXIF and GPS.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("image_info", { url: i.url })(ctx),
    ),
    manageImage: query(
      {
        description:
          "Transform an image from a URL and host the result on OneSimpleAPI's CDN, returning its URL. Defaults to optimized webp. format: jpg, png or webp. size: 200x150, 200w or 150h. resizeMode: size-limit or forced. crop: 200x150 or a social size such as twitter_profile. rotate: auto, 90, 180 or 270. flip: v, h or vh. filters: comma list such as grayscale,sharpen:20. border: pixels. removeBackground and upscale use AI, cost an extra request and need a paid plan.",
        input: object({
          image: string({ minLength: 1 }),
          format: string().optional(),
          size: string().optional(),
          resizeMode: string().optional(),
          crop: string().optional(),
          rotate: string().optional(),
          flip: string().optional(),
          filters: string().optional(),
          border: number().optional(),
          borderColor: string().optional(),
          optimize: string().optional(),
          force: string().optional(),
          removeBackground: string().optional(),
          upscale: string().optional(),
        }),
      },
      async (ctx, i) =>
        get("image_manager", {
          image: i.image,
          format: i.format,
          size: i.size,
          resize_mode: i.resizeMode,
          crop: i.crop,
          rotate: i.rotate,
          flip: i.flip,
          filters: i.filters,
          border: i.border,
          border_color: i.borderColor,
          optimize: i.optimize,
          force: i.force,
          remove_background: i.removeBackground,
          upscale: i.upscale,
        })(ctx),
    ),
    screenshot: query(
      {
        description:
          "Take a screenshot of a URL, or of a string of HTML, and get its hosted image URL. screen is a preset name or WIDTHxHEIGHT; full=yes captures the whole page; background=false removes backgrounds; force=yes retakes a cached shot. Provide either url or html.",
        input: object({
          url: string().optional(),
          html: string().optional(),
          screen: string().optional(),
          full: string().optional(),
          background: string().optional(),
          force: string().optional(),
        }),
      },
      async (ctx, i) =>
        run(
          "screenshot",
          { url: i.url, html: i.html, screen: i.screen, full: i.full, background: i.background, force: i.force },
          i.html !== undefined,
        )(ctx),
    ),
    pdf: query(
      {
        description:
          "Render a URL, or a string of HTML, to a PDF and get its hosted URL. page is Letter, Legal, Tabloid, Ledger or A0-A6; background=yes keeps background colors and images; force=yes regenerates. Provide either url or html.",
        input: object({
          url: string().optional(),
          html: string().optional(),
          page: string().optional(),
          background: string().optional(),
          force: string().optional(),
        }),
      },
      async (ctx, i) =>
        run("pdf", { url: i.url, html: i.html, page: i.page, background: i.background, force: i.force }, i.html !== undefined)(
          ctx,
        ),
    ),
    qrCode: query(
      {
        description:
          "Generate a QR code for a message or URL and get its hosted image URL. size: small, medium or large. format: svg for vector (default png). color and background accept hex, rgb() or rgba() values.",
        input: object({
          message: string({ minLength: 1 }),
          size: string().optional(),
          format: string().optional(),
          color: string().optional(),
          background: string().optional(),
        }),
      },
      async (ctx, i) =>
        get("qr_code", { message: i.message, size: i.size, format: i.format, color: i.color, background: i.background })(ctx),
    ),
    color: query(
      {
        description:
          "Generate a deterministic color and color palette from a text (such as a name). hue is 0-360; saturation and lightness are 0-1.",
        input: object({
          text: string({ minLength: 1 }),
          hue: number().optional(),
          saturation: number().optional(),
          lightness: number().optional(),
        }),
      },
      async (ctx, i) =>
        get("color", { text: i.text, hue: i.hue, saturation: i.saturation, lightness: i.lightness })(ctx),
    ),
    readability: query(
      {
        description: "Score a text's readability and estimate its reading time and sentiment.",
        input: object({ text: string({ minLength: 1 }) }),
      },
      async (ctx, i) => get("readability", { text: i.text })(ctx),
    ),
    pppDiscount: query(
      {
        description:
          "Calculate a purchasing power parity discount. Needs the price, the origin country code (ISO alpha-2) where the price is set, and either destinationCountryCode or destinationUserIp (the country code wins if both are set). maxDiscount caps the discount in percent (default 30).",
        input: object({
          price: number(),
          originCountryCode: string({ minLength: 2 }),
          destinationCountryCode: string().optional(),
          destinationUserIp: string().optional(),
          maxDiscount: number().optional(),
        }),
      },
      async (ctx, i) =>
        get("discount_calculator", {
          price: i.price,
          origin_country_code: i.originCountryCode,
          destination_country_code: i.destinationCountryCode,
          destination_user_ip: i.destinationUserIp,
          max_discount: i.maxDiscount,
        })(ctx),
    ),
    spotifyProfile: query(
      {
        description:
          "Get a Spotify artist profile by its Spotify artist id: name, picture, followers and top songs. country is a 2-letter code for the top songs (default US).",
        input: object({ profile: string({ minLength: 1 }), country: string().optional() }),
      },
      async (ctx, i) => get("spotify_profile", { profile: i.profile, country: i.country })(ctx),
    ),
    cache: query(
      {
        description:
          "Fetch a URL (usually a slow JSON API) through OneSimpleAPI's cache. cacheDuration is in seconds; force=yes refreshes; httpMethod is get or post; headers forwards authentication headers. output is json (with expiration metadata) or content (the cached response itself); default json.",
        input: object({
          url: string({ minLength: 1 }),
          output: string().optional(),
          cacheDuration: number().optional(),
          httpMethod: string().optional(),
          force: string().optional(),
          headers: string().optional(),
        }),
      },
      async (ctx, i) =>
        get("cache", {
          url: i.url,
          output: i.output,
          cache_duration: i.cacheDuration,
          http_method: i.httpMethod,
          force: i.force,
          headers: i.headers,
        })(ctx),
    ),
    shortenUrl: mutation(
      {
        description:
          "Create a short URL. singleUse=true makes it work once; temporaryRedirect=true uses a temporary redirect so every visit is counted; forwardParams=true forwards extra query parameters; startDate and endDate limit when the link works.",
        input: object({
          url: string({ minLength: 1 }),
          singleUse: string().optional(),
          temporaryRedirect: string().optional(),
          forwardParams: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
        }),
        approval: always(),
      },
      async (ctx, i) =>
        get("shortener/new", {
          url: i.url,
          single_use: i.singleUse,
          temporary_redirect: i.temporaryRedirect,
          forward_params: i.forwardParams,
          start_date: i.startDate,
          end_date: i.endDate,
        })(ctx),
    ),
  });
};

export default defineApp({ user: { accounts: { onesimpleapi: onesimpleapi.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.onesimpleapi ?? [], (account) => tools(account, signal), { signal }), {
    title: "OneSimpleAPI",
    description:
      "Utility APIs: screenshots, PDFs, QR codes, URL shortening and expansion, page info and status, email validation, exchange rates, image tools, color palettes, readability and more.",
    icons,
  }),
}));

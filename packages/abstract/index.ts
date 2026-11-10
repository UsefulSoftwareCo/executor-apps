import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  type AppContext,
  type RouterDeclaration,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Abstract API is a family of separate products. Each product has its own host and its own
// API key, so an account holds one product's key and exposes only that product's tools.
const hosts = {
  "email-reputation": "emailreputation.abstractapi.com",
  "phone-intelligence": "phoneintelligence.abstractapi.com",
  "ip-intelligence": "ip-intelligence.abstractapi.com",
  "ip-geolocation": "ipgeolocation.abstractapi.com",
  "company-enrichment": "companyenrichment.abstractapi.com",
  "iban-validation": "ibanvalidation.abstractapi.com",
  "vat-validation": "vat.abstractapi.com",
  "exchange-rates": "exchange-rates.abstractapi.com",
  holidays: "holidays.abstractapi.com",
  timezones: "timezone.abstractapi.com",
  scrape: "scrape.abstractapi.com",
  images: "images.abstractapi.com",
} as const;

type Product = keyof typeof hosts;

// Products whose docs document "Authorization: Bearer <key>", which keeps the key out of URLs
// and logs. Every other product documents only the api_key query parameter or body field.
const bearerProducts: ReadonlySet<Product> = new Set<Product>([
  "email-reputation",
  "phone-intelligence",
  "ip-intelligence",
]);
const products = Object.keys(hosts) as Product[];
const isProduct = (value: string): value is Product => value in hosts;

const abstract = defineProvider({
  name: "Abstract",
  hosts: Object.values(hosts),
  auth: {
    apiKey: secrets({
      label: `API key for one Abstract product (product: ${products.join(", ")})`,
      fields: object({
        product: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Documented exception to the authoring guide: Abstract has no free account endpoint and
  // every call spends a plan credit, so health makes no network call and only checks that the
  // account names a product this app knows. A wrong key surfaces as a 401 on the first tool call.
  async health({ account }) {
    if (!isProduct(account.fields.product)) {
      throw new Error(`Unknown Abstract product "${account.fields.product}". Use one of: ${products.join(", ")}`);
    }
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(product: Product, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = `https://${hosts[product]}`;
  const bearer = bearerProducts.has(product);
  const buildUrl = (path: string, params: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    if (!bearer) url.searchParams.set("api_key", token);
    return url.toString();
  };
  const getInit = (): RequestInit => ({
    signal,
    ...(bearer ? { headers: { authorization: `Bearer ${token}` } } : {}),
  });
  return {
    // Errors carry only the status (decodeJson) or the response body, never the request URL.
    get: async (path: string, params: Params = {}) =>
      decodeJson(await fetcher(buildUrl(path, params), getInit()), json()),
    getText: async (path: string, params: Params = {}) => {
      const response = await fetcher(buildUrl(path, params), getInit());
      const text = await response.text();
      if (!response.ok) throw new Error(`Abstract returned ${response.status}: ${text.slice(0, 500)}`);
      return { status: response.status, body: text };
    },
    post: async (path: string, body: Params) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, api_key: token }),
        }),
        json(),
      ),
  };
}

type Client = ReturnType<typeof client>;

const reads: Record<Product, (c: Client) => RouterDeclaration<AppContext, AppContext>> = {
  "email-reputation": (c) =>
    router({
      check: query(
        {
          description:
            "Assess an email address: deliverability (format, MX, SMTP), quality score, disposable/free/role flags, domain age and breach data.",
          input: object({ email: string({ minLength: 1 }) }),
        },
        async (_ctx, { email }) => c.get("/v1/", { email }),
      ),
    }),
  "phone-intelligence": (c) =>
    router({
      check: query(
        {
          description:
            "Validate a phone number and get carrier, line type, location, risk and breach data. Pass country (ISO alpha-2) when the number is not in international format.",
          input: object({ phone: string({ minLength: 1 }), country: string().optional() }),
        },
        async (_ctx, { phone, country }) => c.get("/v1/", { phone, country }),
      ),
    }),
  "ip-intelligence": (c) =>
    router({
      lookup: query(
        {
          description:
            "Geolocation, timezone, connection and security (VPN, proxy, Tor, hosting, abuse) data for an IP address. Omit ipAddress to use the caller's IP. fields limits the response to a comma-separated list.",
          input: object({ ipAddress: string().optional(), fields: string().optional() }),
        },
        async (_ctx, { ipAddress, fields }) => c.get("/v1/", { ip_address: ipAddress, fields }),
      ),
    }),
  "ip-geolocation": (c) =>
    router({
      lookup: query(
        {
          description:
            "Geolocation, timezone, currency, flag and connection data for an IP address. Omit ipAddress to use the caller's IP. fields limits the response to a comma-separated list of top-level keys.",
          input: object({ ipAddress: string().optional(), fields: string().optional() }),
        },
        async (_ctx, { ipAddress, fields }) => c.get("/v1/", { ip_address: ipAddress, fields }),
      ),
    }),
  "company-enrichment": (c) =>
    router({
      lookup: query(
        {
          description:
            "Company details for a domain: name, logo, headcount, location, industry, founding year. fields limits the response to a comma-separated list.",
          input: object({ domain: string({ minLength: 1 }), fields: string().optional() }),
        },
        async (_ctx, { domain, fields }) => c.get("/v2", { domain, fields }),
      ),
    }),
  "iban-validation": (c) =>
    router({
      validate: query(
        {
          description: "Check whether an IBAN is valid and return its country, bank and format details.",
          input: object({ iban: string({ minLength: 1 }) }),
        },
        async (_ctx, { iban }) => c.get("/v1/", { iban }),
      ),
    }),
  "vat-validation": (c) =>
    router({
      validate: query(
        {
          description: "Check whether a VAT number is valid and return the registered company details.",
          input: object({ vatNumber: string({ minLength: 1 }) }),
        },
        async (_ctx, { vatNumber }) => c.get("/v1/validate", { vat_number: vatNumber }),
      ),
      calculate: query(
        {
          description:
            "VAT-compliant prices for an amount in a country. Set isVatIncl when the amount already includes VAT; vatCategory selects a reduced-rate category.",
          input: object({
            amount: string({ minLength: 1 }),
            countryCode: string({ minLength: 2 }),
            isVatIncl: boolean().optional(),
            vatCategory: string().optional(),
          }),
        },
        async (_ctx, { amount, countryCode, isVatIncl, vatCategory }) =>
          c.get("/v1/calculate", {
            amount,
            country_code: countryCode,
            is_vat_incl: isVatIncl,
            vat_category: vatCategory,
          }),
      ),
      categories: query(
        {
          description: "Latest VAT rates and categories for a country (ISO alpha-2 code).",
          input: object({ countryCode: string({ minLength: 2 }) }),
        },
        async (_ctx, { countryCode }) => c.get("/v1/categories", { country_code: countryCode }),
      ),
    }),
  "exchange-rates": (c) =>
    router({
      live: query(
        {
          description: "Latest exchange rates from a base currency. target is an optional comma-separated list of currency codes.",
          input: object({ base: string({ minLength: 3 }), target: string().optional() }),
        },
        async (_ctx, { base, target }) => c.get("/v1/live", { base, target }),
      ),
      convert: query(
        {
          description:
            "Convert an amount from a base currency to a target currency, now or on a date (YYYY-MM-DD).",
          input: object({
            base: string({ minLength: 3 }),
            target: string({ minLength: 3 }),
            date: string().optional(),
            baseAmount: number().optional(),
          }),
        },
        async (_ctx, { base, target, date, baseAmount }) =>
          c.get("/v1/convert", { base, target, date, base_amount: baseAmount }),
      ),
      historical: query(
        {
          description: "Exchange rates from a base currency on a date (YYYY-MM-DD). Beta endpoint.",
          input: object({ base: string({ minLength: 3 }), date: string({ minLength: 8 }), target: string().optional() }),
        },
        async (_ctx, { base, date, target }) => c.get("/v1/historical", { base, date, target }),
      ),
    }),
  holidays: (c) =>
    router({
      list: query(
        {
          description:
            "Public holidays for a country (ISO alpha-2 code) on a year, month or day. Free plans require year, month and day.",
          input: object({
            country: string({ minLength: 2 }),
            year: string().optional(),
            month: string().optional(),
            day: string().optional(),
          }),
        },
        async (_ctx, { country, year, month, day }) => c.get("/v1/", { country, year, month, day }),
      ),
    }),
  timezones: (c) =>
    router({
      currentTime: query(
        {
          description: "Current time, date and timezone for a location name, latitude,longitude pair or IP address.",
          input: object({ location: string({ minLength: 1 }) }),
        },
        async (_ctx, { location }) => c.get("/v1/current_time", { location }),
      ),
      convertTime: query(
        {
          description:
            "Convert a time from one location to another. baseDatetime (YYYY-MM-DD HH:MM:SS) defaults to now.",
          input: object({
            baseLocation: string({ minLength: 1 }),
            targetLocation: string({ minLength: 1 }),
            baseDatetime: string().optional(),
          }),
        },
        async (_ctx, { baseLocation, targetLocation, baseDatetime }) =>
          c.get("/v1/convert_time", {
            base_location: baseLocation,
            target_location: targetLocation,
            base_datetime: baseDatetime,
          }),
      ),
    }),
  scrape: (c) =>
    router({
      page: query(
        {
          description:
            "Fetch a URL and return its content as text. renderJs runs a headless browser; useProxy routes through a proxy. Consumes credits.",
          input: object({
            url: string({ minLength: 1 }),
            renderJs: boolean().optional(),
            useProxy: boolean().optional(),
          }),
        },
        async (_ctx, { url, renderJs, useProxy }) =>
          c.getText("/v1/", { url, render_js: renderJs, use_proxy: useProxy }),
      ),
    }),
  images: (c) =>
    router({
      process: mutation(
        {
          description:
            "Compress, convert or resize an image from a URL. Returns sizes and a link to the processed image. resize is an object such as { width, height, strategy } where strategy is exact, portrait, landscape, auto, fit, crop or fill.",
          input: object({
            url: string({ minLength: 1 }),
            lossy: boolean().optional(),
            quality: number().optional(),
            resize: record(json()).optional(),
          }),
          approval: always(),
        },
        async (_ctx, input) => c.post("/v1/url/", input),
      ),
    }),
};

export default defineApp(
  { user: { accounts: { abstract: abstract.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.abstract ?? [],
        (account) => {
          const product = account.fields.product;
          if (!isProduct(product)) throw new Error(`Unknown Abstract product "${product}". Use one of: ${products.join(", ")}`);
          return reads[product](client(product, account.fields.token, fetch, signal));
        },
        { signal },
      ),
      {
        title: "Abstract",
        description:
          "Abstract API products: email, phone, IP intelligence and IP geolocation, company enrichment, IBAN and VAT validation, exchange rates, holidays, timezones, web scraping and image processing. Each product needs its own API key; add one account per product.",
        icons,
      },
    ),
  }),
);

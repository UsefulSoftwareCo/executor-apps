import {
  accountRouter,
  array,
  boolean,
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

const base = "https://linktw.in/api";

type Fetch = typeof fetch;
const linktwin = defineProvider({
  name: "LinkTwin",
  hosts: ["linktw.in"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /api/account is read-only; the vendor's own client (@linktwin/client) uses it to check the key.
  async health({ account, fetch, signal }) {
    await requestJson(fetch, "GET", "/account", account.fields.token, signal);
  },
});

type Query = Record<string, string | number | undefined>;
type Call = (method: string, path: string, options?: { query?: Query; body?: Record<string, unknown> }) => Promise<unknown>;

class LinkTwinError extends Error {}

// LinkTwin signals failure with an `error` field in the body, even on HTTP 200. 0, "0", null and absent mean success.
async function requestJson(
  fetcher: Fetch,
  method: string,
  path: string,
  token: string,
  signal: AbortSignal | undefined,
  options: { query?: Query; body?: Record<string, unknown> } = {},
): Promise<unknown> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.size > 0 ? `?${params}` : "";
  const response = await fetcher(`${base}${path}${qs}`, {
    method,
    signal,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const raw = await response.text();
  let parsed: unknown;
  try {
    parsed = raw === "" ? {} : JSON.parse(raw);
  } catch {
    if (response.status === 429) throw new LinkTwinError("LinkTwin API rate limit exceeded (120 requests per minute). Try again shortly.");
    throw new LinkTwinError(`Expected JSON from ${method} ${path} but got HTTP ${response.status}`);
  }
  const flag = typeof parsed === "object" && parsed !== null ? (parsed as { error?: unknown }).error : undefined;
  if (response.status === 429 || flag === 429 || flag === "429") {
    throw new LinkTwinError("LinkTwin API rate limit exceeded (120 requests per minute). Try again shortly.");
  }
  const ok = flag === undefined || flag === null || flag === 0 || flag === "0";
  if (!ok || !response.ok) {
    const message = (parsed as { message?: unknown } | null)?.message;
    throw new LinkTwinError(
      typeof message === "string" && message !== "" ? message : `${method} ${path} failed (HTTP ${response.status}, error=${String(flag)})`,
    );
  }
  return parsed;
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return (method, path, options) => requestJson(fetcher, method, path, token, signal, options);
}

// Drops undefined entries so omitted fields stay unchanged on update.
function defined<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

const id = (name: string) => encodeURIComponent(name);
const page = { limit: number().optional(), page: number().optional() };
const ids = array(number());
const items = array(record(json()));

const linkFields = {
  url: string(),
  custom: string().optional(),
  password: string().optional(),
  domain: string().optional(),
  expiry: string().optional(),
  clicklimit: number().optional(),
  expirationredirect: string().optional(),
  note: string().optional(),
  display_title: string().optional(),
  geotarget: items.optional(),
  devicetarget: items.optional(),
  languagetarget: items.optional(),
  abtesting: items.optional(),
  parameters: items.optional(),
  metatitle: string().optional(),
  metadescription: string().optional(),
  metaimage: string().optional(),
  pixels: array(json()).optional(),
  collections: array(json()).optional(),
  bridge_override: number().optional(),
  bridge_page: number().optional(),
  bridge_auto_redirect: number().optional(),
  bridge_redirect_delay: number().optional(),
  escape_inapp_browser: number().optional(),
};

// Clearable scalars accept null (clears the field) as well as a value; arrays accept [] to empty.
const clearable = json().optional();
const linkUpdateFields = {
  ...linkFields,
  url: string().optional(),
  password: clearable,
  expiry: clearable,
  clicklimit: clearable,
  expirationredirect: clearable,
  note: clearable,
  display_title: clearable,
  metatitle: clearable,
  metadescription: clearable,
  metaimage: clearable,
};

const targeting =
  "geotarget: [{location: full country name, link, state?}]; devicetarget: [{device, link}]; languagetarget: [{language, link}]; abtesting: [{link, percent?}]; parameters: [{name, value}] (UTM tags); pixels and collections: arrays of all IDs or all names.";

function build(call: Call) {
  return router({
    links: router(
      {
        list: query(
          {
            description:
              "List links. order is one of date, date_desc, date_asc, clicks_desc, clicks_asc, name_asc, name_desc. date_from and date_to accept Y-m-d or ISO 8601. collections is a JSON array string of IDs or names, for example [1,2]. timezone overrides the account timezone.",
            input: object({
              ...page,
              order: string().optional(),
              search: string().optional(),
              date_from: string().optional(),
              date_to: string().optional(),
              collections: string().optional(),
              timezone: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/urls", { query: input }),
        ),
        get: query(
          {
            description: "Get one link with its targeting, pixels, collections and click statistics. link is the numeric link ID or the full short URL.",
            input: object({ link: string({ minLength: 1 }), timezone: string().optional() }),
          },
          async (_ctx, { link, timezone }) => call("GET", `/url/${id(link)}`, { query: { timezone } }),
        ),
        create: mutation(
          {
            description: `Create a short or deep link. Only url is required. ${targeting} expiry format is YYYY-MM-DD HH:MM:SS. bridge_* fields apply only when bridge_override is 1.`,
            input: object(linkFields),
          },
          async (_ctx, input) => call("POST", "/url/add", { body: defined(input) }),
        ),
        update: mutation(
          {
            description: `Update a link by numeric ID or full short URL. Only send fields to change. Send null for password, expiry, clicklimit, expirationredirect, note, display_title, metatitle, metadescription or metaimage to clear it. Array fields replace all existing values; [] clears them. ${targeting} Image upload is not supported here: metaimage takes a public .jpg or .png URL.`,
            input: object({ link: string({ minLength: 1 }), ...linkUpdateFields }),
          },
          async (_ctx, { link, ...rest }) => call("PUT", `/url/update/${id(link)}`, { body: defined(rest) }),
        ),
        delete: mutation(
          {
            description: "Delete a link by numeric ID or full short URL.",
            input: object({ link: string({ minLength: 1 }) }),
          },
          async (_ctx, { link }) => call("DELETE", `/url/delete/${id(link)}`),
        ),
        bulkDelete: mutation(
          { description: "Delete several links by numeric ID in one request.", input: object({ ids }) },
          async (_ctx, { ids }) => call("POST", "/urls/delete", { body: { ids } }),
        ),
      },
      { title: "Links", description: "Short links and deep links with targeting, A/B tests and UTM parameters." },
    ),
    domains: router(
      {
        list: query(
          { description: "List standard and branded domains. isStandard distinguishes platform domains.", input: object(page) },
          async (_ctx, input) => call("GET", "/domains", { query: input }),
        ),
        create: mutation(
          {
            description: "Add a branded domain (include http or https). The domain must already point at LinkTwin's servers.",
            input: object({ domain: string({ minLength: 1 }), redirectroot: string().optional(), redirect404: string().optional() }),
          },
          async (_ctx, input) => call("POST", "/domain/add", { body: defined(input) }),
        ),
        update: mutation(
          {
            description: "Update a branded domain's root redirect and custom 404 redirect.",
            input: object({ id: number(), redirectroot: string().optional(), redirect404: string().optional() }),
          },
          async (_ctx, { id: domainId, ...rest }) => call("PUT", `/domain/${domainId}/update`, { body: defined(rest) }),
        ),
        delete: mutation(
          { description: "Delete a branded domain.", input: object({ id: number() }) },
          async (_ctx, { id: domainId }) => call("DELETE", `/domain/${domainId}/delete`),
        ),
      },
      { title: "Domains", description: "Branded domains for short links." },
    ),
    pixels: router(
      {
        list: query(
          { description: "List tracking pixels.", input: object(page) },
          async (_ctx, input) => call("GET", "/pixels", { query: input }),
        ),
        get: query(
          { description: "Get one pixel with a paginated list of the links it is assigned to.", input: object({ id: number(), ...page }) },
          async (_ctx, { id: pixelId, ...rest }) => call("GET", `/pixel/${pixelId}`, { query: rest }),
        ),
        create: mutation(
          {
            description:
              "Create a tracking pixel. type is one of gtmpixel, gapixel, fbpixel, adwordspixel, linkedinpixel, twitterpixel, adrollpixel, quorapixel, pinterest, bing, snapchat, reddit, tiktok. event applies to Facebook pixels only (Lead, CompleteRegistration, ViewContent, Search, AddToCart, AddToWishlist, InitiateCheckout, AddPaymentInfo, Purchase, Subscribe, StartTrial, Contact, Schedule, SubmitApplication, Donate).",
            input: object({ type: string({ minLength: 1 }), name: string({ minLength: 1 }), tag: string({ minLength: 1 }), event: string().optional() }),
          },
          async (_ctx, input) => call("POST", "/pixel/add", { body: defined(input) }),
        ),
        update: mutation(
          {
            description: "Update a pixel. tag is required; name and event (Facebook only, PageView for none) are optional.",
            input: object({ id: number(), tag: string({ minLength: 1 }), name: string().optional(), event: string().optional() }),
          },
          async (_ctx, { id: pixelId, ...rest }) => call("PUT", `/pixel/${pixelId}/update`, { body: defined(rest) }),
        ),
        delete: mutation(
          { description: "Delete a pixel.", input: object({ id: number() }) },
          async (_ctx, { id: pixelId }) => call("DELETE", `/pixel/${pixelId}/delete`),
        ),
        assignLinks: mutation(
          {
            description: "Add the pixel to and/or remove it from several links by link ID.",
            input: object({ id: number(), add: ids.optional(), remove: ids.optional() }),
          },
          async (_ctx, { id: pixelId, ...rest }) => call("POST", `/pixel/${pixelId}/links`, { body: defined(rest) }),
        ),
      },
      { title: "Pixels", description: "Retargeting and analytics pixels attached to links." },
    ),
    qrCodes: router(
      {
        list: query(
          { description: "List QR codes.", input: object(page) },
          async (_ctx, input) => call("GET", "/qr", { query: input }),
        ),
        get: query(
          { description: "Get one QR code with scan statistics.", input: object({ id: number() }) },
          async (_ctx, { id: qrId }) => call("GET", `/qr/${qrId}`),
        ),
        create: mutation(
          {
            description:
              "Create a QR code. type is one of text, vcard, link, email, phone, sms, wifi. data is a string or an object depending on type. background and foreground are colors such as rgb(255,255,255). logo is a png or jpg path.",
            input: object({
              type: string({ minLength: 1 }),
              data: json(),
              background: string().optional(),
              foreground: string().optional(),
              logo: string().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/qr/add", { body: defined(input) }),
        ),
        update: mutation(
          {
            description: "Update a QR code. data is required (string or object depending on the QR type).",
            input: object({ id: number(), data: json(), background: string().optional(), foreground: string().optional(), logo: string().optional() }),
          },
          async (_ctx, { id: qrId, ...rest }) => call("PUT", `/qr/${qrId}/update`, { body: defined(rest) }),
        ),
        delete: mutation(
          { description: "Delete a QR code.", input: object({ id: number() }) },
          async (_ctx, { id: qrId }) => call("DELETE", `/qr/${qrId}/delete`),
        ),
      },
      { title: "QR codes", description: "Branded QR codes with scan statistics." },
    ),
    statistics: router(
      {
        dashboard: query(
          {
            description: "Dashboard statistics. period is one of 1d, 1w, 1m, 1y, max (default 1m). timezone such as America/New_York.",
            input: object({ period: string().optional(), timezone: string().optional() }),
          },
          async (_ctx, input) => call("GET", "/statistics/dashboard", { query: input }),
        ),
        detailed: query(
          {
            description:
              "Detailed click statistics. date_range is one of 1d, 7d, 30d, max, custom (default 30d); start_date and end_date are required when custom. Filter with collection_id or collections (JSON array string of IDs or names).",
            input: object({
              date_range: string().optional(),
              start_date: string().optional(),
              end_date: string().optional(),
              collection_id: number().optional(),
              collections: string().optional(),
              timezone: string().optional(),
            }),
          },
          async (_ctx, input) => call("GET", "/statistics/detailed", { query: input }),
        ),
        link: query(
          {
            description: "Statistics for one link by numeric ID or full short URL.",
            input: object({ link: string({ minLength: 1 }), timezone: string().optional() }),
          },
          async (_ctx, { link, timezone }) => call("GET", `/statistics/link/${id(link)}`, { query: { timezone } }),
        ),
        dayTrend: query(
          {
            description: "Clicks by day of week trend. Accepts the same optional filters the LinkTwin API supports (period, timezone).",
            input: object({ period: string().optional(), timezone: string().optional() }),
          },
          async (_ctx, input) => call("GET", "/statistics/daytrend", { query: input }),
        ),
      },
      { title: "Statistics", description: "Click and scan analytics." },
    ),
    account: router(
      {
        get: query(
          { description: "Get the account: plan, limits, usage, settings and available workspaces.", input: object({}) },
          async () => call("GET", "/account"),
        ),
        updateSettings: mutation(
          {
            description: "Update account settings. default_domain must be one of the account's domains; timezone is an identifier such as Europe/London.",
            input: object({ default_domain: string().optional(), timezone: string().optional() }),
          },
          async (_ctx, input) => call("PUT", "/account/settings", { body: defined(input) }),
        ),
        switchWorkspace: mutation(
          {
            description: "Switch the active workspace. workspace_token comes from available_workspaces in the account response.",
            input: object({ workspace_token: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("PUT", "/account/workspace", { body: input }),
        ),
      },
      { title: "Account", description: "Account details, settings and workspaces." },
    ),
    collections: router(
      {
        list: query(
          { description: "List collections.", input: object(page) },
          async (_ctx, input) => call("GET", "/collections", { query: input }),
        ),
        get: query(
          { description: "List the links, bio pages and QR codes in a collection.", input: object({ id: number(), ...page }) },
          async (_ctx, { id: collectionId, ...rest }) => call("GET", `/collection/${collectionId}`, { query: rest }),
        ),
        create: mutation(
          {
            description: "Create a collection. color is a HEX value; slug is the rotator slug.",
            input: object({
              name: string({ minLength: 1 }),
              slug: string().optional(),
              description: string().optional(),
              color: string().optional(),
              public: boolean().optional(),
              starred: boolean().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/collection/add", { body: defined(input) }),
        ),
        update: mutation(
          {
            description: "Update a collection. Only send fields to change.",
            input: object({
              id: number(),
              name: string().optional(),
              slug: string().optional(),
              description: string().optional(),
              color: string().optional(),
              public: boolean().optional(),
              starred: boolean().optional(),
            }),
          },
          async (_ctx, { id: collectionId, ...rest }) => call("PUT", `/collection/${collectionId}/update`, { body: defined(rest) }),
        ),
        delete: mutation(
          { description: "Delete a collection. Its items are unassigned, not deleted.", input: object({ id: number() }) },
          async (_ctx, { id: collectionId }) => call("DELETE", `/collection/${collectionId}/delete`),
        ),
        assignLink: mutation(
          { description: "Add one link to a collection.", input: object({ collectionId: number(), linkId: number() }) },
          async (_ctx, { collectionId, linkId }) => call("POST", `/collection/${collectionId}/assign/${linkId}`),
        ),
        assignLinks: mutation(
          {
            description: "Add and/or remove several links from a collection by link ID.",
            input: object({ id: number(), add: ids.optional(), remove: ids.optional() }),
          },
          async (_ctx, { id: collectionId, ...rest }) => call("POST", `/collection/${collectionId}/links`, { body: defined(rest) }),
        ),
      },
      { title: "Collections", description: "Group links, bio pages and QR codes; optionally as a public rotator." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { linktwin: linktwin.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.linktwin ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LinkTwin",
        description: "Create deep links and short links, and manage branded domains, pixels, QR codes and collections.",
        icons,
      },
    ),
  }),
);

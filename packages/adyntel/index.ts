import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.adyntel.com";

const adyntel = defineProvider({
  name: "Adyntel",
  hosts: ["api.adyntel.com"],
  auth: {
    apiKey: secrets({
      label: "API key and account email",
      fields: object({ token: string({ minLength: 1 }), email: string({ minLength: 1 }) }),
    }),
  },
  // Adyntel has no free account endpoint. /google_shopping_status only looks up a job id,
  // so a bogus id checks the credentials without scraping or charging. The response body
  // is not decoded; only auth failures (401/403), rate limiting and server errors fail health.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/google_shopping_status`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: account.fields.token, email: account.fields.email, id: "health-check" }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Adyntel rejected the API key or email (${response.status})`);
    }
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`Adyntel is unavailable (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;
type Body = Record<string, unknown>;

// Adyntel authenticates by putting api_key and email in the JSON body of every POST.
function client(token: string, email: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Body = {}) => {
    const body: Body = {};
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null) body[key] = value;
    // Set last so the account's credentials always win over model-supplied params.
    body.api_key = token;
    body.email = email;
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // 204 means no content: no ads found, or the site is unreachable, has no Facebook URL, or the page is not public.
    if (response.status === 204) {
      return { results: [], reason: "Adyntel returned 204: no ads found, or the site is unreachable, has no Facebook URL, or the page is not public." };
    }
    return decodeJson(response, json());
  };
}

const extra = record(json()).optional();

function build(call: ReturnType<typeof client>) {
  // Every endpoint is a POST that only reads data, but each call except googleShoppingStatus spends Adyntel credits.
  const search = (path: string, description: string, input: ReturnType<typeof object>) =>
    query({ description, input }, async (_ctx, args) => {
      const { params, ...rest } = args as Body & { params?: Body };
      return call(path, { ...(params ?? {}), ...rest });
    });

  return router({
    metaAds: search(
      "/facebook",
      "Facebook and Instagram ads a company runs. Give facebook_url (https://...) or company_domain (company.com, no https or www). Optional (put these in params): country_code, media_type (image, meme, image_and_meme, video), active_status (inactive or all; default active only), language, ad_type, continuation_token for the next page. webhook_url, all_ads and country arrays start paid background jobs. 1 credit per page.",
      object({
        facebook_url: string().optional(),
        company_domain: string().optional(),
        params: extra,
      }),
    ),
    metaAdSearch: search(
      "/facebook_ad_search",
      "Search the Meta Ad Library by keyword. Optional country_code limits results to one country.",
      object({ keyword: string({ minLength: 1 }), country_code: string().optional() }),
    ),
    googleAds: search(
      "/google",
      "Google ads a company runs, from the Google Ads Transparency Center. company_domain is required. Optional (in params): media_type (text, image, video, all), country_code (one ISO code, resend it with every continuation_token), continuation_token, extract-text (costs one extra credit), all_ads (starts a paid background scrape).",
      object({ company_domain: string({ minLength: 1 }), params: extra }),
    ),
    googleShoppingAds: search(
      "/google_shopping",
      "Start a Google Shopping ads scrape (spends credits) for a company_domain. Returns an id; poll googleShoppingStatus with it.",
      object({ company_domain: string({ minLength: 1 }) }),
    ),
    googleShoppingStatus: search(
      "/google_shopping_status",
      "Free (no credits). Status and results of a Google Shopping ads scrape started with googleShoppingAds, by the id it returned.",
      object({ id: string({ minLength: 1 }) }),
    ),
    linkedinAds: search(
      "/linkedin",
      "LinkedIn ads a company runs. Give company_domain or linkedin_page_id. Optional (in params): date_filter (last30d, month, year, lastyear, or {startdate, enddate}; not with impression_data), continuation_token, impression_data (EU transparency data, 2 credits).",
      object({
        company_domain: string().optional(),
        linkedin_page_id: string().optional(),
        params: extra,
      }),
    ),
    linkedinKeywordSearch: search(
      "/linkedin-keyword-search",
      "Search the LinkedIn Ad Library by keyword. Optional: country (2-letter code), dateOption (current-month, current-year, last-30-days, last-year, custom-date-range), startDate and endDate (YYYY-MM-DD), continuation_token.",
      object({
        keyword: string({ minLength: 1 }),
        country: string().optional(),
        dateOption: string().optional(),
        startDate: string().optional(),
        endDate: string().optional(),
        continuation_token: string().optional(),
      }),
    ),
    tiktokAds: search(
      "/tiktok",
      "TikTok ads for a brand's company_domain (the brand's own domain, not tiktok.com). Optional (in params): influencer_ads (also returns influencers with sample ads, 2 credits), continuation_tokens ({brand_ads, influencers}).",
      object({ company_domain: string({ minLength: 1 }), params: extra }),
    ),
    tiktokSearch: search(
      "/tiktok_search",
      "Search TikTok ads by keyword. Optional country_code limits results to one country.",
      object({ keyword: string({ minLength: 1 }), country_code: string().optional() }),
    ),
    tiktokAdDetails: search(
      "/tiktok_ad_details",
      "Details of one TikTok ad by its ad id (as returned by tiktokSearch).",
      object({ id: string({ minLength: 1 }) }),
    ),
    domainKeywords: search(
      "/domain-keywords",
      "Paid versus organic keyword data for a domain (no www or https), with ranking position breakdowns.",
      object({ company_domain: string({ minLength: 1 }) }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { adyntel: adyntel.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.adyntel ?? [], (account) => build(client(account.fields.token, account.fields.email, fetch, signal)), {
        signal,
      }),
      {
        title: "Adyntel",
        description:
          "Competitor ad intelligence: ads from the Meta, Google, Google Shopping, LinkedIn and TikTok ad libraries by company domain or keyword, plus paid versus organic keywords for a domain. Each call spends Adyntel credits.",
        icons,
      },
    ),
  }),
);

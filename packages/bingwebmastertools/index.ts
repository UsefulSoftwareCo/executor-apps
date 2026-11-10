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
  oauth2,
  object,
  query,
  router,
  type Schema,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys are sent to ssl.bing.com in the apikey query parameter; OAuth bearer tokens go to www.bing.com.
const apiKeyBase = "https://ssl.bing.com/webmaster/api.svc/json";
const oauthBase = "https://www.bing.com/webmaster/api.svc/json";

const bing = defineProvider({
  name: "Bing Webmaster Tools",
  hosts: ["ssl.bing.com", "www.bing.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Bing Webmaster has no client registration endpoint: the user registers an OAuth client under
    // Settings > API Access in Bing Webmaster Tools and supplies its client ID and secret.
    oauth: oauth2({
      authorizationUrl: "https://www.bing.com/webmasters/oauth/authorize",
      tokenUrl: "https://www.bing.com/webmasters/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["webmaster.manage"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${endpoint(account as Account, "GetUserSites")}`, {
      signal,
      headers: headers(account as Account),
    });
    await decodeJson(response, object({ d: array(object({})) }));
  },
});

function endpoint(account: Account, name: string, extra?: URLSearchParams): string {
  const search = extra ?? new URLSearchParams();
  if (account.method === "apiKey") search.set("apikey", account.fields.token);
  const base = account.method === "apiKey" ? apiKeyBase : oauthBase;
  const qs = search.toString();
  return `${base}/${name}${qs ? `?${qs}` : ""}`;
}

function headers(account: Account): Record<string, string> {
  return account.method === "oauth"
    ? { Accept: "application/json", Authorization: `Bearer ${account.fields.access_token}` }
    : { Accept: "application/json" };
}

type Kind = "query" | "mutation";
type FieldType = "string" | "number" | "boolean" | "array" | "json";
type Field = [name: string, type: FieldType, required: boolean, description: string];
type Row = [name: string, operation: string, method: "GET" | "POST", kind: Kind, description: string, fields: Field[]];

const site: Field = ["siteUrl", "string", true, "Site URL exactly as added in Bing Webmaster Tools, for example https://example.com"];
const date = (name: string): Field => [name, "string", true, `${name} as an ISO 8601 date, for example 2026-01-31`];

const rows: Row[] = [
  // Sites
  ["getUserSites", "GetUserSites", "GET", "query", "List the sites the user has added, with verification status and verification codes.", []],
  ["addSite", "AddSite", "POST", "mutation", "Add a site to the user's account. It must then be verified.", [site]],
  ["verifySite", "VerifySite", "POST", "mutation", "Ask Bing to verify a site that was added to the account. Returns true when verified.", [site]],
  ["removeSite", "RemoveSite", "POST", "mutation", "Remove a site from the user's account.", [site]],
  ["getSiteRoles", "GetSiteRoles", "GET", "query", "List the users that have access to a site and their roles.", [site, ["includeAllSubdomains", "boolean", true, "Include roles on subdomains"]]],
  ["addSiteRoles", "AddSiteRoles", "POST", "mutation", "Delegate access to a site to another user.", [
    site,
    ["delegatedUrl", "string", true, "Site URL the access is delegated on"],
    ["userEmail", "string", true, "Email of the user receiving access"],
    ["authenticationCode", "string", true, "Authentication code of the site"],
    ["isAdministrator", "boolean", true, "Grant administrator role"],
    ["isReadOnly", "boolean", true, "Grant read-only role"],
  ]],
  ["removeSiteRole", "RemoveSiteRole", "POST", "mutation", "Remove a user's access to a site.", [site, ["siteRoles", "json", true, "SiteRoles object as returned by getSiteRoles for the user to remove"]]],
  // Traffic
  ["getRankAndTrafficStats", "GetRankAndTrafficStats", "GET", "query", "Daily impressions and clicks for a site (data is updated weekly).", [site]],
  ["getQueryStats", "GetQueryStats", "GET", "query", "Traffic statistics for the site's top queries: impressions, clicks, average positions.", [site]],
  ["getPageStats", "GetPageStats", "GET", "query", "Traffic statistics for the site's top pages.", [site]],
  ["getQueryPageStats", "GetQueryPageStats", "GET", "query", "Traffic statistics of pages that received traffic for one query.", [site, ["query", "string", true, "Search query"]]],
  ["getPageQueryStats", "GetPageQueryStats", "GET", "query", "Traffic statistics of queries that led to one page.", [site, ["page", "string", true, "Page URL"]]],
  ["getQueryPageDetailStats", "GetQueryPageDetailStats", "GET", "query", "Detailed daily statistics for one query and page pair.", [site, ["query", "string", true, "Search query"], ["page", "string", true, "Page URL"]]],
  ["getQueryTrafficStats", "GetQueryTrafficStats", "GET", "query", "Daily traffic statistics for one query.", [site, ["query", "string", true, "Search query"]]],
  // Keywords
  ["getKeyword", "GetKeyword", "GET", "query", "Impressions of a keyword over a period in a country and language.", [
    ["q", "string", true, "Keyword"],
    ["country", "string", true, "Country code, for example us"],
    ["language", "string", true, "Language tag, for example en-US"],
    date("startDate"),
    date("endDate"),
  ]],
  ["getKeywordStats", "GetKeywordStats", "GET", "query", "Historical statistics for a keyword in a country and language.", [
    ["q", "string", true, "Keyword"],
    ["country", "string", true, "Country code, for example us"],
    ["language", "string", true, "Language tag, for example en-US"],
  ]],
  ["getRelatedKeywords", "GetRelatedKeywords", "GET", "query", "Keywords related to a keyword, with impressions over a period.", [
    ["q", "string", true, "Keyword"],
    ["country", "string", true, "Country code, for example us"],
    ["language", "string", true, "Language tag, for example en-US"],
    date("startDate"),
    date("endDate"),
  ]],
  // Index, crawl and links
  ["getUrlInfo", "GetUrlInfo", "GET", "query", "Index details for a single URL.", [site, ["url", "string", true, "URL to inspect"]]],
  ["getUrlTrafficInfo", "GetUrlTrafficInfo", "GET", "query", "Index traffic details for a single URL.", [site, ["url", "string", true, "URL to inspect"]]],
  ["getChildrenUrlInfo", "GetChildrenUrlInfo", "POST", "query", "Index details for the URLs under a directory, paged.", [
    site,
    ["url", "string", true, "Directory URL"],
    ["page", "number", true, "Zero-based page number"],
    ["filterProperties", "json", false, "FilterProperties object (crawl date range, discovery date range, HTTP code, document flags)"],
  ]],
  ["getChildrenUrlTrafficInfo", "GetChildrenUrlTrafficInfo", "GET", "query", "Index traffic details for the URLs under a directory, paged.", [
    site,
    ["url", "string", true, "Directory URL"],
    ["page", "number", true, "Zero-based page number"],
  ]],
  ["getCrawlStats", "GetCrawlStats", "GET", "query", "Crawl statistics: crawled pages, errors, blocked pages, in-index counts.", [site]],
  ["getCrawlIssues", "GetCrawlIssues", "GET", "query", "Crawl issues found for a site.", [site]],
  ["getCrawlSettings", "GetCrawlSettings", "GET", "query", "Crawl rate settings of a site.", [site]],
  ["saveCrawlSettings", "SaveCrawlSettings", "POST", "mutation", "Save crawl rate settings of a site.", [site, ["crawlSettings", "json", true, "CrawlSettings object, for example { CrawlBoostAvailable, CrawlBoostEnabled, CrawlRate: [24 hourly values] }"]]],
  ["getLinkCounts", "GetLinkCounts", "GET", "query", "Pages of the site that have inbound links, with counts, paged.", [site, ["page", "number", true, "Zero-based page number"]]],
  ["getUrlLinks", "GetUrlLinks", "GET", "query", "Inbound links for one URL of the site, paged.", [site, ["link", "string", true, "URL of the site page"], ["page", "number", true, "Zero-based page number"]]],
  ["getConnectedPages", "GetConnectedPages", "GET", "query", "Pages connected to the site (pages linking to it that were added).", [site]],
  ["addConnectedPage", "AddConnectedPage", "POST", "mutation", "Add a page that links to your site as a connected page.", [site, ["masterUrl", "string", true, "URL of the page that links to your site"]]],
  // Submission
  ["submitUrl", "SubmitUrl", "POST", "mutation", "Submit one URL for indexing. Counts against the daily quota.", [site, ["url", "string", true, "URL to submit"]]],
  ["submitUrlBatch", "SubmitUrlBatch", "POST", "mutation", "Submit up to 500 URLs for indexing, within the remaining daily quota.", [site, ["urlList", "array", true, "URLs to submit"]]],
  ["getUrlSubmissionQuota", "GetUrlSubmissionQuota", "GET", "query", "Remaining daily and monthly URL submission quota for a site.", [site]],
  ["submitContent", "SubmitContent", "POST", "mutation", "Submit page content directly for indexing. Counts against the content submission quota.", [
    site,
    ["url", "string", true, "URL of the page"],
    ["httpMessage", "string", true, "Base64-encoded HTTP response (headers and body) of the page"],
    ["structuredData", "string", true, "Base64-encoded structured data of the page"],
    ["dynamicServing", "number", true, "Dynamic serving type: 0 none, 1 PC-laptop, 2 mobile, 3 AMP, 4 tablet, 5 non-visual browser"],
  ]],
  ["getContentSubmissionQuota", "GetContentSubmissionQuota", "GET", "query", "Remaining content submission quota for a site.", [site]],
  ["getFeeds", "GetFeeds", "GET", "query", "Sitemaps and feeds submitted for a site.", [site]],
  ["getFeedDetails", "GetFeedDetails", "GET", "query", "Details of one submitted feed or sitemap index.", [site, ["feedUrl", "string", true, "Feed or sitemap URL"]]],
  ["submitFeed", "SubmitFeed", "POST", "mutation", "Submit a sitemap or feed for a site.", [site, ["feedUrl", "string", true, "Feed or sitemap URL"]]],
  ["removeFeed", "RemoveFeed", "POST", "mutation", "Remove a submitted sitemap or feed.", [site, ["feedUrl", "string", true, "Feed or sitemap URL"]]],
  ["fetchUrl", "FetchUrl", "POST", "mutation", "Ask Bing to fetch a URL as Bingbot (Fetch as Bingbot).", [site, ["url", "string", true, "URL to fetch"]]],
  ["getFetchedUrls", "GetFetchedUrls", "GET", "query", "URLs previously fetched with fetchUrl.", [site]],
  ["getFetchedUrlDetails", "GetFetchedUrlDetails", "GET", "query", "Result of a fetchUrl request, including the fetched page.", [site, ["url", "string", true, "Fetched URL"]]],
  // Blocks and settings
  ["getBlockedUrls", "GetBlockedUrls", "GET", "query", "Pages and directories blocked from Bing results.", [site]],
  ["addBlockedUrl", "AddBlockedUrl", "POST", "mutation", "Block a page or directory from Bing results.", [site, ["blockedUrl", "json", true, "BlockedUrl object: { Url, EntityType (0 Page, 1 Directory), RequestType (0 CacheOnly, 1 FullRemoval), Date }"]]],
  ["removeBlockedUrl", "RemoveBlockedUrl", "POST", "mutation", "Unblock a page or directory.", [site, ["blockedUrl", "json", true, "BlockedUrl object as returned by getBlockedUrls"]]],
  ["getActivePagePreviewBlocks", "GetActivePagePreviewBlocks", "GET", "query", "Active page preview blocks for a site.", [site]],
  ["addPagePreviewBlock", "AddPagePreviewBlock", "POST", "mutation", "Block the preview of a page.", [site, ["url", "string", true, "Page URL"], ["reason", "number", true, "BlockReason code"]]],
  ["removePagePreviewBlock", "RemovePagePreviewBlock", "POST", "mutation", "Remove a page preview block.", [site, ["url", "string", true, "Page URL"]]],
  ["getDeepLinkBlocks", "GetDeepLinkBlocks", "GET", "query", "Deep link blocks for a site.", [site]],
  ["addDeepLinkBlock", "AddDeepLinkBlock", "POST", "mutation", "Block a deep link from a search result.", [
    site,
    ["market", "string", true, "Market, for example en-US"],
    ["searchUrl", "string", true, "URL of the search result"],
    ["deepLinkUrl", "string", true, "Deep link URL to block"],
  ]],
  ["removeDeepLinkBlock", "RemoveDeepLinkBlock", "POST", "mutation", "Remove a deep link block.", [
    site,
    ["market", "string", true, "Market, for example en-US"],
    ["searchUrl", "string", true, "URL of the search result"],
    ["deepLinkUrl", "string", true, "Deep link URL"],
  ]],
  ["getCountryRegionSettings", "GetCountryRegionSettings", "GET", "query", "Country or region targeting settings of a site.", [site]],
  ["addCountryRegionSettings", "AddCountryRegionSettings", "POST", "mutation", "Add a country or region targeting setting.", [site, ["settings", "json", true, "CountryRegionSettings object: { Date, Type (0 Page, 1 Directory, 2 Domain, 3 Subdomain), TwoLetterISORegion, Url }"]]],
  ["removeCountryRegionSettings", "RemoveCountryRegionSettings", "POST", "mutation", "Remove a country or region targeting setting.", [site, ["settings", "json", true, "CountryRegionSettings object as returned by getCountryRegionSettings"]]],
  ["getQueryParameters", "GetQueryParameters", "GET", "query", "URL normalization (ignored query) parameters of a site.", [site]],
  ["addQueryParameter", "AddQueryParameter", "POST", "mutation", "Add a URL normalization parameter.", [site, ["queryParameter", "string", true, "Query parameter name"]]],
  ["enableDisableQueryParameter", "EnableDisableQueryParameter", "POST", "mutation", "Enable or disable a URL normalization parameter.", [site, ["queryParameter", "string", true, "Query parameter name"], ["isEnabled", "boolean", true, "Enable the parameter"]]],
  ["removeQueryParameter", "RemoveQueryParameter", "POST", "mutation", "Remove a URL normalization parameter.", [site, ["queryParameter", "string", true, "Query parameter name"]]],
  ["getSiteMoves", "GetSiteMoves", "GET", "query", "Site move requests for a site.", [site]],
  ["submitSiteMove", "SubmitSiteMove", "POST", "mutation", "Submit a site move (change of address).", [site, ["siteMoveSettings", "json", true, "SiteMoveSettings object: { MoveScope (0 Host, 1 Domain), MoveType (0 Global, 1 Regional), SourceUrl, TargetUrl, TimeStamp }"]]],
];

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "array" ? array(string()) : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required, doc]) => `- ${name} (${type}${required ? ", required" : ""}): ${doc}`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (operation: string, method: "GET" | "POST", input: Record<string, unknown>) => {
    if (method === "GET") {
      const search = new URLSearchParams();
      for (const [name, value] of Object.entries(input)) if (value !== undefined && value !== null) search.set(name, String(value));
      const response = await fetcher(endpoint(account, operation, search), { signal, headers: headers(account) });
      return decodeJson(response, json());
    }
    const body: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(input)) if (value !== undefined && value !== null) body[name] = value;
    const response = await fetcher(endpoint(account, operation), {
      method: "POST",
      signal,
      headers: { ...headers(account), "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };

  const tools: Record<string, unknown> = {};
  for (const [name, operation, method, kind, description, fields] of rows) {
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(operation, method, input);
    tools[name] = kind === "mutation" ? mutation(options, handler as never) : query(options, handler as never);
  }
  return router(tools as never);
}

export default defineApp(
  { user: { accounts: { bing: bing.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bing ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bing Webmaster Tools",
        description:
          "Bing Webmaster Tools: manage sites, read search traffic, keyword and crawl statistics, inbound links, submit URLs, content and sitemaps, and configure blocks and site settings.",
        icons,
      },
    ),
  }),
);

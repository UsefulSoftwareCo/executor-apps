import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  oauth2,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Semrush's MCP docs now publish /v2/mcp; /v1/mcp still answers with the same OAuth metadata.
const mcpUrl = "https://mcp.semrush.com/v2/mcp";
const apiBase = "https://api.semrush.com";

const semrush = defineProvider({
  name: "Semrush",
  hosts: ["api.semrush.com", "www.semrush.com", "mcp.semrush.com", "oauth.semrush.com"],
  auth: {
    // Version 4 API key (recommended for new integrations), sent as "Authorization: Apikey <key>".
    // Semrush keys are version specific: a v4 key only works with v4 APIs.
    apiKeyV4: secrets({
      label: "API key (v4)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Standard API (v3) key from Subscription info > API units, sent as the key query parameter.
    apiKey: secrets({
      label: "API key (v3 Standard API)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The official MCP server publishes OAuth metadata with dynamic client registration.
    // offline_access is in the authorization server's scopes_supported and requests a refresh token.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    if (account.method === "apiKeyV4") {
      // v4 keys have no free balance endpoint. A parameterless call is rejected with 401/403 for a bad
      // key and with a validation error (no units spent) for a good one.
      const probe = await fetch(`${apiBase}/apis/v4/keywords/v1/metrics`, {
        headers: { Authorization: `Apikey ${account.fields.token}` },
        signal,
      });
      if (probe.status === 401 || probe.status === 403) throw new Error(`Semrush rejected the v4 API key (${probe.status})`);
      if (probe.status >= 500) throw new Error(`Semrush returned ${probe.status}`);
      return;
    }
    // Free call that returns the remaining API units as plain text.
    const response = await fetch(
      `https://www.semrush.com/users/countapiunits.html?key=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    const text = (await response.text()).trim();
    if (!response.ok || !/^[\d,.]+$/.test(text)) throw new Error(`Semrush rejected the API key (${response.status}): ${text.slice(0, 200)}`);
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Standard API reports are semicolon-delimited CSV; errors arrive as "ERROR 50 :: NOTHING FOUND".
function parseCsv(text: string) {
  const trimmed = text.trim();
  if (/^ERROR\s+\d+/i.test(trimmed)) throw new Error(`Semrush ${trimmed}`);
  const lines = trimmed.split(/\r?\n/).filter((line) => line.length > 0);
  const split = (line: string) => line.split(";").map((cell) => cell.replace(/^"|"$/g, ""));
  const columns = split(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const cells = split(line);
    return Object.fromEntries(columns.map((name, index) => [name, cells[index] ?? ""]));
  });
  return { columns, rows };
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return {
    report: async (path: string, params: Params) => {
      const url = new URL(`${apiBase}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      url.searchParams.set("key", token);
      const response = await fetcher(url.toString(), { signal });
      const text = await response.text();
      // Never echo the request URL: it carries the key.
      if (!response.ok) throw new Error(`Semrush returned ${response.status}: ${text.slice(0, 300)}`);
      return parseCsv(text);
    },
    units: async () => {
      const response = await fetcher(
        `https://www.semrush.com/users/countapiunits.html?key=${encodeURIComponent(token)}`,
        { signal },
      );
      const text = (await response.text()).trim();
      if (!response.ok) throw new Error(`Semrush returned ${response.status}: ${text.slice(0, 300)}`);
      return { remainingUnits: Number(text.replace(/,/g, "")) };
    },
  };
}

type Client = ReturnType<typeof client>;

// Version 4 APIs take "Authorization: Apikey <key>" and answer { meta, data }.
function clientV4(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return {
    get: async (path: string, params: Params) => {
      const url = new URL(`${apiBase}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      const response = await fetcher(url.toString(), { headers: { Authorization: `Apikey ${token}` }, signal });
      const text = await response.text();
      if (!response.ok) throw new Error(`Semrush returned ${response.status}: ${text.slice(0, 300)}`);
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`Semrush returned a non-JSON response: ${text.slice(0, 300)}`);
      }
    },
  };
}

type ClientV4 = ReturnType<typeof clientV4>;

const paging = {
  displayLimit: number().optional(),
  displayOffset: number().optional(),
  exportColumns: string().optional(),
  displaySort: string().optional(),
  displayFilter: string().optional(),
  displayDate: string().optional(),
  params: record(json()).optional(),
};

type Common = {
  displayLimit?: number;
  displayOffset?: number;
  exportColumns?: string;
  displaySort?: string;
  displayFilter?: string;
  displayDate?: string;
  params?: Record<string, unknown>;
};

const common = (input: Common): Params => ({
  ...(input.params ?? {}),
  display_limit: input.displayLimit,
  display_offset: input.displayOffset,
  export_columns: input.exportColumns,
  display_sort: input.displaySort,
  display_filter: input.displayFilter,
  display_date: input.displayDate,
});

const paramNotes =
  " Optional: displayLimit/displayOffset (raise the limit by the offset), exportColumns (comma-separated column codes such as Ph,Po,Nq), displaySort, displayFilter, displayDate (YYYYMM15), params for any other documented query parameter. Costs API units per returned line.";

// tool name, report type, description
// Live API units per returned line, from Semrush's v3 domain reports page.
const domainCosts: Record<string, number> = {"domain_ranks": 10, "domain_organic": 10, "domain_adwords": 20, "domain_adwords_unique": 40, "domain_organic_organic": 40, "domain_adwords_adwords": 40, "domain_adwords_historical": 100, "domain_shopping": 30, "domain_shopping_unique": 60, "domain_rank_history": 10, "domain_rank": 10};

const domainReports: readonly [string, string, string][] = [
  ["domainRanks", "domain_ranks", "Domain Overview across every regional database: organic and paid keywords, traffic and cost."],
  ["domainOrganic", "domain_organic", "Organic search keywords a domain ranks for in Google's top 100."],
  ["domainAdwords", "domain_adwords", "Paid search keywords a domain bids on."],
  ["domainAdwordsUnique", "domain_adwords_unique", "Unique ad copies seen for a domain."],
  ["domainOrganicCompetitors", "domain_organic_organic", "Organic search competitors of a domain."],
  ["domainAdwordsCompetitors", "domain_adwords_adwords", "Paid search competitors of a domain."],
  ["domainAdwordsHistorical", "domain_adwords_historical", "Keywords a domain bid on over the past 12 months."],
  ["domainShopping", "domain_shopping", "Keywords that trigger a domain's product listing ads."],
  ["domainShoppingUnique", "domain_shopping_unique", "Unique product listing ad copies for a domain."],
  ["domainRankHistory", "domain_rank_history", "Monthly (or daily) history of a domain's overview metrics in one database."],
  ["domainRank", "domain_rank", "Domain Overview in one regional database."],
];

const keywordReports: readonly [string, string, string, boolean][] = [
  ["keywordOverviewAllDatabases", "phrase_all", "Volume, CPC, competition and result count for a keyword across all databases.", false],
  ["keywordOverviewBatch", "phrase_these", "Overview for up to 100 keywords separated by semicolons in phrase, in one database.", true],
  ["keywordOrganic", "phrase_organic", "Domains in Google's top 100 organic results for a keyword.", true],
  ["keywordAdwords", "phrase_adwords", "Domains showing paid results for a keyword.", true],
  ["keywordRelated", "phrase_related", "Related keywords, synonyms and variations.", true],
  ["keywordAdwordsHistorical", "phrase_adwords_historical", "Domains that bid on a keyword over the past 12 months.", true],
  ["keywordBroadMatch", "phrase_fullsearch", "Broad-match and alternate queries containing the keyword.", true],
  ["keywordQuestions", "phrase_questions", "Question-form queries related to a keyword.", true],
  ["keywordDifficulty", "phrase_kdi", "Keyword difficulty index for up to 100 keywords separated by semicolons.", true],
];

const backlinkReports: readonly [string, string, string][] = [
  ["backlinksTld", "backlinks_tld", "Referring domains of a target grouped by top-level domain."],
  ["backlinksGeo", "backlinks_geo", "Referring domains of a target grouped by country."],
];

function build(c: Client) {
  const domain = Object.fromEntries(
    domainReports.map(([name, type, description]) => [
      name,
      query(
        {
          description: `${description} Report type ${type}. Needs domain; most reports also need database (us, uk, de, ...). Costs ${domainCosts[type] ?? 10} API units per line (5x for historical data via displayDate).${paramNotes}`,
          input: object({ domain: string({ minLength: 1 }), database: string().optional(), ...paging }),
        },
        async (_ctx, input) => c.report("/", { type, domain: input.domain, database: input.database, ...common(input) }),
      ),
    ]),
  );
  const keyword = Object.fromEntries(
    keywordReports.map(([name, type, description, needsDb]) => [
      name,
      query(
        {
          description: `${description} Report type ${type}. Needs phrase${needsDb ? " and database (us, uk, de, ...)" : ""}.${paramNotes}`,
          input: object({ phrase: string({ minLength: 1 }), database: string().optional(), ...paging }),
        },
        async (_ctx, input) => c.report("/", { type, phrase: input.phrase, database: input.database, ...common(input) }),
      ),
    ]),
  );
  const backlinks = Object.fromEntries(
    backlinkReports.map(([name, type, description]) => [
      name,
      query(
        {
          description: `${description} Report type ${type}. Needs target (domain, subdomain or URL) and targetType (root_domain, domain or url). Costs 40 API units per line. No v4 equivalent.${paramNotes}`,
          input: object({ target: string({ minLength: 1 }), targetType: string({ minLength: 1 }), ...paging }),
        },
        async (_ctx, input) =>
          c.report("/analytics/v1/", { type, target: input.target, target_type: input.targetType, ...common(input) }),
      ),
    ]),
  );
  return router({
    ...domain,
    ...keyword,
    ...backlinks,
    domainVsDomain: query(
      {
        description:
          "Compare up to five domains by shared, unique or missing keywords (report type domain_domains). domains is a string of <sign>|<type>|<domain> entries, sign one of + - * /, type or (organic) or ad (paid), e.g. *|or|a.com|*|or|b.com. Needs database. Costs 80 API units per line (400 for historical data)." +
          paramNotes,
        input: object({ domains: string({ minLength: 1 }), database: string({ minLength: 1 }), ...paging }),
      },
      async (_ctx, input) => c.report("/", { type: "domain_domains", domains: input.domains, database: input.database, ...common(input) }),
    ),
    rank: query(
      {
        description: "Top domains ranked by organic traffic in a database (report type rank, Semrush Rank). Costs 10 API units per line." + paramNotes,
        input: object({ database: string({ minLength: 1 }), ...paging }),
      },
      async (_ctx, input) => c.report("/", { type: "rank", database: input.database, ...common(input) }),
    ),
    rankDifference: query(
      {
        description: "Winners and losers: domains with the biggest traffic changes in a database (report type rank_difference). Costs 20 API units per line." + paramNotes,
        input: object({ database: string({ minLength: 1 }), ...paging }),
      },
      async (_ctx, input) => c.report("/", { type: "rank_difference", database: input.database, ...common(input) }),
    ),
    report: query(
      {
        description:
          "Run any Standard API report by type with raw query parameters in params (domain, phrase, target, database, export_columns, display_*). Prefer a specific tool when one exists.",
        input: object({ type: string({ minLength: 1 }), path: string().optional(), params: record(json()).optional() }),
      },
      async (_ctx, { type, path, params }) =>
        c.report(path === "/analytics/v1/" ? path : "/", { ...(params ?? {}), type }),
    ),
    apiUnits: query(
      { description: "Remaining Standard API units on the account. Free.", input: object({}) },
      async () => c.units(),
    ),
  });
}

const scope = string({ minLength: 1 });
const v4List = {
  url: string({ minLength: 1 }),
  scope,
  fields: string().optional(),
  orderBy: string().optional(),
  direction: string().optional(),
  limit: number().optional(),
  offset: number().optional(),
  filter: string().optional(),
};
type V4List = {
  url: string;
  scope: string;
  fields?: string;
  orderBy?: string;
  direction?: string;
  limit?: number;
  offset?: number;
  filter?: string;
};
const v4ListParams = (i: V4List): Params => ({
  url: i.url,
  scope: i.scope,
  fields: i.fields,
  order_by: i.orderBy,
  direction: i.direction,
  limit: i.limit,
  offset: i.offset,
  filter: i.filter,
});
const v4Notes =
  " url is a domain, subdomain, folder or page URL; scope is ROOT_DOMAIN, SUBDOMAIN, SUBFOLDER or PAGE. Optional: fields (comma-separated), orderBy, direction (ASC or DESC), limit (default 100, set it: cost is per line), offset, filter (AND/OR, LIKE with %).";

function buildV4(c: ClientV4) {
  const list = (name: string, path: string, description: string, cost: number) =>
    [
      name,
      query(
        { description: `${description} Costs ${cost} API units per line.${v4Notes}`, input: object(v4List) },
        async (_ctx: unknown, input: V4List) => c.get(`/apis/v4/backlinks/v1/${path}`, v4ListParams(input)),
      ),
    ] as const;
  return router({
    keywordMetrics: query(
      {
        description:
          "Search volume, CPC, competitive density, keyword difficulty, intents, SERP features and 12-month trend for one keyword in one country. Costs 20 API units per request. country is an ISO 3166-1 alpha-2 code (UK, not GB); month is YYYY-MM.",
        input: object({ keyword: string({ minLength: 1 }), country: string({ minLength: 2 }), month: string().optional() }),
      },
      async (_ctx, input) =>
        c.get("/apis/v4/keywords/v1/metrics", { keyword: input.keyword, country: input.country, month: input.month }),
    ),
    backlinksOverview: query(
      {
        description:
          "Backlink summary for a target: backlink and referring-domain counts, follow/nofollow and link type split. Costs 45 API units per request. url is a domain, subdomain, folder or page URL; scope is ROOT_DOMAIN, SUBDOMAIN, SUBFOLDER or PAGE; fields is optional (comma-separated).",
        input: object({ url: string({ minLength: 1 }), scope, fields: string().optional() }),
      },
      async (_ctx, input) => c.get("/apis/v4/backlinks/v1/overview", { url: input.url, scope: input.scope, fields: input.fields }),
    ),
    ...Object.fromEntries([
      list("backlinks", "links", "Individual backlinks to a target (default order page_score).", 45),
      list("backlinksRefDomains", "ref-domains", "Domains linking to a target (default order backlinks_count).", 40),
      list("backlinksRefIps", "ref-ips", "IP addresses backlinks to a target come from.", 20),
      list("backlinksPages", "pages", "Pages of the target that have backlinks.", 40),
      list("backlinksAnchors", "anchors", "Anchor texts used in backlinks to a target.", 40),
    ]),
    backlinksHistory: query(
      {
        description:
          "Monthly history of a target's authority score, backlink, referring-domain and follow counts. Costs 40 API units per line. scope is ROOT_DOMAIN, SUBDOMAIN or PAGE (not SUBFOLDER). Optional: fields, limit (default 12), dateFrom and dateTo (YYYY-MM).",
        input: object({
          url: string({ minLength: 1 }),
          scope,
          fields: string().optional(),
          limit: number().optional(),
          dateFrom: string().optional(),
          dateTo: string().optional(),
        }),
      },
      async (_ctx, input) =>
        c.get("/apis/v4/backlinks/v1/summary", {
          url: input.url,
          scope: input.scope,
          fields: input.fields,
          limit: input.limit,
          date_from: input.dateFrom,
          date_to: input.dateTo,
        }),
    ),
    backlinksScoreProfile: query(
      {
        description:
          "Distribution of a target's backlinks by authority score (0-100, at most 101 rows). Costs 1 API unit per line. scope is ROOT_DOMAIN, SUBDOMAIN, SUBFOLDER or PAGE.",
        input: object({ url: string({ minLength: 1 }), scope }),
      },
      async (_ctx, input) => c.get("/apis/v4/backlinks/v1/score-profile", { url: input.url, scope: input.scope }),
    ),
    backlinksCompetitors: query(
      {
        description:
          "Domains with a backlink profile similar to a domain (at least 5 shared referring domains). Costs 40 API units per line. Optional: fields, orderBy (default similarity), direction, limit, offset.",
        input: object({
          domain: string({ minLength: 1 }),
          fields: string().optional(),
          orderBy: string().optional(),
          direction: string().optional(),
          limit: number().optional(),
          offset: number().optional(),
        }),
      },
      async (_ctx, input) =>
        c.get("/apis/v4/backlinks/v1/competitors", {
          domain: input.domain,
          fields: input.fields,
          order_by: input.orderBy,
          direction: input.direction,
          limit: input.limit,
          offset: input.offset,
        }),
    ),
    request: query(
      {
        description:
          "GET any other Semrush v4 endpoint under /apis/v4/ (for example backlinks summary comparison or matrix) with raw query parameters. Prefer a specific tool when one exists.",
        input: object({ path: string({ minLength: 1 }), params: record(json()).optional() }),
      },
      async (_ctx, { path, params }) => {
        if (!/^\/apis\/v4\/[A-Za-z0-9_\-/]+$/.test(path) || path.includes("..")) throw new Error("path must look like /apis/v4/<product>/<version>/<method>");
        return c.get(path, params ?? {});
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { semrush: semrush.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.semrush ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          if (account.method === "apiKeyV4") return buildV4(clientV4(account.fields.token, fetch, signal));
          return build(client(account.fields.token, fetch, signal));
        },
        { signal },
      ),
      {
        title: "Semrush",
        description:
          "Semrush SEO data: domain overview, organic and paid keywords, competitors, keyword research and backlinks. Use a v4 API key (keyword metrics and backlinks), a v3 Standard API key (domain reports and the rest) or OAuth for the official Semrush MCP server.",
        icons,
      },
    ),
  }),
);

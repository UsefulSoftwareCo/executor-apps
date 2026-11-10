import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.linkedin.com";
// LinkedIn requires a version header (YYYYMM) on /rest calls and supports each version for a year.
const version = "202609";

const linkedinads = defineProvider({
  name: "LinkedIn Ads",
  // www.linkedin.com receives the client secret in the token exchange.
  hosts: ["api.linkedin.com", "www.linkedin.com"],
  auth: {
    // LinkedIn has no client registration: the connect page asks for the client of a LinkedIn developer app
    // that has the Advertising API product. These are the Advertising API permissions.
    oauth: oauth2({
      authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["r_ads", "rw_ads", "r_ads_reporting"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/rest/adAccountUsers?q=authenticatedUser`, {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": version,
      },
    });
    await decodeJson(response, object({ elements: array(object({ account: string() })) }));
    return {};
  },
});

type Fetch = typeof fetch;

const enc = encodeURIComponent;
const urn = string({ minLength: 1 });
const id = string({ minLength: 1 });
const sponsoredAccount = (accountId: string) => `urn:li:sponsoredAccount:${accountId}`;
const list = (values: readonly string[]) => `List(${values.map(enc).join(",")})`;
// Rest.li search criteria: (status:(values:List(ACTIVE,DRAFT)),test:false)
const criteria = (fields: Record<string, readonly string[] | boolean | undefined>) =>
  `(${Object.entries(fields)
    .filter(([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => (typeof value === "boolean" ? `${key}:${value}` : `${key}:(values:List(${(value as string[]).map(enc).join(",")}))`))
    .join(",")})`;

const date = object({ year: number(), month: number(), day: number() });
const page = { pageSize: number().optional(), pageToken: string().optional() };
const statuses = array(string()).optional();

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  // `query` is a raw, already-encoded query string: Rest.li 2.0 needs literal parentheses and commas.
  const call = async (path: string, init: { method?: string; query?: string; body?: unknown; restliMethod?: string } = {}) => {
    const response = await fetcher(`${base}${path}${init.query ? `?${init.query}` : ""}`, {
      method: init.method ?? "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": version,
        ...(init.restliMethod ? { "X-RestLi-Method": init.restliMethod } : {}),
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`LinkedIn answered ${response.status}: ${text.slice(0, 1000)}`);
    // Creates answer 201 with an empty body and the new id in x-restli-id; updates and deletes answer 204.
    const created = response.headers.get("x-restli-id") ?? undefined;
    if (text === "") return { status: response.status, id: created };
    const parsed: unknown = JSON.parse(text);
    return created === undefined || typeof parsed !== "object" || parsed === null ? parsed : { id: created, ...parsed };
  };

  const paging = (input: { pageSize?: number | undefined; pageToken?: string | undefined; sortOrder?: string | undefined }) =>
    [
      input.sortOrder ? `sortOrder=${input.sortOrder}` : "",
      input.pageSize ? `pageSize=${input.pageSize}` : "",
      input.pageToken ? `pageToken=${enc(input.pageToken)}` : "",
    ].filter(Boolean);

  const patch = (path: string, set: Record<string, unknown>) =>
    call(path, { method: "POST", restliMethod: "PARTIAL_UPDATE", body: { patch: { $set: set } } });

  const amount = object({ amount: string(), currencyCode: string() });

  return router({
    accounts: router(
      {
        search: query(
          {
            description:
              "Search ad accounts the member can access. Filters are optional: status (ACTIVE, DRAFT, CANCELED, PENDING_DELETION, REMOVED), type (BUSINESS, ENTERPRISE), name, reference (org or person URN), test. Returns elements and metadata.nextPageToken.",
            input: object({
              status: statuses,
              type: statuses,
              name: statuses,
              reference: statuses,
              test: string().optional(),
              sortOrder: string().optional(),
              ...page,
            }),
          },
          async (_ctx, input) =>
            call("/rest/adAccounts", {
              query: [
                "q=search",
                `search=${criteria({
                  status: input.status,
                  type: input.type,
                  name: input.name,
                  reference: input.reference,
                  test: input.test === undefined ? undefined : input.test === "true",
                })}`,
                ...paging(input),
              ].join("&"),
            }),
        ),
        get: query(
          { description: "Get an ad account by its numeric id.", input: object({ accountId: id }) },
          async (_ctx, { accountId }) => call(`/rest/adAccounts/${enc(accountId)}`),
        ),
        create: mutation(
          {
            description:
              "Create an ad account (type BUSINESS only). reference is the urn:li:organization:<id> or urn:li:person:<id> advertised for. test creates a test account (one per developer app; never served or billed). Returns the new account id.",
            input: object({
              name: string({ minLength: 1 }),
              reference: urn,
              currency: string().default("USD"),
              test: string().optional(),
            }),
          },
          async (_ctx, input) =>
            call("/rest/adAccounts", {
              method: "POST",
              body: {
                name: input.name,
                reference: input.reference,
                currency: input.currency,
                type: "BUSINESS",
                ...(input.test === "true" ? { test: true } : {}),
              },
            }),
        ),
        update: mutation(
          {
            description: "Change an ad account's name or status (for example PENDING_DELETION to start deleting a non-draft account).",
            input: object({ accountId: id, name: string().optional(), status: string().optional() }),
          },
          async (_ctx, { accountId, name, status }) => {
            const set = { ...(name ? { name } : {}), ...(status ? { status } : {}) };
            if (Object.keys(set).length === 0) throw new Error("Provide name or status");
            return patch(`/rest/adAccounts/${enc(accountId)}`, set);
          },
        ),
        users: query(
          {
            description: "List the users and their roles (VIEWER, CAMPAIGN_MANAGER, ACCOUNT_MANAGER, ...) on an ad account.",
            input: object({ accountId: id }),
          },
          async (_ctx, { accountId }) =>
            call("/rest/adAccountUsers", { query: `q=accounts&accounts=${list([sponsoredAccount(accountId)])}` }),
        ),
        myAccess: query(
          { description: "The connected member's role on every ad account they can access.", input: object({}) },
          async () => call("/rest/adAccountUsers", { query: "q=authenticatedUser" }),
        ),
      },
      { title: "Ad accounts", description: "Find and manage ad accounts and who can use them." },
    ),
    campaignGroups: router(
      {
        search: query(
          {
            description: "Search campaign groups in an ad account. Optional filters: status (ACTIVE, PAUSED, DRAFT, ARCHIVED, ...), name, id (campaign group URNs), test.",
            input: object({ accountId: id, status: statuses, name: statuses, id: statuses, test: string().optional(), sortOrder: string().optional(), ...page }),
          },
          async (_ctx, input) =>
            call(`/rest/adAccounts/${enc(input.accountId)}/adCampaignGroups`, {
              query: [
                "q=search",
                `search=${criteria({ status: input.status, name: input.name, id: input.id, test: input.test === undefined ? undefined : input.test === "true" })}`,
                ...paging(input),
              ].join("&"),
            }),
        ),
        get: query(
          { description: "Get a campaign group.", input: object({ accountId: id, campaignGroupId: id }) },
          async (_ctx, { accountId, campaignGroupId }) => call(`/rest/adAccounts/${enc(accountId)}/adCampaignGroups/${enc(campaignGroupId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a campaign group. runSchedule start (and end, required with totalBudget) are epoch milliseconds. status is ACTIVE or DRAFT. totalBudget amount is a decimal string in the account currency. Extra documented fields (objectiveType, budgetOptimization, dailyBudget) can go in extra.",
            input: object({
              accountId: id,
              name: string({ minLength: 1 }),
              status: string().default("DRAFT"),
              startMs: number(),
              endMs: number().optional(),
              totalBudget: amount.optional(),
              extra: record(json()).optional(),
            }),
          },
          async (_ctx, input) =>
            call(`/rest/adAccounts/${enc(input.accountId)}/adCampaignGroups`, {
              method: "POST",
              body: {
                ...(input.extra ?? {}),
                account: sponsoredAccount(input.accountId),
                name: input.name,
                status: input.status,
                runSchedule: { start: input.startMs, ...(input.endMs === undefined ? {} : { end: input.endMs }) },
                ...(input.totalBudget ? { totalBudget: input.totalBudget } : {}),
              },
            }),
        ),
        update: mutation(
          {
            description: "Partially update a campaign group. set holds the fields to change, for example { status: \"PAUSED\" } or { totalBudget: { amount: \"3000\", currencyCode: \"USD\" } }.",
            input: object({ accountId: id, campaignGroupId: id, set: record(json()) }),
          },
          async (_ctx, { accountId, campaignGroupId, set }) =>
            patch(`/rest/adAccounts/${enc(accountId)}/adCampaignGroups/${enc(campaignGroupId)}`, set),
        ),
        delete: mutation(
          { description: "Delete a DRAFT campaign group. For other statuses use update with status PENDING_DELETION.", input: object({ accountId: id, campaignGroupId: id }) },
          async (_ctx, { accountId, campaignGroupId }) =>
            call(`/rest/adAccounts/${enc(accountId)}/adCampaignGroups/${enc(campaignGroupId)}`, { method: "DELETE" }),
        ),
      },
      { title: "Campaign groups", description: "Group campaigns under a shared budget and schedule." },
    ),
    campaigns: router(
      {
        search: query(
          {
            description: "Search campaigns in an ad account. Optional filters: status (ACTIVE, PAUSED, DRAFT, ...), type (SPONSORED_UPDATES, TEXT_AD, SPONSORED_INMAILS, DYNAMIC), name, campaignGroup (URNs), id, test.",
            input: object({ accountId: id, status: statuses, type: statuses, name: statuses, campaignGroup: statuses, id: statuses, test: string().optional(), sortOrder: string().optional(), ...page }),
          },
          async (_ctx, input) =>
            call(`/rest/adAccounts/${enc(input.accountId)}/adCampaigns`, {
              query: [
                "q=search",
                `search=${criteria({
                  status: input.status,
                  type: input.type,
                  name: input.name,
                  campaignGroup: input.campaignGroup,
                  id: input.id,
                  test: input.test === undefined ? undefined : input.test === "true",
                })}`,
                ...paging(input),
              ].join("&"),
            }),
        ),
        get: query(
          { description: "Get a campaign.", input: object({ accountId: id, campaignId: id }) },
          async (_ctx, { accountId, campaignId }) => call(`/rest/adAccounts/${enc(accountId)}/adCampaigns/${enc(campaignId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a campaign. campaign is the documented request body without account (added for you): name, campaignGroup (urn:li:sponsoredCampaignGroup:<id>), type, objectiveType, costType, unitCost, dailyBudget, runSchedule, locale, targetingCriteria, status, and so on. Returns the new campaign id.",
            input: object({ accountId: id, campaign: record(json()) }),
          },
          async (_ctx, { accountId, campaign }) =>
            call(`/rest/adAccounts/${enc(accountId)}/adCampaigns`, {
              method: "POST",
              body: { ...campaign, account: sponsoredAccount(accountId) },
            }),
        ),
        update: mutation(
          {
            description: "Partially update a campaign. set holds the fields to change, for example { status: \"PAUSED\" }, { dailyBudget: { amount: \"50\", currencyCode: \"USD\" } } or { targetingCriteria: {...} }.",
            input: object({ accountId: id, campaignId: id, set: record(json()) }),
          },
          async (_ctx, { accountId, campaignId, set }) => patch(`/rest/adAccounts/${enc(accountId)}/adCampaigns/${enc(campaignId)}`, set),
        ),
        delete: mutation(
          { description: "Delete a DRAFT campaign. For other statuses use update with status PENDING_DELETION.", input: object({ accountId: id, campaignId: id }) },
          async (_ctx, { accountId, campaignId }) => call(`/rest/adAccounts/${enc(accountId)}/adCampaigns/${enc(campaignId)}`, { method: "DELETE" }),
        ),
      },
      { title: "Campaigns", description: "Create, inspect, pause and delete campaigns." },
    ),
    creatives: router(
      {
        search: query(
          {
            description:
              "List creatives in an ad account. Optional filters: campaigns (urn:li:sponsoredCampaign:<id>), creatives (urn:li:sponsoredCreative:<id>), contentReferences (post URNs), intendedStatuses (ACTIVE, PAUSED, DRAFT, ARCHIVED, ...).",
            input: object({ accountId: id, campaigns: statuses, creatives: statuses, contentReferences: statuses, intendedStatuses: statuses, sortOrder: string().optional(), ...page }),
          },
          async (_ctx, input) => {
            const parts = ["q=criteria"];
            for (const key of ["campaigns", "creatives", "contentReferences", "intendedStatuses"] as const) {
              const values = input[key];
              if (values && values.length > 0) parts.push(`${key}=${key === "intendedStatuses" ? `List(${values.map(enc).join(",")})` : list(values)}`);
            }
            return call(`/rest/adAccounts/${enc(input.accountId)}/creatives`, { query: [...parts, ...paging(input)].join("&") });
          },
        ),
        get: query(
          { description: "Get a creative by URN (urn:li:sponsoredCreative:<id>).", input: object({ accountId: id, creative: urn }) },
          async (_ctx, { accountId, creative }) => call(`/rest/adAccounts/${enc(accountId)}/creatives/${enc(creative)}`),
        ),
        create: mutation(
          {
            description:
              "Create a creative that promotes an existing post or other content. content is the documented content object, for example { reference: \"urn:li:share:<id>\" }. intendedStatus is ACTIVE, PAUSED or DRAFT. Returns the creative URN as id.",
            input: object({
              accountId: id,
              campaign: urn,
              content: record(json()),
              intendedStatus: string().default("DRAFT"),
              name: string().optional(),
            }),
          },
          async (_ctx, input) =>
            call(`/rest/adAccounts/${enc(input.accountId)}/creatives`, {
              method: "POST",
              body: {
                campaign: input.campaign,
                content: input.content,
                intendedStatus: input.intendedStatus,
                ...(input.name ? { name: input.name } : {}),
              },
            }),
        ),
        update: mutation(
          {
            description: "Partially update a creative, for example set { intendedStatus: \"PAUSED\" }.",
            input: object({ accountId: id, creative: urn, set: record(json()) }),
          },
          async (_ctx, { accountId, creative, set }) => patch(`/rest/adAccounts/${enc(accountId)}/creatives/${enc(creative)}`, set),
        ),
      },
      { title: "Creatives", description: "The ads that promote content within a campaign." },
    ),
    analytics: router(
      {
        report: query(
          {
            description:
              "Performance report grouped by one pivot (ACCOUNT, CAMPAIGN_GROUP, CAMPAIGN, CREATIVE, or a MEMBER_* demographic such as MEMBER_COMPANY, MEMBER_JOB_TITLE, MEMBER_COUNTRY_V2). Filter with at least one of accounts, campaignGroups, campaigns, creatives (URNs). timeGranularity is ALL, DAILY, MONTHLY or YEARLY. fields lists up to 20 metrics (default only impressions and clicks), for example impressions, clicks, costInLocalCurrency, landingPageClicks, externalWebsiteConversions, leadGenerationMailContactInfoShares, dateRange, pivotValues. Not paginated; at most 15,000 rows.",
            input: object({
              pivot: string({ minLength: 1 }),
              timeGranularity: string().default("ALL"),
              start: date,
              end: date.optional(),
              accounts: statuses,
              campaignGroups: statuses,
              campaigns: statuses,
              creatives: statuses,
              fields: array(string()).optional(),
            }),
          },
          async (_ctx, input) => {
            const d = (x: { year: number; month: number; day: number }) => `(year:${x.year},month:${x.month},day:${x.day})`;
            const parts = [
              "q=analytics",
              `pivot=${enc(input.pivot)}`,
              `timeGranularity=${enc(input.timeGranularity)}`,
              `dateRange=(start:${d(input.start)}${input.end ? `,end:${d(input.end)}` : ""})`,
            ];
            for (const key of ["accounts", "campaignGroups", "campaigns", "creatives"] as const) {
              const values = input[key];
              if (values && values.length > 0) parts.push(`${key}=${list(values)}`);
            }
            if (input.fields && input.fields.length > 0) parts.push(`fields=${input.fields.map(enc).join(",")}`);
            return call("/rest/adAnalytics", { query: parts.join("&") });
          },
        ),
        statistics: query(
          {
            description:
              "Performance report grouped by up to three pivots at once (for example CAMPAIGN and MEMBER_COMPANY_SIZE). Same filters, date range and fields as analytics.report.",
            input: object({
              pivots: array(string()),
              timeGranularity: string().default("ALL"),
              start: date,
              end: date.optional(),
              accounts: statuses,
              campaignGroups: statuses,
              campaigns: statuses,
              creatives: statuses,
              fields: array(string()).optional(),
            }),
          },
          async (_ctx, input) => {
            if (input.pivots.length < 1 || input.pivots.length > 3) throw new Error("Provide one to three pivots");
            const d = (x: { year: number; month: number; day: number }) => `(year:${x.year},month:${x.month},day:${x.day})`;
            const parts = [
              "q=statistics",
              `pivots=List(${input.pivots.map(enc).join(",")})`,
              `timeGranularity=${enc(input.timeGranularity)}`,
              `dateRange=(start:${d(input.start)}${input.end ? `,end:${d(input.end)}` : ""})`,
            ];
            for (const key of ["accounts", "campaignGroups", "campaigns", "creatives"] as const) {
              const values = input[key];
              if (values && values.length > 0) parts.push(`${key}=${list(values)}`);
            }
            if (input.fields && input.fields.length > 0) parts.push(`fields=${input.fields.map(enc).join(",")}`);
            return call("/rest/adAnalytics", { query: parts.join("&") });
          },
        ),
      },
      { title: "Analytics", description: "Impressions, clicks, spend, conversions and demographic breakdowns." },
    ),
    targeting: router(
      {
        facets: query(
          { description: "List the targeting facets (industries, locations, seniorities, job functions, skills, ...) and their URNs.", input: object({}) },
          async () => call("/rest/adTargetingFacets"),
        ),
        entities: query(
          {
            description:
              "List the entities of one targeting facet, or search them by name. facet is a facet URN such as urn:li:adTargetingFacet:industries. Without queryText all entities are listed; with it, matching entities are returned.",
            input: object({ facet: urn, queryText: string().optional(), locale: string().optional(), start: number().optional(), count: number().optional() }),
          },
          async (_ctx, input) => {
            const parts = input.queryText
              ? [`q=typeahead`, `facet=${enc(input.facet)}`, `query=${enc(input.queryText)}`]
              : [`q=adTargetingFacet`, `facet=${enc(input.facet)}`];
            parts.push(`locale=(language:${input.locale?.split("_")[0] ?? "en"},country:${input.locale?.split("_")[1] ?? "US"})`);
            if (input.start !== undefined) parts.push(`start=${input.start}`);
            if (input.count !== undefined) parts.push(`count=${input.count}`);
            return call("/rest/adTargetingEntities", { query: parts.join("&") });
          },
        ),
        audienceCounts: query(
          {
            description:
              "Estimate the audience size for a targeting criteria object (the same include/exclude structure campaigns use, for example { include: { and: [ { or: { \"urn:li:adTargetingFacet:locations\": [\"urn:li:geo:103644278\"] } } ] } }). A campaign needs at least 300 members.",
            input: object({ targetingCriteria: record(json()) }),
          },
          async (_ctx, { targetingCriteria }) =>
            call("/rest/audienceCounts", { method: "POST", query: "q=targetingCriteriaV2", body: { targetingCriteria } }),
        ),
      },
      { title: "Targeting", description: "Discover targeting options and estimate audience size." },
    ),
  });
}

export default defineApp({ user: { accounts: { linkedinads: linkedinads.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.linkedinads ?? [],
      (account) =>
        withApprovals(tools(account.fields.access_token, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
      { signal },
    ),
    {
      title: "LinkedIn Ads",
      description:
        "Manage LinkedIn ad accounts, campaign groups, campaigns and creatives, explore targeting, and report on ad performance through LinkedIn's Marketing API.",
      icons,
    },
  ),
}));

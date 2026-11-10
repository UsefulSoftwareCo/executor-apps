import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Algolia product, nine official bundled specs from
// https://github.com/algolia/api-clients-automation/tree/main/specs/bundled. index.ts mounts each under its
// own key and swaps in the account's origin where the API is per application (Search, Recommend) or per region
// (Ingestion, Personalization, Query Suggestions); the placeholder origins below are only used to compile.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/algolia/api-clients-automation/main/specs/bundled/${name}.yml`,
});

const credentials = {
  securitySchemes: {
    appId: { type: "apiKey", in: "header", name: "x-algolia-application-id" },
    apiKey: { type: "apiKey", in: "header", name: "x-algolia-api-key" },
  },
  // Some operations declare no security, such as Monitoring's infrastructure metrics; they need the key too.
  fallbackSecurity: [{ appId: [], apiKey: [] }],
  methods: {
    apiKey: [
      { scheme: "appId", field: "appId", part: "value", prefix: "" },
      { scheme: "apiKey", field: "apiKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(name: string, origin: string, kinds: K) =>
  ({ source: spec(name), allowedOrigin: origin, baseUrl: origin, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

// POST operations that only read or dry-run are kinds=query, so they run without an approval prompt.
// Operations the specs mark x-helper are client-library helpers (waiting, batching, generating a secured key on the
// caller's side, setting the client's key), not endpoints, so they are removed rather than sent to Algolia with the
// key. Every spec has `setClientApiKey`.
const helpers = (operations: [path: string, method: string][]) =>
  [["/setClientApiKey", "get"] as [string, string], ...operations].map(([path, method]) => ({
    op: "remove" as const,
    path: `/paths/${path.replaceAll("/", "~1")}/${method}`,
  }));

export const searchOptions = {
  ...api("search", "https://algolia_application_id.algolia.net", {
  searchSingleIndex: "query",
  search: "query",
  searchForFacetValues: "query",
  browse: "query",
  getObjects: "query",
  searchSynonyms: "query",
  searchRules: "query",
  searchDictionaryEntries: "query",
  searchUserIds: "query",
  }),
  patches: helpers([
    ["/waitForApiKey", "get"], ["/waitForTask", "get"], ["/waitForAppTask", "get"], ["/browseObjects", "get"],
    ["/generateSecuredApiKey", "get"], ["/accountCopyIndex", "get"], ["/replaceAllObjects", "get"],
    ["/replaceAllObjectsWithTransformation", "get"], ["/chunkedBatch", "get"], ["/saveObjects", "get"],
    ["/saveObjectsWithTransformation", "get"], ["/deleteObjects", "post"], ["/partialUpdateObjects", "post"],
    ["/partialUpdateObjectsWithTransformation", "post"], ["/indexExists", "get"],
  ]),
} satisfies OpenapiToolNamesOptions;
export const recommendOptions = {
  ...api("recommend", "https://algolia_application_id.algolia.net", {
    getRecommendations: "query",
    searchRecommendRules: "query",
  }),
  patches: helpers([]),
} satisfies OpenapiToolNamesOptions;
export const analyticsOptions = {
  ...api("analytics", "https://analytics.algolia.com", {
    queryPatternsTimeseries: "query",
    queryPatternsScalar: "query",
    queryPatternsTable: "query",
    queryPatternsDistribution: "query",
  }),
  patches: helpers([]),
} satisfies OpenapiToolNamesOptions;
export const abtestingOptions = {
  ...api("abtesting", "https://analytics.algolia.com", { estimateABTest: "query" }),
  patches: helpers([]),
} satisfies OpenapiToolNamesOptions;
export const insightsOptions = { ...api("insights", "https://insights.algolia.io", {}), patches: helpers([]) } satisfies OpenapiToolNamesOptions;
// Monitoring's status, incidents, latency, indexing and reachability are public (`security: []`). Its server
// inventory lists the application ID and the API key as alternatives, but needs both.
export const monitoringOptions = {
  ...api("monitoring", "https://status.algolia.com", {}),
  patches: [
    ...helpers([]),
    { op: "add", path: "/paths/~11~1inventory~1servers/get/security", value: [{ appId: [], apiKey: [] }] },
  ],
} satisfies OpenapiToolNamesOptions;
export const ingestionOptions = {
  ...api("ingestion", "https://data.us.algolia.com", {
  searchAuthentications: "query",
  searchDestinations: "query",
  searchSources: "query",
  searchTasks: "query",
  searchTasksV1: "query",
  searchTransformations: "query",
  validateSource: "query",
  validateSourceBeforeUpdate: "query",
  tryTransformation: "query",
  tryTransformationBeforeUpdate: "query",
  }),
  patches: helpers([["/chunkedPush", "get"]]),
} satisfies OpenapiToolNamesOptions;
export const personalizationOptions = {
  ...api("personalization", "https://personalization.us.algolia.com", {}),
  patches: helpers([]),
} satisfies OpenapiToolNamesOptions;
export const querySuggestionsOptions = {
  ...api("query-suggestions", "https://query-suggestions.us.algolia.com", {}),
  patches: helpers([]),
} satisfies OpenapiToolNamesOptions;

// Every API by its router key.
export const apis = {
  search: searchOptions,
  recommend: recommendOptions,
  analytics: analyticsOptions,
  abtesting: abtestingOptions,
  insights: insightsOptions,
  monitoring: monitoringOptions,
  ingestion: ingestionOptions,
  personalization: personalizationOptions,
  querySuggestions: querySuggestionsOptions,
} as const;

// scripts/tools.ts reads `options`; the Search API is the main one.
export const options = searchOptions;

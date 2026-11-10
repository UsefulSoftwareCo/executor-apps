import type { OpenapiToolNamesOptions } from "apps/openapi";

// ZoomInfo's official OpenAPI documents, listed at https://docs.zoominfo.com/openapi.md (the files now live on docs.gtm.ai). One product, eight specs:
// index.ts mounts each under its own key. Every operation names an `OAuth2Auth` scheme whose flow URLs are the
// Okta ones; the real endpoints are declared on the provider, and the token is sent as a bearer token.
const spec = (name: string) => ({ url: `https://docs.gtm.ai/openapi/openapi-${name}-v1.yaml` });

const credentials = {
  allowedOrigin: "https://api.zoominfo.com",
  securitySchemes: { OAuth2Auth: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "OAuth2Auth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

const api = (name: string, kinds: Record<string, "query" | "mutation"> = {}) =>
  ({ source: spec(name), ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

// POST operations that only read data (criteria travel in the body) are queries, so they run without an approval prompt.
export const dataOptions = api("data", {
  SearchInterface_searchContact: "query",
  SearchInterface_searchCompany: "query",
  SearchInterface_searchIntent: "query",
  SearchInterface_searchNews: "query",
  SearchInterface_searchScoop: "query",
});
export const copilotOptions = api("copilot", {
  AccountSummaryInterface_askAccountSummaryQuestion: "query",
  InsightsInterface_getCompanyInsightsByType: "query",
});
export const agentOptions = api("agent");
export const gtmStudioOptions = api("gtm-studio", { Rows_listRows: "query" });
export const dataQualityOptions = api("data-quality");
export const marketingOptions = api("marketing");
export const platformOptions = api("platform");
export const verticalDatasetsOptions = api("vertical-datasets", {
  FinancialFilingsInterface_searchFinancialFiling: "query",
  JobPostsInterface_searchJobPost: "query",
  LoanStatementsInterface_searchLoanStatement: "query",
  ProductReviewsInterface_searchProductReview: "query",
});

export const apis = {
  data: dataOptions,
  copilot: copilotOptions,
  agent: agentOptions,
  gtmStudio: gtmStudioOptions,
  dataQuality: dataQualityOptions,
  marketing: marketingOptions,
  platform: platformOptions,
  verticalDatasets: verticalDatasetsOptions,
} as const;

// scripts/tools.ts reads `options`; the Data API is the main one.
export const options = dataOptions;

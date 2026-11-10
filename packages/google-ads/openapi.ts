// openapi.json is generated from Google's own Google Ads API v25 Discovery document (revision
// 20261008) by discovery-to-openapi.mjs; see README. Credentials go only to googleads.googleapis.com.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

// POST methods that only read, compute or suggest; marking them queries keeps them free of approvals.
const readOnlyPosts = [
  "customers.googleAds.search",
  "customers.googleAds.searchStream",
  "googleAdsFields.search",
  "geoTargetConstants.suggest",
  "keywordThemeConstants.suggest",
  "audienceInsights.listInsightsEligibleDates",
  "customers.generateTargetingSuggestionMetrics",
  "customers.suggestSmartCampaignAd",
  "customers.generateAudienceOverlapInsights",
  "customers.suggestBrands",
  "customers.searchAudienceInsightsAttributes",
  "customers.suggestKeywordThemes",
  "customers.generateTrendingInsights",
  "customers.generateKeywordHistoricalMetrics",
  "customers.generateKeywordForecastMetrics",
  "customers.generateInsightsFinderReport",
  "customers.generateKeywordIdeas",
  "customers.suggestTravelAssets",
  "customers.generateAudienceCompositionInsights",
  "customers.generateReachForecast",
  "customers.generateAdGroupThemes",
  "customers.suggestSmartCampaignBudgetOptions",
  "customers.generateAudienceDefinition",
  "customers.generateCreatorInsights",
  "customers.generateBenchmarksMetrics",
  "customers.generateSuggestedTargetingInsights",
  "customers.reservations.quoteCampaigns",
  "customers.recommendations.generate",
  "customers.operations.wait",
  "listBenchmarksProducts",
  "listBenchmarksSources",
  "generateConversionRates",
  "listBenchmarksAvailableDates",
  "listPlannableProducts",
  "listBenchmarksLocations",
  "listPlannableUserLists",
  "listPlannableUserInterests",
  "listPlannableLocations",
].map((id) => `googleads.${id}`);

export const options = {
  source: { document: widen(document) },
  allowedOrigin: "https://googleads.googleapis.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
  kinds: Object.fromEntries(readOnlyPosts.map((id) => [id, "query" as const])),
} satisfies OpenapiToolNamesOptions;

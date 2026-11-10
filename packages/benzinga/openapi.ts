import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Benzinga product, many official OpenAPI documents from https://github.com/Benzinga/doc-site-mintlify/tree/main/openapi
// (the source of docs.benzinga.com). index.ts mounts each under its own key. Every API lives on api.benzinga.com
// and takes the API key as a `token` query parameter (Movers uses `apikey`). Not mounted: the WebSocket specs,
// the deprecated Fundamentals v2, the v1 duplicates of Delayed Quote and Logos, Calendar v2.2 (only dividends,
// already in Calendar) and the FXStreet calendar (different host, separate licence).
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/Benzinga/doc-site-mintlify/main/openapi/${name}`,
});

const api = (file: string, scheme = "token", param = "token") =>
  ({
    source: spec(file),
    allowedOrigin: "https://api.benzinga.com",
    securitySchemes: { [scheme]: { type: "apiKey", in: "query", name: param } },
    // The document declares no security; send the account's credential on every operation.
    fallbackSecurity: [{ [scheme]: [] }],
    methods: { apiKey: [{ scheme, field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  news: api("newsfeed-v2.yaml"),
  calendar: api("calendar-v2.yml"),
  consensusRatings: api("consensus-ratings.yaml"),
  analystInsights: api("analyst-insights.yaml", "ApiKeyAuth"),
  bullBear: api("bull-bear.yml", "ApiKeyAuth"),
  transcripts: api("conference-call-transcripts.yaml", "ApiKeyAuth"),
  bars: api("bars-v2.yml"),
  quotes: api("delayed-quote-v2.yml"),
  fundamentals: api("fundamentals-v2.1.yaml"),
  fundamentalsV4: api("fundamentals-v4.yml"),
  governmentTrades: api("government-trades.yml"),
  logos: api("logos-v2.yml"),
  movers: api("movers-v1.yml", "token", "apikey"),
  secFilings: api("sec-v1.yml"),
  shortInterest: api("short-interest.yml"),
  signals: api("signals-v1.yml"),
  tickerTrends: api("ticker_trends.yaml", "ApiKeyAuth"),
  wiims: api("wiims.yml"),
} as const;

// scripts/tools.ts reads `options`; the News API is the main one.
export const options = apis.news;

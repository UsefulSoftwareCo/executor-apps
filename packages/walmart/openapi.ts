import type { OpenapiToolNamesOptions } from "apps/openapi";

// Walmart publishes each Marketplace API as its own OpenAPI 3.0 document, served from the registry behind
// https://developer.walmart.com (a ReadMe site). index.ts mounts each under its own key; all share one origin.
const spec = (id: string) => ({ url: `https://dash.readme.com/api/v1/api-registry/${id}` });

export const origin = "https://marketplace.walmartapis.com";

// Several documents reference security schemes they never define. The access token is minted from the account's
// client credentials in index.ts and set as the WM_SEC.ACCESS_TOKEN header on every request, so the same header
// scheme is declared under every name the documents use.
const credentials = {
  securitySchemes: {
    accessToken: { type: "apiKey", in: "header", name: "WM_SEC.ACCESS_TOKEN" },
    basicScheme: { type: "apiKey", in: "header", name: "WM_SEC.ACCESS_TOKEN" },
    basicAuth: { type: "apiKey", in: "header", name: "WM_SEC.ACCESS_TOKEN" },
  },
  fallbackSecurity: [{ accessToken: [] }],
  methods: {
    clientCredentials: [
      { scheme: "accessToken", field: "clientSecret", part: "value", prefix: "" },
      { scheme: "basicScheme", field: "clientSecret", part: "value", prefix: "" },
      { scheme: "basicAuth", field: "clientSecret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const api = (id: string) =>
  ({ source: spec(id), allowedOrigin: origin, baseUrl: origin, ...credentials }) satisfies OpenapiToolNamesOptions;

export const apis = {
  items: api("206d9amt1yl57f"),
  inventory: api("22eckdhmr9igu74"),
  prices: api("24eowrby0mtsuwlbr"),
  promotions: api("4adnhtkmtsuxvmx"),
  orders: api("eve6m6s1g8mubwwx8k"),
  returns: api("16fdhuump2rm1l6"),
  fulfillment: api("zj2038umthl3jiq"),
  feeds: api("1ll8566gmsf4pry5"),
  reports: api("1q03omugzpigk"),
  settings: api("1hmzcklmshvsx6g"),
  simplifiedShipping: api("1ll856cvmsf1yqr4"),
  notifications: api("9r21x31mqtwfz9u"),
  insights: api("d7xjqfjmsi2tzdi"),
  assortmentRecommendations: api("13foynfmmobukfmi"),
  recommendations: api("er71zz33pmr9ig743"),
  disputes: api("8p3xm33mj3exh1b"),
  claims: api("79bqa2jmfedtkpg"),
  lagTime: api("1zzm8322midmdp55"),
  reviews: api("1dyxmsvmruw59jp"),
  shipWithWalmart: api("353bb13mt23xk0r"),
  utilities: api("2pmj1rmfee8qqv"),
  payments: api("2ey1umu35ckzn"),
  paymentReports: api("a5jqmuztf03w"),
} satisfies Record<string, OpenapiToolNamesOptions>;

// scripts/tools.ts reads `options`; check every API through the first and the rest in turn.
export const options = apis.items;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pinned to commit 733b5254fa360097509aab25d2492976d1748d81 so tool counts do not drift; bump deliberately.
// InfluxData's official InfluxDB Cloud (TSM) contract from github.com/influxdata/openapi. Its server URL is
// the relative "/api/v2"; every account lives on its own region host, so index.ts points calls at the
// account's cluster URL.
export const placeholderOrigin = "https://us-east-1-1.aws.cloud2.influxdata.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/influxdata/openapi/733b5254fa360097509aab25d2492976d1748d81/contracts/cloud.yml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v2`,
  securitySchemes: { TokenAuthentication: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    apiKey: [{ scheme: "TokenAuthentication", field: "token", part: "value", prefix: "Token " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

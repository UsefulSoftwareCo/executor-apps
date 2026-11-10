import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/communitiesuk/epb-data-warehouse/main/api/api.yml" },
  allowedOrigin: "https://api.get-energy-performance-data.communities.gov.uk",
  securitySchemes: { bearerToken: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// AccuLynx hosts its V2 document through its ReadMe developer hub (apidocs.acculynx.com).
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/zzgkl93pmu2v5bs2" },
  allowedOrigin: "https://api.acculynx.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

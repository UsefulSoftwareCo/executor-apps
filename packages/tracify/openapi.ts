import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://tracify-api.tracify.ai/analytics/api/v1/openapi.json" },
  baseUrl: "https://tracify-api.tracify.ai",
  allowedOrigin: "https://tracify-api.tracify.ai",
  securitySchemes: {
    OrgApiTokenAuth: { type: "apiKey", name: "tracify-token", in: "header" },
  },
  methods: { apiKey: [{ scheme: "OrgApiTokenAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

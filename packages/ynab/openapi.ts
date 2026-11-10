import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.ynab.com/papi/open_api_spec.yaml" },
  allowedOrigin: "https://api.ynab.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// DualEntry's v2 document declares no security scheme, so one is supplied here and applied globally.
export const options = {
  source: { url: "https://api.dualentry.com/public/v2/openapi.json" },
  allowedOrigin: "https://api.dualentry.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  patches: [{ op: "add", path: "/security", value: [{ ApiKey: [] }] }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;

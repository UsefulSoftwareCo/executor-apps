import type { OpenapiToolNamesOptions } from "apps/openapi";
import { patches } from "./patches.ts";

// PagerDuty's official REST API v2 description. API keys are sent as `Token token=<key>`;
// OAuth access tokens are sent as bearer tokens.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/PagerDuty/api-schema/main/reference/REST/openapiv3.json",
  },
  patches,
  allowedOrigin: "https://api.pagerduty.com",
  securitySchemes: {
    api_key: { type: "apiKey", in: "header", name: "Authorization" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ api_key: [] }],
  methods: {
    apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "Token token=" }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

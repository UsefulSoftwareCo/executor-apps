import type { OpenapiToolNamesOptions } from "apps/openapi";

// Deel's own OpenAPI 3.0.1 definitions endpoint (linked from developer.deel.com). Its servers are
// https://api.letsdeel.com/rest (production) and the demo sandbox; accounts use production.
export const options = {
  source: { url: "https://api.letsdeel.com/openapi/rest/definitions" },
  allowedOrigin: "https://api.letsdeel.com",
  baseUrl: "https://api.letsdeel.com/rest",
  securitySchemes: {
    deelToken: { type: "http", scheme: "bearer" },
  },
  methods: {
    token: [{ scheme: "deelToken", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

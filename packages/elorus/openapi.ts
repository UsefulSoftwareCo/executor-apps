import type { OpenapiToolNamesOptions } from "apps/openapi";

// Elorus's official Swagger 2.0 document (linked from developer.elorus.com, API v1.2). Its URL
// carries a content hash, so it changes when Elorus republishes the spec. Every operation takes
// a required X-Elorus-Organization header; index.ts fills it from the account.
export const options = {
  source: {
    url: "https://developer.elorus.com/json/elorus_api_US_v1.2.52e51ba03d952000d7e231818ad4bfefaa968da4f3a7521dda374ada71335536.json",
  },
  allowedOrigin: "https://api.elorus.com",
  securitySchemes: { "API key": { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "API key", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

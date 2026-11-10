import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json merges the 202 official per-operation files in yml_files/ of github.com/tiktok/tiktok-business-api-sdk
// (commit f809c396520df2d7b201a9ccc5378d822b728ed3) by generate-openapi.py. The access token is sent in the
// Access-Token header, which the official files declare as a query parameter on every operation.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://business-api.tiktok.com",
  baseUrl: "https://business-api.tiktok.com/open_api/v1.3",
  securitySchemes: { accessToken: { type: "apiKey", name: "Access-Token", in: "header" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ accessToken: [] }],
  methods: { accessToken: [{ scheme: "accessToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // POST operations that only look things up.
  kinds: { toolTargetingSearch: "query" },
} satisfies OpenapiToolNamesOptions;

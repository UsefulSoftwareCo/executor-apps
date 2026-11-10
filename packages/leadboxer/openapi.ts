import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// LeadBoxer publishes one OpenAPI definition per endpoint page; spec.ts merges them.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.leadboxer.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // GET /v1/users/{userId}/invite/resend sends an email; classify it as a mutation so it needs approval.
  kinds: { resendInvite: "mutation" },
} satisfies OpenapiToolNamesOptions;

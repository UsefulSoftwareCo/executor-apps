import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi-document.json" with { type: "json" };

// Leiga publishes its reference as one OpenAPI fragment per endpoint on Apidog
// (https://share.apidog.com/5a741107-c211-410f-880c-048d1917c984). openapi-document.json merges
// those fragments unchanged except for moving the `accessToken` header into a security scheme.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://app.leiga.com",
  securitySchemes: { accessToken: { type: "apiKey", in: "header", name: "accessToken" } },
  methods: { apiKey: [{ scheme: "accessToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

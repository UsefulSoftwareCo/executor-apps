import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

/** Official Discovery conversion, excluding script execution and its script-specific scopes. */
export const options = {
  // SAFETY: generated OpenAPI is compiled by scripts/tools.ts before publication.
  source: { document: document as never },
  allowedOrigin: "https://script.googleapis.com",
  securitySchemes: { Oauth2: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "Oauth2", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

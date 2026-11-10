import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Rydoo's official API reference (https://developers.rydoo.com/reference) embeds one OpenAPI 3.0 fragment per
// endpoint; spec.ts merges them into a single document. The access token comes from the client credentials grant
// (see index.ts), and the API takes it as a bearer token.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.rydoo.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearer: [] }],
  methods: { oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

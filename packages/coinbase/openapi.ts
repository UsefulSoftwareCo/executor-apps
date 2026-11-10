import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Coinbase's official Advanced Trade OpenAPI document
// (https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/advanced-trade-spec.yaml)
// converted to JSON, with the duplicate text/event-stream response variants removed because
// a tool cannot return a stream. Operations that accept only an API-key JWT are left out.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.coinbase.com",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

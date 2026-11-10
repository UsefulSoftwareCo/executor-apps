import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is Breezy's own OpenAPI 3.1 definition. developer.breezy.hr publishes it only as one
// fragment per endpoint page (each page embeds the definition for its operation), so the fragments
// are merged unchanged into this single document: paths and component schemas are combined and
// nothing else is edited.
// GET /signout invalidates the session token, so it is gated as a mutation.
const kinds: Record<string, "query" | "mutation"> = { signout: "mutation" };

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.breezy.hr",
  securitySchemes: { TokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;

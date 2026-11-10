import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Benchmark Email publishes no OpenAPI document, only a Postman collection behind
// https://developer.benchmarkemail.com/. document.json is that official collection converted
// by generate-openapi.mjs (paths, methods and parameters; request bodies are open objects).
// This GET sends a confirmation email to an address, so it is gated as a mutation.
const kinds: Record<string, "query" | "mutation"> = {
  userAccountSettingsResendConfirmEmail: "mutation",
};

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://clientapi.benchmarkemail.com",
  securitySchemes: { AuthToken: { type: "apiKey", name: "AuthToken", in: "header" } },
  methods: { apiKey: [{ scheme: "AuthToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;

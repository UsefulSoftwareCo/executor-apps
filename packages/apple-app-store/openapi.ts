import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

type Document = Extract<OpenapiToolNamesOptions["source"], { document: unknown }>["document"];

// Apple's App Store Connect OpenAPI document, which Apple publishes only as a zip
// (developer.apple.com/sample-code/app-store-connect). scripts/vendor-openapi.ts unpacks it into
// openapi.json and records the source in info.x-executor-source.
export const options = {
  source: { document: document as unknown as Document },
  allowedOrigin: "https://api.appstoreconnect.apple.com",
  securitySchemes: { "itc-bearer-token": { type: "http", scheme: "bearer" } },
  // The bearer token is an ES256 JWT minted from the private key in index.ts, which replaces
  // the Authorization header on every request. The binding only marks the operations as usable.
  // It names the single-line key ID: a .p8 private key spans several lines, which no header can
  // carry, so binding it failed every call before the JWT replaced it.
  methods: { apiKey: [{ scheme: "itc-bearer-token", field: "keyId", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Apple publishes the App Store Connect OpenAPI document only as a zip
// (developer.apple.com/sample-code/app-store-connect). This is a community repository that
// tracks that zip automatically; the content is Apple's document, reformatted.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/EvanBacon/App-Store-Connect-OpenAPI-Spec/main/specs/latest.json",
  },
  allowedOrigin: "https://api.appstoreconnect.apple.com",
  securitySchemes: { "itc-bearer-token": { type: "http", scheme: "bearer" } },
  // The bearer token is an ES256 JWT minted from the private key in index.ts, which replaces
  // the Authorization header on every request. The binding only marks the operations as usable.
  methods: { apiKey: [{ scheme: "itc-bearer-token", field: "privateKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

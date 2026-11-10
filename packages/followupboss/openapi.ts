import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Follow Up Boss serves one OpenAPI definition per endpoint on docs.followupboss.com/reference/<endpoint>
// and publishes no combined file, so document.json is those definitions merged. The X-System and
// X-System-Key header parameters (partner registration headers) are dropped, three malformed paths
// are corrected, and path parameters the definitions leave undeclared are added.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.followupboss.com",
  securitySchemes: { sec0: { type: "http", scheme: "basic" } },
  // The API key is the Basic username; the password stays empty.
  methods: { apiKey: [{ scheme: "sec0", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

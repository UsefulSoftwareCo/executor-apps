import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is AWeber's official REST description (https://api.aweber.com/swagger.yaml) with its relative
// $ref files bundled into one file by generate-openapi.py. The OAuth endpoints themselves are not tools.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.aweber.com",
  // Operations require the document's "OAuth 2.0" scheme. The restOauth account's access token is bound to it
  // through methods, which fill a string value, so the scheme is declared as the bearer token it is sent as.
  securitySchemes: { "OAuth 2.0": { type: "http", scheme: "bearer" } },
  // Five operations declare no security; send the account's credential on them too.
  fallbackSecurity: [{ "OAuth 2.0": [] }],
  methods: { restOauth: [{ scheme: "OAuth 2.0", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1oauth~1request_token" },
    { op: "remove", path: "/paths/~1oauth~1access_token" },
    { op: "remove", path: "/paths/~1oauth2~1token" },
    { op: "remove", path: "/paths/~1oauth2~1revoke" },
  ],
} satisfies OpenapiToolNamesOptions;

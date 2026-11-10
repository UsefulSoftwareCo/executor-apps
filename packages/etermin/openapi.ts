import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares no security scheme and lists a SwaggerHub mock server, so the real origin
// and the `publickey` header are supplied here. `salt` and `signature` are added per request by
// the signing fetch in index.ts.
export const options = {
  source: { url: "https://api.swaggerhub.com/apis/etermin.net/eTermin-API/1.0.0" },
  allowedOrigin: "https://www.etermin.net",
  baseUrl: "https://www.etermin.net",
  securitySchemes: { publicKey: { type: "apiKey", in: "header", name: "publickey" } },
  fallbackSecurity: [{ publicKey: [] }],
  methods: { apiKey: [{ scheme: "publicKey", field: "publicKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

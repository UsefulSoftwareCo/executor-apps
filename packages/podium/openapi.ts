import type { OpenapiToolNamesOptions } from "apps/openapi";
import podiumDocument from "./podium.json" with { type: "json" };

// Podium publishes no downloadable OpenAPI file: its ReadMe developer docs embed one document per operation.
// podium.json is those official per-operation documents (https://docs.podium.com/reference, version 2021.4.1)
// merged into one, with no other change. The documents declare no security scheme; every operation takes
// the OAuth bearer token.
export const options = {
  source: { document: podiumDocument as never },
  allowedOrigin: "https://api.podium.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

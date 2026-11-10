import type { OpenapiToolNamesOptions } from "apps/openapi";

// APIs.guru hosts a third-party copy of STROMDAO's OpenAPI document (origin corrently.io/dist.yaml,
// now unreachable). The document declares no security scheme; the API accepts the access token as a bearer
// header (or a `token` query parameter), so a bearer scheme is injected for every operation.
export const options = {
  source: { url: "https://api.apis.guru/v2/specs/corrently.io/2.0.0/openapi.json" },
  allowedOrigin: "https://api.corrently.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

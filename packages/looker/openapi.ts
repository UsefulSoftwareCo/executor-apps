import type { OpenapiToolNamesOptions } from "apps/openapi";

// Looker's official API 4.0 OpenAPI 3.0 document, published by Google in looker-open-source/sdk-codegen.
// Its only server is a placeholder (https://localhost:20000/api/4.0), so index.ts pins each account's own
// instance. The document declares no security schemes; every operation takes the login access token.
export const placeholderOrigin = "https://instance.looker.com";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/looker-open-source/sdk-codegen/main/spec/Looker.4.0.oas.json",
  },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/4.0`,
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    apiCredentials: [{ scheme: "bearer", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

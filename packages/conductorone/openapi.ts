import type { OpenapiToolNamesOptions } from "apps/openapi";

// ConductorOne's official C1 API OpenAPI 3.1 document, the source of its SDKs (see
// ConductorOne/conductorone-sdk-typescript .speakeasy/workflow.yaml). Its only server is
// https://{tenantDomain}.conductor.one and paths already include /api/v1, so index.ts pins each account's own tenant.
export const placeholderOrigin = "https://example.conductor.one";

export const options = {
  source: { url: "https://insulator.conductor.one/api/v1/openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares bearerAuth and an oauth2 client-credentials scheme whose token URL is relative to the
  // tenant. The global security requirement needs both schemes together. The token is minted in index.ts, so both are filled as bearer headers.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" }, oauth: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [
      { scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" },
      { scheme: "oauth", field: "clientSecret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

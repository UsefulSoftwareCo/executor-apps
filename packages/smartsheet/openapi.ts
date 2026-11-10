import type { OpenapiToolNamesOptions } from "apps/openapi";

// Smartsheet's reference lists three regional servers (.com, .eu, .au); credentials go to the .com one.
export const options = {
  source: { url: "https://developers.smartsheet.com/_spec/api/smartsheet/openapi.yaml" },
  allowedOrigin: "https://api.smartsheet.com",
  securitySchemes: {
    APIToken: { type: "http", scheme: "bearer" },
    OAuth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://app.smartsheet.com/b/authorize",
          tokenUrl: "https://api.smartsheet.com/2.0/token",
          scopes: {},
        },
      },
    },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ APIToken: [] }, { OAuth2: [] }] as Record<string, string[]>[],
  methods: { token: [{ scheme: "APIToken", field: "token", part: "value", prefix: "" }] },
  oauth: ["OAuth2"],
  // Public operations keep no security (catalog/status/smartsheet.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1token/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

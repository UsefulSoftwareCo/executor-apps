import type { OpenapiToolNamesOptions } from "apps/openapi";

// Openlayer's backend document is served by the API itself. Its `servers` entry is the relative
// `/v1`, so the base URL is pinned. Only the `apiKey` scheme is mapped to the key: the spec's
// `bearerAuth` is a separate session-JWT scheme and nothing documents that it accepts API keys.
// Login, MFA, token, SSO, cli-auth, OAuth2 server and password-reset paths are removed.
export const options = {
  source: { url: "https://api.openlayer.com/v1/openapi.json" },
  allowedOrigin: "https://api.openlayer.com",
  baseUrl: "https://api.openlayer.com/v1",
  securitySchemes: {
    apiKey: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1auth~1login" },
    { op: "remove", path: "/paths/~1auth~1login~1refresh" },
    { op: "remove", path: "/paths/~1auth~1mfa~1backup-codes~1regenerate" },
    { op: "remove", path: "/paths/~1auth~1mfa~1totp~1challenge" },
    { op: "remove", path: "/paths/~1auth~1mfa~1totp~1disable" },
    { op: "remove", path: "/paths/~1auth~1mfa~1totp~1enroll" },
    { op: "remove", path: "/paths/~1auth~1mfa~1totp~1verify" },
    { op: "remove", path: "/paths/~1auth~1saml-sso" },
    { op: "remove", path: "/paths/~1auth~1saml-sso~1callback" },
    { op: "remove", path: "/paths/~1cli-auth~1config" },
    { op: "remove", path: "/paths/~1cli-auth~1sessions" },
    { op: "remove", path: "/paths/~1cli-auth~1sessions~1{session_id}" },
    { op: "remove", path: "/paths/~1cli-auth~1sessions~1{session_id}~1approve" },
    { op: "remove", path: "/paths/~1me~1password-reset" },
    { op: "remove", path: "/paths/~1me~1password-reset-link" },
    { op: "remove", path: "/paths/~1oauth2~1authorize" },
    { op: "remove", path: "/paths/~1oauth2~1authorize~1context" },
    { op: "remove", path: "/paths/~1oauth2~1connections" },
    { op: "remove", path: "/paths/~1oauth2~1connections~1{connectionId}" },
    { op: "remove", path: "/paths/~1oauth2~1jwks" },
    { op: "remove", path: "/paths/~1oauth2~1register" },
    { op: "remove", path: "/paths/~1oauth2~1token" },
    { op: "remove", path: "/paths/~1oauth2~1userinfo" },
    { op: "remove", path: "/paths/~1tokens~1auth" },
    { op: "remove", path: "/paths/~1tokens~1refresh" },
  ],
} satisfies OpenapiToolNamesOptions;

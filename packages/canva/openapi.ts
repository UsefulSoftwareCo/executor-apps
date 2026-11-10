import type { OpenapiToolNamesOptions } from "apps/openapi";

// OAuth and OIDC plumbing is not a Canva resource: the host runs the token exchange itself, revoking
// would kill the connected token, and userinfo needs openid/profile/email scopes this package does not request.
const patches = [
  "/paths/~1v1~1oauth~1token",
  "/paths/~1v1~1oauth~1introspect",
  "/paths/~1v1~1oauth~1revoke",
  "/paths/~1v1~1apps~1{appId}~1jwks",
  "/paths/~1v1~1connect~1keys",
  "/paths/~1v1~1oidc~1jwks",
  "/paths/~1v1~1oidc~1userinfo",
].map((path) => ({ op: "remove", path })) as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// Canva's own OpenAPI document. Every operation names its `oauthAuthCode` scheme; the access token
// is sent as a bearer token, so the scheme is declared as http bearer.
export const options = {
  source: { url: "https://www.canva.dev/sources/connect/api/latest/api.yml" },
  allowedOrigin: "https://api.canva.com",
  securitySchemes: { oauthAuthCode: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "oauthAuthCode", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

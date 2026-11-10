import type { OpenapiToolNamesOptions } from "apps/openapi";

// Docker's official Docker Hub API document. Bearer JWTs come from the access-token exchange
// in index.ts, which sets the Authorization header itself.
// The token-minting operations (/v2/auth/token, /v2/users/login, /v2/users/2fa-login) are removed: the
// account-level exchange in index.ts is the only auth path, and the agent must not mint tokens.
const patches = [
  { op: "remove", path: "/paths/~1v2~1auth~1token" },
  { op: "remove", path: "/paths/~1v2~1users~1login" },
  { op: "remove", path: "/paths/~1v2~1users~12fa-login" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  patches,
  source: { url: "https://docs.docker.com/reference/api/hub/latest.yaml" },
  allowedOrigin: "https://hub.docker.com",
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    bearerSCIMAuth: { type: "http", scheme: "bearer" },
    scimToken: { type: "http", scheme: "bearer" },
  },
  // The binding only makes operations callable; index.ts replaces the header with the exchanged JWT.
  methods: { accessToken: [{ scheme: "bearerAuth", field: "secret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

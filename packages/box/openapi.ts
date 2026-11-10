import type { OpenapiToolNamesOptions } from "apps/openapi";

// Box's official description declares an OAuth2 scheme; both a developer token and an
// OAuth access token are sent as a bearer token, so we declare a plain bearer scheme.
// The OAuth token and revoke endpoints declare `security: []`; they are not account API operations
// and would let an agent submit client secrets or revoke tokens, so they are removed.
const patches = [
  { op: "remove", path: "/paths/~1oauth2~1token" },
  { op: "remove", path: "/paths/~1oauth2~1revoke" },
] as const;

export const options = {
  source: { url: "https://raw.githubusercontent.com/box/box-openapi/5b055e333a802b10b8ca90fcc513643836dd92b4/openapi.json" },
  allowedOrigin: "https://api.box.com",
  securitySchemes: { OAuth2Security: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "OAuth2Security", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "OAuth2Security", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Supabase's Management API document declares a `bearer` scheme (personal access token or
// OAuth access token) on every authenticated operation.
export const options = {
  source: { url: "https://api.supabase.com/api/v1-json" },
  allowedOrigin: "https://api.supabase.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  // GET /v1/projects/{ref}/config/database/pgbouncer declares no security but needs the bearer token.
  fallbackSecurity: [{ bearer: [] }],
  // OAuth protocol endpoints, not API operations: never expose them as tools or send them the bearer token.
  patches: [
    { op: "remove", path: "/paths/~1v1~1oauth~1authorize" },
    { op: "remove", path: "/paths/~1v1~1oauth~1token" },
    { op: "remove", path: "/paths/~1v1~1oauth~1revoke" },
  ],
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

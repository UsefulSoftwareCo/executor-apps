import type { OpenapiToolNamesOptions } from "apps/openapi";

// Raisely's own API reference is hosted on ReadMe; this is the registry entry behind it.
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/22eckcdmr9pu3rj" },
  allowedOrigin: "https://api.raisely.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document's top-level `security: [{}, { BearerAuth: [] }]` lists no authentication first, and Executor
  // uses the first alternative an account can meet, so the token was never sent; every operation needs it.
  patches: [
    { op: "add", path: "/security", value: [{ BearerAuth: [] }] },
    // Public operations keep no security (catalog/status/raisely.json "credentialFree" says why).
    { op: "add", path: "/paths/~1login/post/security", value: [] },
    { op: "add", path: "/paths/~1signup/post/security", value: [] },
    { op: "add", path: "/paths/~1users~1magic-link/post/security", value: [] },
    { op: "add", path: "/paths/~1check-user/post/security", value: [] },
    { op: "add", path: "/paths/~1api-docs/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

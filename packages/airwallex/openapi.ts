import type { OpenapiToolNamesOptions } from "apps/openapi";

// Airwallex's official OpenAPI 3.1 document (MIT), pinned to the 2026-08-21 API version folder.
// The document lists production and sandbox servers; tools go to production only.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/airwallex/airwallex-openapi/main/openapi/client-api/2026-08-21/airwallex-openapi-2026-08-21.json",
  },
  allowedOrigin: "https://api.airwallex.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  // The bearer token comes from the login exchange in index.ts, which sends it itself.
  methods: {},
  oauth: [],
  patches: [{ op: "add", path: "/security", value: [] }],
} satisfies OpenapiToolNamesOptions;

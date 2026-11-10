import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document's only server is the template https://{defaultHost} (default gotable.app), and its paths already
// start with /api/v1, so the base URL is the bare origin.
export const options = {
  source: { url: "https://en.gotable.app/api/docs/v1/swagger.yaml" },
  allowedOrigin: "https://gotable.app",
  baseUrl: "https://gotable.app",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

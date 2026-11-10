import type { OpenapiToolNamesOptions } from "apps/openapi";

// Agentcard's official OpenAPI 3.1 document, served by its docs site. One base URL; sandbox vs production is decided by the
// client credential, not the host.
export const options = {
  source: { url: "https://docs.agentcard.sh/openapi.json" },
  allowedOrigin: "https://api.agentcard.sh",
  securitySchemes: { platformToken: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "platformToken", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

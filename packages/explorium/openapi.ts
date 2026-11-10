import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.explorium.ai/openapi.json" },
  allowedOrigin: "https://api.explorium.ai",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "api_key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Diagnostic endpoints (healthcheck, payload generator, version) are not business operations.
  patches: [
    { op: "remove", path: "/paths/~1healthcheck~1http" },
    { op: "remove", path: "/paths/~1healthcheck~1http_payload~1{response_bytes}" },
    { op: "remove", path: "/paths/~1version~1" },
  ],
} satisfies OpenapiToolNamesOptions;

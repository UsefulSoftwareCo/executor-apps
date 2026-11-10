import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official spec from e2b-dev/infra. Team API keys authenticate with the X-API-Key header.
export const options = {
  source: { url: "https://raw.githubusercontent.com/e2b-dev/infra/main/spec/openapi.yml" },
  allowedOrigin: "https://api.e2b.app",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

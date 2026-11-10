import type { OpenapiToolNamesOptions } from "apps/openapi";

// WorkOS's official spec at github.com/workos/openapi-spec. Production only; the staging server is ignored.
export const options = {
  source: { url: "https://raw.githubusercontent.com/workos/openapi-spec/main/spec/open-api-spec.yaml" },
  allowedOrigin: "https://api.workos.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

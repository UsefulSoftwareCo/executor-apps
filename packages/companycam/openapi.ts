import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/CompanyCam/openapi-spec/main/openapi.yaml" },
  allowedOrigin: "https://api.companycam.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { accessToken: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

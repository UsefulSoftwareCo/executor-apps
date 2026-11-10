import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://griptape-cloud-assets.s3.amazonaws.com/Griptape.openapi.yaml" },
  allowedOrigin: "https://cloud.griptape.ai",
  securitySchemes: { "smithy.api.httpBearerAuth": { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "smithy.api.httpBearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// TapClicks publishes its API 2.6.27 document in the public-api-documentation repository that its docs page loads.
export const options = {
  source: { url: "https://bitbucket.org/tapeng/public-api-documentation/raw/master/spec/swagger.yaml" },
  allowedOrigin: "https://api.tapclicks.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

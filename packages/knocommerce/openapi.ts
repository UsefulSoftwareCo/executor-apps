import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI document published by Kno Commerce (the source of https://developers.knocommerce.com/).
export const options = {
  source: { url: "https://kno-open-api-specs.nyc3.cdn.digitaloceanspaces.com/rest-api/latest/openapi.yaml" },
  allowedOrigin: "https://app-api.knocommerce.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

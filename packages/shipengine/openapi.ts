import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/ShipEngine/shipengine-openapi/master/openapi.yaml" },
  allowedOrigin: "https://api.shipengine.com",
  securitySchemes: { api_key: { type: "apiKey", name: "API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

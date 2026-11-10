import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://help.oncehub.com/developers/api/booking-calendars-api.yaml" },
  allowedOrigin: "https://api.oncehub.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

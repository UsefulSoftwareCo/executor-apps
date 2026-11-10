import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://openapi.chaserhq.com/docs/json" },
  allowedOrigin: "https://openapi.chaserhq.com",
  securitySchemes: { "Basic Authorization": { type: "http", scheme: "basic" } },
  // Basic auth with the organisation's API key as username and API secret as password.
  methods: {
    apiKey: [
      { scheme: "Basic Authorization", field: "apiKey", part: "username", prefix: "" },
      { scheme: "Basic Authorization", field: "apiSecret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

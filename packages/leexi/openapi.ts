import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://public-api.leexi.ai/v1/openapi.json" },
  allowedOrigin: "https://public-api.leexi.ai",
  // The document declares the scheme as an apiKey header carrying the whole "Basic ..." value;
  // the spec description uses HTTP Basic with the Key ID as username and Key Secret as password.
  securitySchemes: { sec0: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "sec0", field: "keyId", part: "username", prefix: "" },
      { scheme: "sec0", field: "keySecret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

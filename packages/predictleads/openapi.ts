import type { OpenapiToolNamesOptions } from "apps/openapi";

// The description declares three alternatives (key and token headers, basic, OAuth client
// credentials). Users supply the key and token pair, sent as the two headers.
export const specUrl = "https://docs.predictleads.com/schemas/open_api_schema.json";

export const options = {
  source: { url: specUrl },
  allowedOrigin: "https://predictleads.com",
  securitySchemes: {
    api_key: { type: "apiKey", in: "header", name: "X-API-KEY" },
    api_token: { type: "apiKey", in: "header", name: "X-API-TOKEN" },
  },
  methods: {
    apiKey: [
      { scheme: "api_key", field: "apiKey", part: "value", prefix: "" },
      { scheme: "api_token", field: "apiToken", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

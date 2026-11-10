import type { OpenapiToolNamesOptions } from "apps/openapi";

// ShipStation API v2 (docs.shipstation.com), authenticated with an `api-key` header.
export const options = {
  source: { url: "https://docs.shipstation.com/_bundle/apis/@shipstation-v2/openapi.yaml" },
  allowedOrigin: "https://api.shipstation.com",
  securitySchemes: { api_keys: { type: "apiKey", name: "api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "api_keys", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// ShipStation V1 API (legacy), HTTP Basic with the account's API key and secret.
export const v1Options = {
  source: { url: "https://docs.shipstation.com/_bundle/apis/@shipstation-v1/openapi.yaml" },
  allowedOrigin: "https://ssapi.shipstation.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    legacy: [
      { scheme: "basicAuth", field: "apiKey", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "apiSecret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

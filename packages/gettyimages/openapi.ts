import type { OpenapiToolNamesOptions } from "apps/openapi";

// Getty's official OpenAPI 3 document declares no servers; the API lives at api.gettyimages.com.
// Every request needs the Api-Key header; user-level operations also need a bearer access token.
export const options = {
  source: { url: "https://api.gettyimages.com/swagger/v3/swagger.json" },
  allowedOrigin: "https://api.gettyimages.com",
  baseUrl: "https://api.gettyimages.com",
  securitySchemes: {
    "Api-Key": { type: "apiKey", in: "header", name: "Api-Key" },
    OAuth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "Api-Key", field: "apiKey", part: "value", prefix: "" }],
    accessToken: [
      { scheme: "Api-Key", field: "apiKey", part: "value", prefix: "" },
      { scheme: "OAuth2", field: "accessToken", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

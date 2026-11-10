import type { OpenapiToolNamesOptions } from "apps/openapi";

// BoldSign's own Swagger document. It declares Bearer and X-API-KEY as apiKey header schemes.
export const options = {
  source: { url: "https://api.boldsign.com/swagger/v1/swagger.json" },
  allowedOrigin: "https://api.boldsign.com",
  securitySchemes: {
    Bearer: { type: "apiKey", in: "header", name: "Authorization" },
    "X-API-KEY": { type: "apiKey", in: "header", name: "X-API-KEY" },
  },
  methods: {
    apiKey: [{ scheme: "X-API-KEY", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "Bearer", field: "access_token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

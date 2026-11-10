import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.public.ninety.io/v1/swagger-json" },
  baseUrl: "https://api.public.ninety.io",
  allowedOrigin: "https://api.public.ninety.io",
  securitySchemes: { JWT: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "JWT", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

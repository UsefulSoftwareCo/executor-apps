import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.prisma.io/v1/doc" },
  baseUrl: "https://api.prisma.io",
  allowedOrigin: "https://api.prisma.io",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ Bearer: [] }],
  methods: {
    apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "Bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://connect.workpath.com/api/v3/openapi.json" },
  allowedOrigin: "https://connect.workpath.com",
  securitySchemes: { JWT: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "JWT", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

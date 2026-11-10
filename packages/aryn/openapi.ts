import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/aryn-ai/docs/88820f021de3113b87bcd9c24eeeef278fda589c/api-reference/endpoint/platform/openapi.json" },
  allowedOrigin: "https://api.aryn.ai",
  baseUrl: "https://api.aryn.ai",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

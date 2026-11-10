import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.fuseai.com/openapi.json" },
  allowedOrigin: "https://api.tryfuse.ai",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The API token is the Basic username; the password is empty.
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

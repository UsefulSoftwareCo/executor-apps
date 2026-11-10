import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.streak.com/api/openapi.json" },
  allowedOrigin: "https://api.streak.com",
  // The document names its scheme bearerAuth, but Streak authenticates with HTTP Basic:
  // the API key is the username and the password stays empty.
  securitySchemes: { bearerAuth: { type: "http", scheme: "basic" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

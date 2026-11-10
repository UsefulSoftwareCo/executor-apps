import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.moderationapi.com/openapi.json" },
  allowedOrigin: "https://api.moderationapi.com",
  securitySchemes: { Authorization: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Creates the project signing secret if none exists and returns it, so gate it as a mutation.
  kinds: { "webhooks-publicGetSecret": "mutation" },
} satisfies OpenapiToolNamesOptions;

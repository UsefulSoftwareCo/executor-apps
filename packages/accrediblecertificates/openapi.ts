import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/accredible/api-documentation/118808a8e01310e80d72910781396752e16aa421/openapi.json" },
  allowedOrigin: "https://api.accredible.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Token token=" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

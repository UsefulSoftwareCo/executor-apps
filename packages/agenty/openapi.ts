import type { OpenapiToolNamesOptions } from "apps/openapi";

// These GET operations change state (or expose credentials), so they are gated as mutations.
const kinds: Record<string, "query" | "mutation"> = {
  JobsController_stopJob: "mutation",
  ApiKeysController_apiKeyStatus: "mutation",
  ApiKeysController_resetApiKey: "mutation",
  ConnectionsController_connect: "mutation",
  ApiKeysController_downloadApiKey: "mutation",
};

export const options = {
  source: { url: "https://api.agenty.com/openapi.json" },
  allowedOrigin: "https://api.agenty.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;

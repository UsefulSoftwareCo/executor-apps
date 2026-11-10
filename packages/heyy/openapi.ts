import type { OpenapiToolNamesOptions } from "apps/openapi";

// The v3 document has no operationIds, so overrides are keyed by tool name. These POST
// /*/search operations only read (the filter goes in the body), so they are queries.
const kinds: Record<string, "query" | "mutation"> = {
  "teams.postSearch": "query",
  "apiWebhooks.postSearch": "query",
  "attributes.postSearch": "query",
  "automations.postSearch": "query",
  "campaigns.postSearch": "query",
  "channels.postSearch": "query",
  "chats.postSearch": "query",
  "contacts.postSearch": "query",
  "journeys.postSearch": "query",
  "labels.postSearch": "query",
  "messageTemplates.postSearch": "query",
};

export const options = {
  source: { url: "https://docs.heyy.io/api-reference/openapi-v3.json" },
  allowedOrigin: "https://api.heyy.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.theirstack.com/openapi.json" },
  allowedOrigin: "https://api.theirstack.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public GET endpoints that change state; the HTTP method alone would class them as queries.
  kinds: { unsubscribe_email_v0: "mutation", unsubscribe_saved_search_alert_v0: "mutation" },
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// GraphHopper's published document declares an `apiKey` scheme `key` in the query string.
export const options = {
  source: { url: "https://docs.graphhopper.com/_bundle/openapi.json" },
  allowedOrigin: "https://graphhopper.com",
  securitySchemes: { key: { type: "apiKey", in: "query", name: "key" } },
  methods: { apiKey: [{ scheme: "key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// RAWG's official Swagger 2.0 document declares no security scheme, though every request needs the
// `key` query parameter. The scheme is declared here and bound to the account's API key.
export const options = {
  source: { url: "https://api.rawg.io/docs/?format=openapi" },
  allowedOrigin: "https://api.rawg.io",
  securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  patches: [{ op: "add", path: "/security", value: [{ apiKey: [] }] }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;

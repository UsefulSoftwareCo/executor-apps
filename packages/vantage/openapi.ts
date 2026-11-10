import type { OpenapiToolNamesOptions } from "apps/openapi";

// Vantage's document declares an oauth2 clientCredentials scheme whose token URL is a console page;
// in practice every operation takes a bearer API token, so the scheme of that name is overridden.
export const options = {
  source: { url: "https://api.vantage.sh/v2/oas_v3.json" },
  allowedOrigin: "https://api.vantage.sh",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

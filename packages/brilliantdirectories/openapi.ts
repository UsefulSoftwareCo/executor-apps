import type { OpenapiToolNamesOptions } from "apps/openapi";

// Brilliant Directories' own OpenAPI 3.1 document, published in the vendor's repository
// brilliantdirectories/brilliant-directories-mcp. Every site has its own origin, so index.ts
// sets the origin per account from the site URL; the placeholder below only names the shape.
export const defaultOrigin = "https://your-site.com";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/brilliantdirectories/brilliant-directories-mcp/c9e5fd90a803b7849a8174244def8b58c663feaa/mcp/openapi/bd-api.json",
  },
  allowedOrigin: defaultOrigin,
  baseUrl: defaultOrigin,
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-Api-Key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

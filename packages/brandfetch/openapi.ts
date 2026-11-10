import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.brandfetch.com/openapi.json" },
  allowedOrigin: "https://api.brandfetch.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Brandfetch puts the query string in this path key, so no tool can be built from it. Re-declare
  // the operation with the Brand Search client ID (`c`) as an ordinary query parameter.
  kinds: { prefetchBrand: "mutation", prefetchBrandByDomain: "mutation" },
  patches: [
    { op: "remove", path: "/paths/~1v2~1search~1{name}?c={clientId}" },
    {
      op: "add",
      path: "/paths/~1v2~1search~1{name}",
      value: {
        get: {
          summary: "Search brands",
          description:
            "Search for brands by name. Needs a Brand Search client ID (not the API key), created at https://developers.brandfetch.com. Returns brandId, name, domain, icon and claimed for each match.",
          operationId: "searchBrands",
          security: [],
          parameters: [
            { name: "name", in: "path", required: true, description: "The name of the company you are searching for.", schema: { type: "string" } },
            { name: "c", in: "query", required: true, description: "Your Brand Search client ID.", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Matching brands",
              content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
            },
          },
        },
      },
    },
  ],
} satisfies OpenapiToolNamesOptions;

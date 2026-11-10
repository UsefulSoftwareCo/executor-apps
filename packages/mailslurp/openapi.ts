import type { OpenapiToolNamesOptions } from "apps/openapi";

// MailSlurp's own OpenAPI 3 document, served by the API at /v2/api-docs.
// The official MCP server's transport and OAuth endpoints are not REST operations
// and do not accept an x-api-key account key, so they are not exposed as tools.
const patches = [
  { op: "remove", path: "/paths/~1mcp" },
  { op: "remove", path: "/paths/~1mcp~1oauth~1token" },
  { op: "remove", path: "/paths/~1mcp~1oauth~1register" },
  { op: "remove", path: "/paths/~1mcp~1oauth~1authorize" },
  { op: "remove", path: "/paths/~1.well-known~1oauth-protected-resource" },
  { op: "remove", path: "/paths/~1.well-known~1oauth-protected-resource~1mcp" },
  { op: "remove", path: "/paths/~1.well-known~1oauth-authorization-server" },
  { op: "remove", path: "/paths/~1.well-known~1oauth-authorization-server~1mcp" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.mailslurp.com/v2/api-docs" },
  allowedOrigin: "https://api.mailslurp.com",
  securitySchemes: { API_KEY: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "API_KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

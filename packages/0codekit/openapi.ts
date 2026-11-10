import type { OpenapiToolNamesOptions } from "apps/openapi";

// These operations declare `auth` as a required header parameter with `security: []`, which would
// make the agent pass the API key as a tool argument. Rebind them to apiKeyAuth and drop the
// parameter (patches cannot edit array items, so each parameters list is replaced whole) so the
// account credential is injected at call time and never enters the input schema. The SSE transport
// endpoints (/mcp, /mcp/messages) only work inside a session and are removed.
// Array values are valid at runtime; the declared patch type only admits objects.
const patches = [
  { op: "remove", path: "/paths/~1mcp" },
  { op: "remove", path: "/paths/~1mcp~1messages" },
  { op: "replace", path: "/paths/~1storage~1perm~1add/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1storage~1perm~1add/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1storage~1perm~1del/post/parameters", value: [{"name": "ipaas", "in": "header", "required": false, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1storage~1perm~1del/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1storage~1perm~1get/post/parameters", value: [{"name": "ipaas", "in": "header", "required": false, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1storage~1perm~1get/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1storage~1perm~1list/post/parameters", value: [{"name": "ipaas", "in": "header", "required": false, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1storage~1perm~1list/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1editor/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor/delete/parameters", value: [{"name": "rowKey", "in": "query", "required": true, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1editor/delete/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1editor/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor/put/parameters", value: [{"name": "rowKey", "in": "query", "required": true, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1editor/put/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor~1make/post/parameters", value: [{"name": "rowKey", "in": "query", "required": true, "schema": {"type": "string"}}, {"name": "language", "in": "query", "required": true, "schema": {"type": "string", "enum": ["javascript", "python"]}}, {"name": "ipaas", "in": "header", "required": false, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1editor~1make/post/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor~1make/get/parameters", value: [{"name": "language", "in": "query", "required": true, "schema": {"type": "string", "enum": ["javascript", "python"]}}] },
  { op: "replace", path: "/paths/~1editor~1make/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1editor~1make-variables/get/parameters", value: [{"name": "rowKey", "in": "query", "required": true, "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1editor~1make-variables/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1resource~1variables/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1resource~1variables/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1resource~1bin/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1resource~1bin/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1resource~1schedulers/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1resource~1schedulers/get/security", value: [{ apiKeyAuth: [] }] },
  { op: "replace", path: "/paths/~1resource~1shortened-urls/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1resource~1shortened-urls/get/security", value: [{ apiKeyAuth: [] }] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://v2.1saas.co/openapi.json" },
  allowedOrigin: "https://prod.0codekit.com",
  securitySchemes: {
    apiKeyAuth: { type: "apiKey", in: "header", name: "auth" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

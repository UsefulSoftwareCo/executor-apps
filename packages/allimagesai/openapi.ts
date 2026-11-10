import type { OpenapiToolNamesOptions } from "apps/openapi";

// All-Images.ai's own OpenAPI document. It advertises a bearer scheme and no per-operation security,
// but the API authenticates on the `api-key` header, which every operation declares as a required
// header parameter. Left alone, the agent would have to pass the key as a tool argument, so the
// parameter is dropped from each operation (patches cannot edit array items, so each parameters list
// is replaced whole) and the account credential is injected through the ApiKeyAuth scheme instead.
// GET /v1/api-keys/webhook/{apiKeyWebhookId} is removed: the vendor echoes the live API key in its
// `apiKeyId` response field, which must never reach model context or tool logs.
// Array values are valid at runtime; the declared patch type only admits objects.
const patches = [
  { op: "remove", path: "/paths/~1v1~1api-keys~1webhook~1{apiKeyWebhookId}" },
  { op: "replace", path: "/paths/~1v1~1api-keys~1check/get/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1api-keys~1webhook~1subscribe/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1api-keys~1webhook~1unsubscribe~1{apiWebhookId}/delete/parameters", value: [{"name": "apiWebhookId", "required": true, "in": "path", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1images~1search/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1images~1downladed/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1images~1buy/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1images~1download/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1images~1{format}~1{imageId}.jpg/get/parameters", value: [{"name": "imageId", "required": true, "in": "path", "schema": {"type": "string"}}, {"name": "format", "required": true, "in": "path", "schema": {"type": "string", "enum": ["preview", "full"]}}] },
  { op: "replace", path: "/paths/~1v1~1image-generations/post/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1image-generations/get/parameters", value: [{"name": "limit", "required": false, "in": "query", "schema": {"type": "number"}}, {"name": "offset", "required": false, "in": "query", "schema": {"type": "number"}}, {"name": "sort", "required": false, "in": "query", "schema": {"type": "string"}}, {"name": "name", "required": false, "in": "query", "description": "Search prints by name", "schema": {"type": "string"}}, {"name": "tag", "required": false, "in": "query", "description": "Search prints by tag", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1image-generations/delete/parameters", value: [] },
  { op: "replace", path: "/paths/~1v1~1image-generations~1{printId}/put/parameters", value: [{"name": "printId", "required": true, "in": "path", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1image-generations~1retry~1{imageGenerationId}/post/parameters", value: [{"name": "imageGenerationId", "required": true, "in": "path", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1image-generations~1{imageGenerationId}/get/parameters", value: [{"name": "imageGenerationId", "required": true, "in": "path", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1credit/get/parameters", value: [] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.all-images.ai/doc-json" },
  baseUrl: "https://api.all-images.ai",
  allowedOrigin: "https://api.all-images.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "api-key", in: "header" } },
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

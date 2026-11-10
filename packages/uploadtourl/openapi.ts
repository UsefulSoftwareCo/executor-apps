import type { OpenapiToolNamesOptions } from "apps/openapi";

// The product's FastAPI document at /api/openapi.json has no servers and declares the API key only as
// a required `x-api-key` header parameter. The patches drop the dashboard, billing, MCP transport,
// webhook and discovery routes (they use session tokens or are internal), and replace each remaining
// `x-api-key` parameter with a security requirement so the account key is attached automatically.
export const options = {
  source: { url: "https://uploadtourl.com/api/openapi.json" },
  allowedOrigin: "https://uploadtourl.com",
  baseUrl: "https://uploadtourl.com",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  patches: [
    { "op": "add", "path": "/components/securitySchemes/apiKeyAuth", "value": { "type": "apiKey", "in": "header", "name": "x-api-key" } },
    {
      "op": "remove",
      "path": "/paths/~1"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1api-catalog"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1http-message-signatures-directory"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1openid-configuration"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1oauth-authorization-server"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1oauth-protected-resource"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1mcp~1server-card.json"
    },
    {
      "op": "remove",
      "path": "/paths/~1.well-known~1agent-skills~1index.json"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1custom-domain~1request"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1auth~1verify"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1dashboard"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1api-key~1generate"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1api-key~1{key_id}"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1api-keys"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1public-upload~1token"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1public-upload"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1mcp"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1mcp~1messages"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1dashboard~1file~1{file_id}"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1checkout~1session"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1checkout~1status~1{session_id}"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1checkout~1portal"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1webhook~1stripe"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1cleanup~1expired-uploads"
    },
    {
      "op": "remove",
      "path": "/paths/~1api~1monday~1run"
    },
    {
      "op": "remove",
      "path": "/paths/~1{slug}"
    },
    {"op": "replace", "path": "/paths/~1api~1api-key~1verify/get/parameters", "value": []},
    {
      "op": "add",
      "path": "/paths/~1api~1api-key~1verify/get/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    },
    {"op": "replace", "path": "/paths/~1api~1check-filename/get/parameters", "value": [{"name": "filename", "in": "query", "required": true, "schema": {"type": "string", "title": "Filename"}}]},
    {
      "op": "add",
      "path": "/paths/~1api~1check-filename/get/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    },
    {"op": "replace", "path": "/paths/~1api~1upload/post/parameters", "value": []},
    {
      "op": "add",
      "path": "/paths/~1api~1upload/post/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    },
    {"op": "replace", "path": "/paths/~1api~1file~1{file_id}/get/parameters", "value": [{"name": "file_id", "in": "path", "required": true, "schema": {"type": "string", "title": "File Id"}}]},
    {
      "op": "add",
      "path": "/paths/~1api~1file~1{file_id}/get/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    },
    {"op": "replace", "path": "/paths/~1api~1file~1{file_id}/delete/parameters", "value": [{"name": "file_id", "in": "path", "required": true, "schema": {"type": "string", "title": "File Id"}}]},
    {
      "op": "add",
      "path": "/paths/~1api~1file~1{file_id}/delete/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    },
    {"op": "replace", "path": "/paths/~1api~1publish/post/parameters", "value": []},
    {
      "op": "add",
      "path": "/paths/~1api~1publish/post/security",
      "value": [
        {
          "apiKeyAuth": []
        }
      ]
    }
  ],
  oauth: [],
} satisfies OpenapiToolNamesOptions;

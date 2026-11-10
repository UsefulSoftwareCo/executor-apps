import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.vlm.run/openapi.json" },
  baseUrl: "https://api.vlm.run",
  allowedOrigin: "https://api.vlm.run",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// VLM Run's second official document (https://gateway.vlm.run/openapi.json, "VLM Run Gateway API"):
// embeddings, audio transcription, model lookup, completions and the typesafe endpoints. Three of its
// paths also exist in the main API document and are removed here so the tools are not duplicated. Its
// "localhost:8001" server entry is ignored by setting baseUrl.
export const gatewayOptions = {
  source: { url: "https://gateway.vlm.run/openapi.json" },
  baseUrl: "https://gateway.vlm.run",
  allowedOrigin: "https://gateway.vlm.run",
  securitySchemes: { _PermissiveHTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "_PermissiveHTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1v1~1openai~1chat~1completions" },
    { op: "remove", path: "/paths/~1v1~1openai~1models" },
    { op: "remove", path: "/paths/~1health" },
  ],
} satisfies OpenapiToolNamesOptions;

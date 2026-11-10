import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ollama's official OpenAPI document (ollama/ollama docs/openapi.yaml), pinned to the v0.40.3
// release tag so the compiled tool set only changes with this package. It declares the local
// server http://localhost:11434, which a hosted Executor cannot reach, so every operation is
// pointed at Ollama Cloud (https://ollama.com) instead.
export const options = {
  source: { url: "https://raw.githubusercontent.com/ollama/ollama/v0.40.3/docs/openapi.yaml" },
  baseUrl: "https://ollama.com",
  allowedOrigin: "https://ollama.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The spec documents /v1/systemone as "currently available locally in Ollama" (local
  // System One models, v0.35.0+), so it is removed rather than exposed for Ollama Cloud.
  // The document's top-level `security: []` describes the local server, which needs no key; Ollama
  // Cloud needs the API key on every operation.
  patches: [
    { op: "remove", path: "/paths/~1v1~1systemone" },
    { op: "add", path: "/security", value: [{ bearerAuth: [] }] },
    // Public operations keep no security (catalog/status/ollama.json "credentialFree" says why).
    { op: "add", path: "/paths/~1api~1version/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

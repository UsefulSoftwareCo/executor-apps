import type { OpenapiToolNamesOptions } from "apps/openapi";

// Eden AI's official OpenAPI 3.1 document for the v3 API (linked from https://www.edenai.co/docs/llms.txt).
// The management API is a separate spec that needs a separate management key and is not mounted.
export const options = {
  source: { url: "https://api.edenai.run/v3/docs/openapi.json" },
  allowedOrigin: "https://api.edenai.run",
  securitySchemes: { AuthBearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ AuthBearer: [] }],
  methods: { apiKey: [{ scheme: "AuthBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/edenai.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1v3~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1embeddings~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1moderations~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1audio~1transcriptions~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1audio~1speech~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1images~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1videos~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1alpha~1decisions~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1search~1models/get/security", value: [] },
    { op: "add", path: "/paths/~1v3~1audio~1voices/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// MCP tools that duplicate an operation in the spec; the spec's version is kept.
export const duplicatedMcpTools = new Set([
  "list_models",
  "list_voices",
  "manage_collections",
  "audio_speech_to_text",
  "audio_tts",
  "image_generation",
  "video_generation",
  "text_moderation",
  "web_search",
]);

import type { OpenapiToolNamesOptions } from "apps/openapi";

// The WebSocket streaming operations are documented as GET in the spec; they cannot be called as request/response
// tools, so they are removed.
const patches = [
  { op: "remove", path: "/paths/~1speech~1tts" },
  { op: "remove", path: "/paths/~1speech~1asr" },
  { op: "remove", path: "/paths/~1speech~1s2s" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://docs.gradium.ai/api-reference/openapi.json" },
  allowedOrigin: "https://api.gradium.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

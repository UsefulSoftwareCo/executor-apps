import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lyzr's FastAPI document declares no servers, so the origin is pinned here.
export const options = {
  source: { url: "https://agent-prod.studio.lyzr.ai/openapi.json" },
  baseUrl: "https://agent-prod.studio.lyzr.ai",
  allowedOrigin: "https://agent-prod.studio.lyzr.ai",
  securitySchemes: { APIKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Service-to-service, webhook-receiver and diagnostic routes are not agent-facing: drop them.
  patches: [
    { op: "remove", path: "/paths/~1v3~1contexts~1internal~1name~1{context_name}" },
    { op: "remove", path: "/paths/~1v3~1contexts~1internal~1value~1{context_name}" },
    { op: "remove", path: "/paths/~1v3~1contexts~1internal~1batch-values" },
    { op: "remove", path: "/paths/~1v3~1providers~1internal~1resolve-llm-credential" },
    { op: "remove", path: "/paths/~1v3~1tools~1webhooks~1composio" },
    { op: "remove", path: "/paths/~1v3~1tools~1webhooks~1aci" },
    { op: "remove", path: "/paths/~1v3~1channels~1webhook~1{channel_id}" },
    { op: "remove", path: "/paths/~1log~1{session_id}" },
    { op: "remove", path: "/paths/~1diagnostics" },
    { op: "remove", path: "/paths/~1v3~1credits~1cache~1refresh" },
  ],
} satisfies OpenapiToolNamesOptions;

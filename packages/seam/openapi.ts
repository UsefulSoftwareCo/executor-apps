import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://connect.getseam.com/openapi.json" },
  allowedOrigin: "https://connect.getseam.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Operations that do not accept the workspace API key (no security, or an empty
  // security alternative): a webhook receiver, a connector OAuth redirect and a
  // bridge client bootstrap. Not callable with a workspace API key, so not exposed.
  patches: [
    { op: "remove", path: "/paths/~1seam~1webhooks~1[provider]~1[subscription_id]" },
    { op: "remove", path: "/paths/~1seam~1customer~1v1~1connectors~1authorize" },
    { op: "remove", path: "/paths/~1seam~1bridge~1v1~1bridge_client_sessions~1create" },
  ],
} satisfies OpenapiToolNamesOptions;

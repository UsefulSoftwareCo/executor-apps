import type { OpenapiToolNamesOptions } from "apps/openapi";

// The /api-keys operations are documented as callable only with a Blooio Apps OAuth access token
// (`blo_at_...`); API-key auth is rejected with 403 oauth_token_required. Only an API key is
// offered, so those seven operations are removed rather than exposed as tools that cannot work.
const patches = [
  { op: "remove", path: "/paths/~1api-keys" },
  { op: "remove", path: "/paths/~1api-keys~1{apiKey}" },
  { op: "remove", path: "/paths/~1api-keys~1{apiKey}~1channels" },
  { op: "remove", path: "/paths/~1api-keys~1{apiKey}~1channels~1{channel}" },
] as const;

export const options = {
  source: { url: "https://docs.blooio.com/openapi.json" },
  allowedOrigin: "https://api.blooio.com",
  securitySchemes: { BearerApiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

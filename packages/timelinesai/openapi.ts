import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// The vendor's YAML uses merge keys that the document loader rejects, so the spec is bundled as
// JSON (see spec.ts) rather than fetched.
export const options = {
  source: { document },
  baseUrl: "https://app.timelines.ai/integrations/api",
  allowedOrigin: "https://app.timelines.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

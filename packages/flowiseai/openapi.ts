import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Converted by generate.py from Flowise's official swagger.yml. Scoped to Flowise Cloud.
const origin = "https://cloud.flowiseai.com";

export const options = {
  source: { document },
  allowedOrigin: origin,
  baseUrl: `${origin}/api/v1`,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

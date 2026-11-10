import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Aimtell's reference publishes five OpenAPI documents; spec.ts merges them into one.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.aimtell.com",
  securitySchemes: {
    sec0: { type: "apiKey", name: "X-Authorization-Api-Key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "sec0", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

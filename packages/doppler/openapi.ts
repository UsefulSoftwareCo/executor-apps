import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.doppler.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.voiceflow.com/docs/specs-prettified/realtime/openapi.stable.json" },
  allowedOrigin: "https://realtime-api.voiceflow.com",
  securitySchemes: { token: { type: "http", scheme: "bearer" } },
  methods: { token: [{ scheme: "token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

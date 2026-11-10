import type { OpenapiToolNamesOptions } from "apps/openapi";

// The cron ping endpoints are GET/HEAD but record check-ins and change monitor state.
const kinds = {
  "monitors.getCronById": "mutation",
  "monitors.headCron": "mutation",
  "monitors.getCronFail": "mutation",
  "monitors.headCronFail": "mutation",
  "monitors.getCronStart": "mutation",
  "monitors.headCronStart": "mutation",
} as const;

export const options = {
  source: { url: "https://raw.githubusercontent.com/instatushq/openapi/main/instatus.json" },
  allowedOrigin: "https://api.instatus.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  kinds,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

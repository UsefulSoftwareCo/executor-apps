import type { OpenapiToolNamesOptions } from "apps/openapi";
import { spec } from "./spec.ts";

export const options = {
  source: { document: spec },
  allowedOrigin: "https://app.onedesk.com",
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "OD-Public-API-Key" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds: {
    startWorkTimerByExternalId: "mutation",
    userWorkTimerPause: "mutation",
    userWorkTimerResume: "mutation",
    userWorkTimerCancel: "mutation",
  },
} satisfies OpenapiToolNamesOptions;

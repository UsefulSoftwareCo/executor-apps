import type { OpenapiToolNamesOptions } from "apps/openapi";
import patchDocument from "./patches.json" with { type: "json" };

// Rollbar's description declares no security schemes: every call takes the access token in the
// X-Rollbar-Access-Token header. One is declared here and applied to every operation. The
// description also lists that header as a required parameter on 102 operations (often shared by
// $ref), which would make the agent pass the token as a tool argument; patches.json rewrites those
// operations' parameter lists with the token header removed (everything else resolved unchanged)
// so the account credential is injected at call time instead.
export const options = {
  source: { url: "https://docs.rollbar.com/openapi/62de9e1b6316c304034d006a" },
  allowedOrigin: "https://api.rollbar.com",
  securitySchemes: {
    accessToken: { type: "apiKey", in: "header", name: "X-Rollbar-Access-Token" },
  },
  fallbackSecurity: [{ accessToken: [] }],
  methods: { apiKey: [{ scheme: "accessToken", field: "token", part: "value", prefix: "" }] },
  patches: patchDocument as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

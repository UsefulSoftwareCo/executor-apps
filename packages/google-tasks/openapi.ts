import type { OpenapiToolNamesOptions } from "apps/openapi";

// APIs.guru's conversion of Google's official Tasks v1 Discovery document. The conversion makes
// every operation require its "Oauth2" and "Oauth2c" schemes together; both mean the same bearer
// access token, so both are declared as bearer and filled from the oauth method's access token.
export const options = {
  source: { url: "https://api.apis.guru/v2/specs/googleapis.com/tasks/v1/openapi.json" },
  allowedOrigin: "https://tasks.googleapis.com",
  securitySchemes: {
    Oauth2: { type: "http", scheme: "bearer" },
    Oauth2c: { type: "http", scheme: "bearer" },
  },
  methods: {
    oauth: [
      { scheme: "Oauth2", field: "access_token", part: "value", prefix: "" },
      { scheme: "Oauth2c", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/Asana/openapi/cd062f4e6c367f5b84f369a8c824e36bbe836ca5/defs/asana_oas.yaml" },
  allowedOrigin: "https://app.asana.com",
  securitySchemes: { personalAccessToken: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "personalAccessToken", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "personalAccessToken", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

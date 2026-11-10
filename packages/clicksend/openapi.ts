import type { OpenapiToolNamesOptions } from "apps/openapi";
import specDocument from "./spec.json" with { type: "json" };

// spec.json is ClickSend's official swagger.yaml (github.com/ClickSend/clicksend-go, api/swagger.yaml)
// converted to JSON unchanged.
export const options = {
  source: { document: specDocument as never },
  allowedOrigin: "https://rest.clicksend.com",
  securitySchemes: { BasicAuth: { type: "http", scheme: "basic" } },
  // The Basic username is the account username; the password is the API key.
  methods: {
    apiKey: [
      { scheme: "BasicAuth", field: "username", part: "username", prefix: "" },
      { scheme: "BasicAuth", field: "apiKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

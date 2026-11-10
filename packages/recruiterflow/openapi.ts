import type { OpenapiToolNamesOptions } from "apps/openapi";

// Recruiterflow's own OpenAPI document (the source of https://recruiterflow.com/api). It declares RF-Api-Key as a
// required header parameter on each operation, not as a security scheme and has no servers entry.
export const options = {
  source: { url: "https://recruiterflow.com/swagger.yml" },
  allowedOrigin: "https://api.recruiterflow.com",
  baseUrl: "https://api.recruiterflow.com",
  securitySchemes: { RfApiKey: { type: "apiKey", in: "header", name: "RF-Api-Key" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ RfApiKey: [] }],
  methods: { apiKey: [{ scheme: "RfApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

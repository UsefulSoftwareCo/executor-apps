import type { OpenapiToolNamesOptions } from "apps/openapi";

// Doppler's own Swagger 2.0 document (the one behind the Swagger UI on its API docs page). It
// declares no host or security scheme; the API lives at restapi.fromdoppler.com and takes the
// API key as "Authorization: token <key>".
export const options = {
  source: { url: "https://restapi.fromdoppler.com/swagger/current/swagger.json" },
  allowedOrigin: "https://restapi.fromdoppler.com",
  securitySchemes: { apiKeyAuth: { type: "apiKey", name: "Authorization", in: "header" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ apiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "token " }] },
  oauth: [],
  // Public operations keep no security (catalog/status/dopplermarketingautomation.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1authenticate/post/security", value: [] },
    { op: "add", path: "/paths/~1reset-password-email/post/security", value: [] },
    { op: "add", path: "/paths/~1tokens/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

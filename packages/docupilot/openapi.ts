import type { OpenapiToolNamesOptions } from "apps/openapi";

// Docupilot's V2 document declares an apiKey scheme on the Authorization header. Its help docs
// send the base64 of "key:secret" as a Bearer token, so the prefix is "Bearer ".
export const options = {
  source: { url: "https://api.docupilot.app/api/v2/schema/" },
  allowedOrigin: "https://api-us1.docupilot.app",
  securitySchemes: { tokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ tokenAuth: [] }],
  methods: { apiKey: [{ scheme: "tokenAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
  // Public operations keep no security (catalog/status/docupilot.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1dashboard~1accounts~1v2~1users~1migrate_session~1/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

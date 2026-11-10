import type { OpenapiToolNamesOptions } from "apps/openapi";

// IBM publishes this document at https://api.xforce.ibmcloud.com/doc/swagger.yaml. It declares no
// security scheme and a relative server ("/api"), so the scheme is declared here and the API is
// called at its documented root, https://api.xforce.ibmcloud.com.
export const options = {
  source: { url: "https://api.xforce.ibmcloud.com/doc/swagger.yaml" },
  allowedOrigin: "https://api.xforce.ibmcloud.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ basicAuth: [] }],
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "key", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "password", part: "password", prefix: "" },
    ],
  },
  oauth: [],
  // Public operations keep no security (catalog/status/ibmxforceexchange.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1version/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

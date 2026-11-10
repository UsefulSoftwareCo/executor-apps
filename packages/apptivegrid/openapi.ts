import type { OpenapiToolNamesOptions } from "apps/openapi";

// ApptiveGrid's own REST API description, published with its documentation.
export const options = {
  source: { url: "https://docs.apptivegrid.de/openapi.json" },
  allowedOrigin: "https://app.apptivegrid.de",
  securitySchemes: {
    apiKey: { type: "http", scheme: "basic" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  // An access key is a key (Basic username) and a secret (Basic password).
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "key", part: "username", prefix: "" },
      { scheme: "apiKey", field: "secret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

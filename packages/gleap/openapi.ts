import type { OpenapiToolNamesOptions } from "apps/openapi";

// Gleap serves its Admin REST API v3 description at this URL (linked from its docs index). The
// spec declares a bearer scheme named "jwt"; the API key goes there. The project id is sent in
// the "project" header, which most operations also declare as a parameter.
export const options = {
  source: { url: "https://api.gleap.io/api-docs.json" },
  allowedOrigin: "https://api.gleap.io",
  securitySchemes: {
    jwt: { type: "http", scheme: "bearer" },
    project: { type: "apiKey", in: "header", name: "project" },
  },
  methods: {
    apiKey: [
      { scheme: "jwt", field: "token", part: "value", prefix: "" },
      { scheme: "project", field: "projectId", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pipedream's official REST API OpenAPI document (linked from https://pipedream.com/docs/llms.txt).
// Every operation takes the project environment as an x-pd-environment parameter and, for Connect
// endpoints, the project id in the path; both are tool arguments. Auth is a bearer token: an OAuth client-credentials token or a user API key.
export const options = {
  source: { url: "https://pipedream.com/docs/pipedream_openapi_swagger.json" },
  allowedOrigin: "https://api.pipedream.com",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "OAuth2", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

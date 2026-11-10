import type { OpenapiToolNamesOptions } from "apps/openapi";

// Brevo's document lists only the api-key header. OAuth access tokens are sent as a bearer
// token to the same API, so the root security is widened to accept either scheme.
const patches = [
  { op: "replace", path: "/security", value: [{ "api-key": [] }, { bearer: [] }] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.brevo.com/v3/swagger_definition_v3.yml" },
  allowedOrigin: "https://api.brevo.com",
  securitySchemes: {
    "api-key": { type: "apiKey", in: "header", name: "api-key" },
    bearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

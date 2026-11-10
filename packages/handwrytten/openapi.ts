import type { OpenapiToolNamesOptions } from "apps/openapi";

// Handwrytten expects the raw API key in the Authorization header, with no "Bearer " prefix.
// The spec also lists a second (staging-style) server on api2.handwrytten.com; only the
// documented production host is allowed. The deprecated login/password flow (auth_authorization
// takes a raw login and password, auth_logout takes the resulting uid) is removed so credentials
// never pass through tool arguments.
const patches = [
  { op: "remove", path: "/paths/~1auth~1authorization" },
  { op: "remove", path: "/paths/~1auth~1logout" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://www.handwrytten.com/openapi.json" },
  allowedOrigin: "https://api.handwrytten.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

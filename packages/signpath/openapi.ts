import type { OpenapiToolNamesOptions } from "apps/openapi";

// SignPath's official OpenAPI document. Its only server is the relative "/API", so the origin is
// pinned here. Every operation takes the organization ID as a path parameter.
export const options = {
  source: { url: "https://app.signpath.io/API/swagger/v1/swagger.json" },
  allowedOrigin: "https://app.signpath.io",
  baseUrl: "https://app.signpath.io/API",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [{ op: "replace", path: "/servers", value: [{ url: "https://app.signpath.io/API" }] }],
} satisfies OpenapiToolNamesOptions;

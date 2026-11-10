import type { OpenapiToolNamesOptions } from "apps/openapi";

// KnowBe4's official Reporting API definition. index.ts swaps the placeholder US origin for the account's region.
export const options = {
  source: { url: "https://developer.knowbe4.com/elvis-swagger.yml" },
  allowedOrigin: "https://us.api.knowbe4.com",
  baseUrl: "https://us.api.knowbe4.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

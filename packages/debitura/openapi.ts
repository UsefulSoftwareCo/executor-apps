import type { OpenapiToolNamesOptions } from "apps/openapi";

// The Customer API document lists four colon-style duplicates of slash operations
// (GET /coverage/:search, POST /divisions/{id}:archive, /webhooks/{id}:test, /webhooks/{id}:replay).
// Each is the same operation as its slash twin (two are marked deprecated) and the colon paths put a
// literal colon in the URL, so they are removed here and only the slash forms become tools.
export const options = {
  source: { url: "https://docs.debitura.com/openapi/customer-api.json" },
  allowedOrigin: "https://customer-api.debitura.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "XApiKey" } },
  patches: [
    { op: "remove", path: "/paths/~1coverage~1:search" },
    { op: "remove", path: "/paths/~1divisions~1{id}:archive" },
    { op: "remove", path: "/paths/~1webhooks~1{id}:test" },
    { op: "remove", path: "/paths/~1webhooks~1{id}:replay" },
  ],
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// The Collection Partner API is a separate spec and host with its own key (Partner Portal).
export const collectionPartnerOptions = {
  source: { url: "https://docs.debitura.com/openapi/collection-partner-api.json" },
  allowedOrigin: "https://collectionpartner-api.debitura.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "XApiKey" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

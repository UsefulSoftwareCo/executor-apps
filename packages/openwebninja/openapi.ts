import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is derived from the vendor's official OpenAPI document at
// https://agents.openwebninja.com/zcj/d3fkaq9pdppw/openapi.json: server set to api.openwebninja.com,
// the agent plan/payment surface (planAccess, x-payment-info, x-zeroclick-*) removed, and security set
// to the x-api-key header.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.openwebninja.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

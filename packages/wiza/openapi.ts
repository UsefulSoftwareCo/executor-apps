import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is Wiza's official OpenAPI document, https://docs.wiza.co/swagger/v1/openapi.yaml,
// converted from YAML to JSON. It is embedded because Cloudflare challenges requests without a
// browser User-Agent, which would break loading it at runtime.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://wiza.co",
  securitySchemes: { bearer_auth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer_auth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

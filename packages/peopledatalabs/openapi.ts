import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/peopledatalabs/openAPI-specifications/65d329510d6d410e79748cbf08ff919df05284b0/pdl-specs.json" },
  allowedOrigin: "https://api.peopledatalabs.com",
  securitySchemes: { APIKeyHeader: { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

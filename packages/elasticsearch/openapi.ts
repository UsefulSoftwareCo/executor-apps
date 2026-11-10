import type { OpenapiToolNamesOptions } from "apps/openapi";

// Elastic's official Elasticsearch API document (OpenAPI 3.x), generated from elastic/elasticsearch-specification.
// Every cluster serves the same API; index.ts points calls at the account's own cluster.
export const placeholderOrigin = "https://my-deployment.es.us-east-1.aws.elastic.cloud";

export const options = {
  source: { url: "https://www.elastic.co/docs/api/doc/elasticsearch.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: {
    apiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" },
    basicAuth: { type: "http", scheme: "basic" },
  },
  methods: {
    apiKey: [{ scheme: "apiKeyAuth", field: "apiKey", part: "value", prefix: "ApiKey " }],
    basic: [
      { scheme: "basicAuth", field: "username", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "password", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

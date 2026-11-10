import type { OpenapiToolNamesOptions } from "apps/openapi";

// SeaTable publishes its API reference as OpenAPI 3.0 documents in https://github.com/seatable/openapi
// (the source of https://api.seatable.com). The servers are `https://{server}`; index.ts swaps in the
// account's origin and replaces the API-Token with the Base-Token it exchanges from it.
export const placeholderOrigin = "https://cloud.seatable.io";

const spec = (name: string) => ({ url: `https://raw.githubusercontent.com/seatable/openapi/v6.2/${name}.yaml` });

// POST operations that only read are queries, so they run without an approval prompt.
export const baseOptions = {
  source: spec("base_operations"),
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { BaseTokenAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BaseTokenAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds: { querySql: "query", listRowLinks: "query" },
} satisfies OpenapiToolNamesOptions;

export const filesOptions = {
  source: spec("file_operations"),
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { ApiTokenAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiTokenAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const options = baseOptions;

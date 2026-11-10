import type { OpenapiToolNamesOptions } from "apps/openapi";

// Terra publishes three OpenAPI descriptions on one host with one key. They come from Tripadvisor's own docs
// (ReadMe API registry); each reference page on https://docs.terra.tripadvisor.com names its registry id in
// `oasPublicUrl`. index.ts mounts each under its own key.
const credentials = {
  allowedOrigin: "https://terra.tripadvisor.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const registry = (id: string) => ({ url: `https://dash.readme.com/api/v1/api-registry/${id}` });

export const partnerOptions = {
  source: registry("4laulumrj76bhp"),
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const accountOptions = {
  source: registry("bgy3v814mrwexjsy"),
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// getFile answers 302 to a presigned URL on a storage host, which must never receive X-API-Key. It is removed;
// getFileUrl returns the same presigned URL as JSON without following it.
export const feedOptions = {
  source: registry("5iz0kllmiyfk7ja"),
  ...credentials,
  patches: [{ op: "remove", path: "/paths/~1{filename}" }],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads this one; index.ts mounts all three.
export const options = partnerOptions;

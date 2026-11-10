import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.altoviz.com/openapi.yaml" },
  allowedOrigin: "https://api.altoviz.com",
  securitySchemes: { ApiKey: { type: "apiKey", name: "X-API-KEY", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The spec declares global security as [{}] (anonymous) and no operation names ApiKey,
  // so without this patch no X-API-KEY header would be attached to any call.
  patches: [{ op: "replace", path: "/security", value: [{ ApiKey: [] }] }],
} satisfies OpenapiToolNamesOptions;

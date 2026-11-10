import type { OpenapiToolNamesOptions } from "apps/openapi";

const security: Record<string, string[]>[] = [{ "Klaviyo-API-Key": [] }, { bearer: [] }];

// Klaviyo's stable description declares only the private API key scheme, sent as
// `Authorization: Klaviyo-API-Key <key>`. OAuth access tokens are sent as a bearer token,
// so the patches add that scheme as a second alternative. Every operation also takes a
// required `revision` header, which the description defaults to the current revision.
export const options = {
  source: { url: "https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable.json" },
  allowedOrigin: "https://a.klaviyo.com",
  securitySchemes: {
    "Klaviyo-API-Key": { type: "apiKey", in: "header", name: "Authorization" },
    bearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "Klaviyo-API-Key", field: "apiKey", part: "value", prefix: "Klaviyo-API-Key " }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    { op: "add", path: "/components/securitySchemes/bearer", value: { type: "http", scheme: "bearer" } },
    { op: "replace", path: "/security", value: security },
  ],
} satisfies OpenapiToolNamesOptions;

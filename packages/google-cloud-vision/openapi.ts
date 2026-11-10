import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is generated from Google's official Cloud Vision v1 Discovery document
// (https://vision.googleapis.com/$discovery/rest?version=v1, revision 20260918) by convert-discovery.mjs.
// The converter emits no security. The Discovery document declares a root `key` parameter ("Required unless you
// provide an OAuth 2.0 token"), so every operation takes either an API key (sent as the x-goog-api-key header) or an
// OAuth bearer token. Whether the API key works for Product Search and operations is untested.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://vision.googleapis.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "x-goog-api-key" },
    bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ apiKey: [] as string[] }, { bearer: [] as string[] }] as { [x: string]: string[] }[],
  methods: {
    apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  // These POST operations only analyse the supplied image or file synchronously.
  kinds: {
    "vision.images.annotate": "query",
    "vision.files.annotate": "query",
    "vision.projects.images.annotate": "query",
    "vision.projects.files.annotate": "query",
    "vision.projects.locations.images.annotate": "query",
    "vision.projects.locations.files.annotate": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

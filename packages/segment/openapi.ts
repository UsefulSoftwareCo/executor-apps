import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Segment publishes its Public API definition only inside the rendered reference at
// docs.segmentapis.com (no stable file URL; the "Download" button is a browser blob). document.json
// is that definition, version 73.6.0 (source page https://docs.segmentapis.com, retrieved 2026-10),
// unchanged except for the embedded example payloads removed. sha256 of document.json:
// b8e01bcfdecc6255dc0e922b966e061be51e9ebc27fc3299462a597da84171d3
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.segmentapis.com",
  securitySchemes: { token: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

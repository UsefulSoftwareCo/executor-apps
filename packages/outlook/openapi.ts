import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import graph from "./graph-outlook.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const document: JsonObject = JSON.parse(JSON.stringify(graph));

// graph-outlook.json is Microsoft's official Graph v1.0 OpenAPI document, reduced to the /me
// mail, calendar and contact paths (see README). Credentials go only to graph.microsoft.com.
export const options = {
  source: { document: document },
  allowedOrigin: "https://graph.microsoft.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // The document's top-level `security: []` declares every operation public, overriding fallbackSecurity;
  // Graph needs the bearer token on every call.
  patches: [{ op: "add", path: "/security", value: [{ bearer: [] }] }],
} satisfies OpenapiToolNamesOptions;

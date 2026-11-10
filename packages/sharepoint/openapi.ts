import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import graph from "./graph-sharepoint.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const document: JsonObject = JSON.parse(JSON.stringify(graph));

// graph-sharepoint.json is Microsoft's official Graph v1.0 OpenAPI document, reduced to the SharePoint
// site, list and drive paths (see README). Credentials go only to graph.microsoft.com.
export const options = {
  source: { document: document },
  allowedOrigin: "https://graph.microsoft.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

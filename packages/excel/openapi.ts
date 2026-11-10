import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import graph from "./graph-excel.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const document: JsonObject = JSON.parse(JSON.stringify(graph));

// graph-excel.json is Microsoft's official Graph v1.0 OpenAPI document, sliced to the workbook
// paths of a drive item with bounded schema depth by scripts/graph-slice.ts (see README).
// Credentials go only to graph.microsoft.com.
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

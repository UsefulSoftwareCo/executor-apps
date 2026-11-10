import type { OpenapiToolNamesOptions } from "apps/openapi";

type Document = Extract<OpenapiToolNamesOptions["source"], { document: unknown }>["document"];
import document from "./openapi.json" with { type: "json" };

// Microsoft Graph v1.0 OpenAPI document (microsoftgraph/msgraph-metadata), sliced to the Teams
// surface (teams, channels, chats, messages, meetings, presence and Teams apps) with bounded schema
// depth by scripts/graph-slice.ts; see README.
export const options = {
  source: { document: document as unknown as Document },
  allowedOrigin: "https://graph.microsoft.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

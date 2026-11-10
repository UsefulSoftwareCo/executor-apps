import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Ashby serves one OpenAPI definition per endpoint on developers.ashbyhq.com/reference/<endpoint>
// and publishes no combined file, so document.json is those definitions merged (partner-implemented
// endpoints, which Ashby calls on partners, removed). Every operation is a POST, so read-only
// endpoints are marked as queries by name.
const readOnly = /^(info|list.*|search.*|get.*|generate|synchronous)$/;
const kinds: Record<string, "query" | "mutation"> = {};
for (const [path, item] of Object.entries(document.paths as Record<string, Record<string, { operationId?: string }>>)) {
  const operationId = item.post?.operationId;
  if (operationId !== undefined) kinds[operationId] = readOnly.test(path.split(".").pop() ?? "") ? "query" : "mutation";
}

export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.ashbyhq.com",
  securitySchemes: { BasicAuth: { type: "http", scheme: "basic" } },
  // The API key is the Basic username; the password stays empty.
  methods: { apiKey: [{ scheme: "BasicAuth", field: "token", part: "username", prefix: "" }] },
  kinds,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

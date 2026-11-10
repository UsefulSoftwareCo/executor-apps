import type { OpenapiToolNamesOptions } from "apps/openapi";

// Network notes and reports require an `Authorization` header with a console user's access token ("Console user
// access token in the form Bearer <token>."), which an application API key account does not hold, and Executor
// drops a declared Authorization header from a tool's inputs, so they are removed.
const network = "/v3/organization/{organization_id}/application/{application_id}/networks/{network_uuid}";
const consoleUserOnly = [
  [`${network}/notes/`, "get"],
  [`${network}/notes/`, "post"],
  [`${network}/notes/{note_uuid}/`, "delete"],
  [`${network}/report/`, "get"],
].map(([path, method]) => ({ op: "remove" as const, path: `/paths/${path!.replaceAll("/", "~1")}/${method}` }));

export const options = {
  source: { url: "https://docs.didit.me/openapi-25.json" },
  allowedOrigin: "https://verification.didit.me",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: consoleUserOnly,
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";
import { normalize } from "./normalize.ts";

const specUrl = "https://www.hackerrank.com/apidoc";

// Used only by scripts/tools.ts (index.ts replaces `fetch` and `source`): loads the same normalized document the
// runtime uses, so the tool count matches what an account sees.
const normalizingFetch = (async (input, init) => {
  const response = await fetch(input, init);
  if (String(input instanceof Request ? input.url : input) !== specUrl) return response;
  return new Response(JSON.stringify(normalize((await response.json()) as Record<string, unknown>)), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

// HackerRank publishes its Swagger 2.0 document at https://www.hackerrank.com/apidoc (the page behind
// https://www.hackerrank.com/work/apidocs). The document declares the key as an `access_token` query parameter, but
// the server ignores that: a probe with an invalid placeholder key answered "Authentication header not provided" for
// the query form and "Authentication header invalid" for an Authorization header, so the header form is the one parsed.
// The MCP doc (https://www.hackerrank.com/work/mcp/docs/) sends a personal V3 key as a Bearer credential; the REST
// docs never say so explicitly. Bearer is used here on the strength of the observed behaviour.
export const options = {
  source: { url: specUrl },
  fetch: normalizingFetch,
  allowedOrigin: "https://www.hackerrank.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

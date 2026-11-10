import type { OpenapiToolNamesOptions } from "apps/openapi";

const source = { url: "https://www.zenrows.com/openapi.json" };
const credentials = {
  securitySchemes: {
    apiKeyQuery: { type: "apiKey", in: "query", name: "apikey" },
    apiKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKeyQuery", field: "token", part: "value", prefix: "" },
      { scheme: "apiKeyHeader", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

// Fetch, Extract and plan usage live on api.zenrows.com. The Batch operations are on
// async.api.zenrows.com and the agent signup endpoints on app.zenrows.com, so they are skipped here.
export const options = {
  source,
  allowedOrigin: "https://api.zenrows.com",
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// Batch API: every operation under /jobs, /job_inputs, /webhook and /hmac. The same document, with the
// operations of the other origins removed.
const others = ["/", "/api/agent/signup", "/api/agent/account", "/subscriptions/self/details"];
export const batchOptions = {
  source,
  allowedOrigin: "https://async.api.zenrows.com",
  baseUrl: "https://async.api.zenrows.com/v1",
  ...credentials,
  patches: others.map((path) => ({ op: "remove" as const, path: `/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}` })),
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Plisio's official OpenAPI 3.0 document (linked from https://plisio.net/swagger/docs). Its
// operationIds are opaque hashes. Several state-changing operations are declared as GET, so
// `kinds` marks them as mutations by operationId; index.ts requires approval for every mutation.
export const options = {
  source: { url: "https://plisio.net/swagger/api" },
  allowedOrigin: "https://plisio.net",
  securitySchemes: { api_key: { type: "apiKey", in: "query", name: "api_key" } },
  fallbackSecurity: [{ api_key: [] }],
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds: {
    // GET /invoices/new
    "58d47847f7f627e878244d4af8b99a65": "mutation",
    // GET /operations/withdraw (moves funds)
    "434eabf7adbaecbbfc5ea4ba44326fd0": "mutation",
    // GET /shops/deposit/new
    "067093c5a63af6f9f4c7856afe97b97b": "mutation",
    // GET /exchanges/new (moves funds between coins)
    "509d99808760b661b915e7df0e316b21": "mutation",
    // POST /telegram-bot/create
    "501bfd7eee7e15faf844370d0265adf3": "mutation",
    // GET /invoices/email/{id} (sends an email)
    "40a0d2fcd1400aeb5eeba3fbe0dffc3e": "mutation",
  },
} satisfies OpenapiToolNamesOptions;

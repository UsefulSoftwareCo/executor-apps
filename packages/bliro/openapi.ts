import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Bliro publishes its swagger document only inside the docs page script (https://api.bliro.io/docs/), and a client
// application's token carries only the org:calls:read scope, so only the calls listing is mounted (see spec.ts).
// index.ts mints the client-credentials token, so the bearer scheme is filled from it.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.bliro.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

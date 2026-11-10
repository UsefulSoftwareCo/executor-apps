import type { OpenapiToolNamesOptions } from "apps/openapi";

// POST /session ("Create API session") takes an email and password and returns an API key. Credentials must only
// go through Executor's connection links, so it is dropped. GET /session stays for the health check.
const patches = [{ op: "remove", path: "/paths/~1session/post" }] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// MOCO is hosted per account (https://<account>.mocoapp.com/api/v1). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://demo.mocoapp.com";

export const options = {
  source: { url: "https://docs.mocoapp.com/api/docs/v1.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v1`,
  // MOCO accepts the API key as `Authorization: Bearer <key>` (or `Token token=<key>`).
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

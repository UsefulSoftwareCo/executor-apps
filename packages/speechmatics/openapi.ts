import type { OpenapiToolNamesOptions } from "apps/openapi";

// Swagger 2.0 document from Speechmatics' official docs repository; it declares no host.
// Batch is hosted per region; index.ts swaps in the account's regional origin.
export const placeholderOrigin = "https://eu1.asr.api.speechmatics.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/speechmatics/docs/main/spec/batch.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/v2`,
  securitySchemes: { bearerAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

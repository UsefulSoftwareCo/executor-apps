import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official Bird API description (https://bird.com/openapi.json). Every operation lives on the regional host
// https://{region}.platform.bird.com; index.ts re-points baseUrl and allowedOrigin to the region in the key's prefix.
export const options = {
  source: { url: "https://bird.com/openapi.json" },
  allowedOrigin: "https://us1.platform.bird.com",
  baseUrl: "https://us1.platform.bird.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

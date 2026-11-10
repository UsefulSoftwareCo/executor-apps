import type { OpenapiToolNamesOptions } from "apps/openapi";

// pVerify serves its own Swagger 2.0 document. It declares no security; each operation takes the
// bearer token and Client-Api-Id as header parameters, which index.ts supplies from the account.
export const options = {
  source: { url: "https://api.pverify.com/swagger/docs/v1" },
  allowedOrigin: "https://api.pverify.com",
  securitySchemes: {},
  methods: {},
  oauth: [],
} satisfies OpenapiToolNamesOptions;

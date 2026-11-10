import type { OpenapiToolNamesOptions } from "apps/openapi";
import securityPatches from "./security-patches.json" with { type: "json" };

// Avalara serves its official AvaTax REST v2 Swagger 2.0 document from the API host itself.
export const options = {
  source: { url: "https://rest.avatax.com/swagger/v2/swagger.json" },
  baseUrl: "https://rest.avatax.com",
  allowedOrigin: "https://rest.avatax.com",
  securitySchemes: { UserSecurity: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "UserSecurity", field: "username", part: "username", prefix: "" },
      { scheme: "UserSecurity", field: "password", part: "password", prefix: "" },
    ],
  },
  // The document lists Basic, Bearer and OAuth as one combined requirement on every operation; Basic is
  // what this package signs with, so each operation is narrowed to it (security-patches.json).
  patches: securityPatches as never,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

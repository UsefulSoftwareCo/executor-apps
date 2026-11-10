import type { OpenapiToolNamesOptions } from "apps/openapi";
import specDocument from "./spec.json" with { type: "json" };

// TelTel's published description splits operations and schemas into relative-file $refs, which the
// compiler cannot follow, so spec.json is that document with every external $ref inlined (bundled
// from https://api.teltel.io/v2/api.user.0d9ae995324f03f254d3da8d963d46b2.json). It declares no
// servers and takes the API key as the `apikey` query parameter.
export const options = {
  source: { document: specDocument as never },
  allowedOrigin: "https://api.teltel.io",
  baseUrl: "https://api.teltel.io/v2",
  securitySchemes: { newSecurityScheme: { type: "apiKey", name: "apikey", in: "query" } },
  methods: { apiKey: [{ scheme: "newSecurityScheme", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// TalentHR publishes its API only as Postman documentation (https://apidocs.talenthr.io/), so
// document.json is an OpenAPI 3 conversion of that official collection: paths, parameters and
// JSON/multipart request bodies come from it; response shapes are not documented and are left open.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://pubapi.talenthr.io",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The API key is the Basic username; the password may be blank.
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

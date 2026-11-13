// gmail-openapi.json is generated from Google's own Gmail v1 Discovery document (revision 20261106)
// by discovery-to-openapi.mjs; see README. Credentials go only to gmail.googleapis.com.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import gmail from "./gmail-openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const document: JsonObject = JSON.parse(JSON.stringify(gmail));

// Every operation in the generated document already carries a plain bearer requirement.
export const options = {
  source: { document },
  allowedOrigin: "https://gmail.googleapis.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

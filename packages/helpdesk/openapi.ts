import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// HelpDesk.com publishes its OpenAPI 3.0.3 document only inside the Redoc page at
// https://api.helpdesk.com/docs (no standalone URL), so spec.json is that document extracted
// unchanged apart from dropping the analytics <script> from info.description.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.helpdesk.com",
  securitySchemes: {
    BearerAuth: { type: "http", scheme: "bearer" },
    PersonalAccessToken: { type: "http", scheme: "basic" },
  },
  // A Personal Access Token is sent as Basic <account_id>:<token>; OAuth access tokens as Bearer.
  methods: {
    pat: [
      { scheme: "PersonalAccessToken", field: "accountId", part: "username", prefix: "" },
      { scheme: "PersonalAccessToken", field: "token", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

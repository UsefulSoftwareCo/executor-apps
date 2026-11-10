import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./swagger.json" with { type: "json" };

// swagger.json is Strava's official Swagger 2.0 description of API v3
// (https://developers.strava.com/swagger/swagger.json). The official file points at sibling
// files (activity.json, athlete.json ...) that the generator cannot follow, so those
// definitions are copied into this one document, with each sibling-file $ref rewritten to
// #/definitions/<Name>; nothing else is altered (large integers in examples are kept exact). Its one scheme, strava_oauth,
// is a bearer access token; a user-pasted token is sent the same way.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://www.strava.com",
  securitySchemes: { strava_oauth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "strava_oauth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "strava_oauth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

const bearer = { type: "http", scheme: "bearer" } as const;

export const options = {
  source: { url: "https://api.convex.dev/v1/openapi.json" },
  allowedOrigin: "https://api.convex.dev",
  securitySchemes: {
    PAT: bearer,
    "Team Token": bearer,
    "Preview Deploy Key": bearer,
    "OAuth Team Token": bearer,
    "OAuth Project Token": bearer,
  },
  methods: {
    // A personal access token, team token or preview deploy key: all are sent as a bearer token.
    apiKey: [
      { scheme: "PAT", field: "token", part: "value", prefix: "" },
      { scheme: "Team Token", field: "token", part: "value", prefix: "" },
      { scheme: "Preview Deploy Key", field: "token", part: "value", prefix: "" },
    ],
    oauth: [
      { scheme: "OAuth Team Token", field: "access_token", part: "value", prefix: "" },
      { scheme: "OAuth Project Token", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

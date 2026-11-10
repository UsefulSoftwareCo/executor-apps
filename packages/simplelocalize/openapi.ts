import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.simplelocalize.io/openapi/docs" },
  allowedOrigin: "https://api.simplelocalize.io",
  securitySchemes: {
    "Project API Key": { type: "apiKey", name: "X-SimpleLocalize-Token", in: "header" },
    "Personal Access Token": { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: {
    apiKey: [{ scheme: "Project API Key", field: "token", part: "value", prefix: "" }],
    personalToken: [{ scheme: "Personal Access Token", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Comments require a Personal Access Token in Authorization ("The `Authorization` header with a Personal Access
  // Token is required"), which a project API key account cannot send, so they are offered to personal tokens only.
  patches: ["get", "post"].map((method) => ({
    op: "replace" as const,
    path: `/paths/~1api~1v1~1comments/${method}/security`,
    value: [{ "Personal Access Token": [] }],
  })),
} satisfies OpenapiToolNamesOptions;

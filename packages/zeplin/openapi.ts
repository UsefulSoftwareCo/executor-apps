import type { OpenapiToolNamesOptions } from "apps/openapi";

// Zeplin's own description (github.com/zeplin/openapi) declares OAuth URLs as relative paths,
// so the schemes are restated here with absolute URLs. The two OAuth endpoints are not tools.
export const options = {
  source: { url: "https://raw.githubusercontent.com/zeplin/openapi/main/descriptions/main.json" },
  allowedOrigin: "https://api.zeplin.dev",
  securitySchemes: {
    PersonalAccessToken: { type: "http", scheme: "bearer" },
    OAuth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://api.zeplin.dev/v1/oauth/authorize",
          tokenUrl: "https://api.zeplin.dev/v1/oauth/token",
          scopes: {},
        },
      },
    },
  },
  fallbackSecurity: [{ PersonalAccessToken: [] }, { OAuth2: [] }] as Array<Record<string, string[]>>,
  methods: {
    token: [{ scheme: "PersonalAccessToken", field: "token", part: "value", prefix: "" }],
  },
  oauth: ["OAuth2"],
  patches: [
    { op: "remove", path: "/paths/~1v1~1oauth~1authorize" },
    { op: "remove", path: "/paths/~1v1~1oauth~1token" },
  ],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares only oauth2 globally. Service tokens go in the Authorization header as
// "<service token id>:<service token>", so the global security is removed and replaced by a fallback accepting either.
export const options = {
  source: { url: "https://planetscale.com/docs/openapi.yaml" },
  allowedOrigin: "https://api.planetscale.com",
  securitySchemes: {
    oauth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://app.planetscale.com/oauth/authorize",
          tokenUrl: "https://auth.planetscale.com/oauth/token",
          scopes: {},
        },
      },
    },
    serviceToken: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { token: [{ scheme: "serviceToken", field: "token", part: "value", prefix: "" }] },
  oauth: ["oauth2"],
  patches: [{ op: "remove", path: "/security" }],
  fallbackSecurity: [{ oauth2: [] as string[] }, { serviceToken: [] as string[] }] as { [x: string]: string[] }[],
} satisfies OpenapiToolNamesOptions;

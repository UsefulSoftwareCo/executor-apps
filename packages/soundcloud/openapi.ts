import type { OpenapiToolNamesOptions } from "apps/openapi";

// SoundCloud's document declares an Authorization header scheme, "AuthHeader", whose value is
// "OAuth ACCESS_TOKEN", plus an OAuth 2.1 scheme that carries no scopes.
export const options = {
  source: { url: "https://developers.soundcloud.com/docs/api/explorer/api.json" },
  allowedOrigin: "https://api.soundcloud.com",
  securitySchemes: { AuthHeader: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    oauth: [{ scheme: "AuthHeader", field: "access_token", part: "value", prefix: "OAuth " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

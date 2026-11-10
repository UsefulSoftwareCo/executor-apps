import type { OpenapiToolNamesOptions } from "apps/openapi";

// Spotify's document declares one OAuth 2.0 scheme, "oauth_2_0"; the access token is sent as a bearer token.
export const options = {
  source: { url: "https://developer.spotify.com/reference/web-api/open-api-schema.yaml" },
  allowedOrigin: "https://api.spotify.com",
  securitySchemes: { oauth_2_0: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "oauth_2_0", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

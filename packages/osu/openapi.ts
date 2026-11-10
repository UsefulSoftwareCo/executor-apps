import type { OpenapiToolNamesOptions } from "apps/openapi";

// The osu!web description declares a single bearer scheme.
export const options = {
  source: { url: "https://osu.ppy.sh/docs/openapi.yaml" },
  allowedOrigin: "https://osu.ppy.sh",
  securitySchemes: { default: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "default", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

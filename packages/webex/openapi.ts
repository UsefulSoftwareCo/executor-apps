import type { OpenapiToolNamesOptions } from "apps/openapi";

// Webex publishes its official OpenAPI 3 documents in https://github.com/webex/webex-openapi-specs
// (public-spec/). They declare no servers and use paths relative to https://webexapis.com/v1, so every
// one is mounted under its own key with that base. Bearer tokens (personal access token or OAuth access
// token) authenticate every operation; the documents' own schemes are empty placeholders.
const root = "https://raw.githubusercontent.com/webex/webex-openapi-specs/main/public-spec";

const specs = {
  messaging: "webex-messaging",
  meetings: "webex-meeting",
  admin: "webex-admin",
  devices: "webex-device",
  calling: "webex-cloud-calling",
} as const;

const common = {
  allowedOrigin: "https://webexapis.com",
  baseUrl: "https://webexapis.com/v1",
  securitySchemes: {
    bearer: { type: "http", scheme: "bearer" },
    "bearer-key": { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: ["bearer", "bearer-key"].map((scheme) => ({
      scheme,
      field: "token",
      part: "value" as const,
      prefix: "",
    })),
    oauth: ["bearer", "bearer-key"].map((scheme) => ({
      scheme,
      field: "access_token",
      part: "value" as const,
      prefix: "",
    })),
  },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

export const sources: Record<string, OpenapiToolNamesOptions> = Object.fromEntries(
  Object.entries(specs).map(([key, file]) => [key, { ...common, source: { url: `${root}/${file}.json` } }]),
);

// scripts/tools.ts checks this one.
export const options = sources.messaging satisfies OpenapiToolNamesOptions;

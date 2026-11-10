import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec's create-dummy-test operation is documented as an internal SDK-generation endpoint, so it is removed.
// No baseUrl is set: each operation's own servers are honored, so the upload operations (upload.imagekit.io)
// are skipped as multiple_hosts instead of being sent to api.imagekit.io.
const patches = [{ op: "remove", path: "/paths/~1v1~1dummy~1test" }] as unknown as NonNullable<
  OpenapiToolNamesOptions["patches"]
>;

// ImageKit's official OpenAPI document. Authentication is HTTP Basic with the private API key as the username
// and an empty password. Upload operations live on upload.imagekit.io and are skipped as multiple_hosts.
export const options = {
  source: { url: "https://raw.githubusercontent.com/imagekit-developer/openapi/main/openapi.yml" },
  allowedOrigin: "https://api.imagekit.io",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  fallbackSecurity: [{ basicAuth: [] }] as Array<Record<string, string[]>>,
  methods: {
    apiKey: [{ scheme: "basicAuth", field: "privateKey", part: "username", prefix: "" }],
  },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

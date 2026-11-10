import type { OpenapiToolNamesOptions } from "apps/openapi";

// Jamf Pro is hosted per customer, normally <name>.jamfcloud.com. Every Jamf Pro server publishes
// the OpenAPI 3 document of its own version, without authentication, at /api/schema.
export const instanceHost = (input: string) => {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.jamfcloud\.com$/.test(host))
    throw new Error("Enter your Jamf Pro host, for example acme.jamfcloud.com.");
  return host;
};

// The document declares Bearer for nearly every operation. The real bearer token is obtained in
// index.ts (OAuth client credentials or a basic-auth token request) and set on each request there;
// the method entries only tell the compiler that both account methods can authorize those tools.
export const jamfOptions = (instance: string) => {
  const origin = `https://${instanceHost(instance)}`;
  return {
    source: { url: `${origin}/api/schema` },
    allowedOrigin: origin,
    baseUrl: `${origin}/api`,
    securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
    methods: {
      clientCredentials: [{ scheme: "Bearer", field: "clientId", part: "value", prefix: "" }],
      password: [{ scheme: "Bearer", field: "username", part: "value", prefix: "" }],
    },
    oauth: [],
  } satisfies OpenapiToolNamesOptions;
};

export const options = jamfOptions("example.jamfcloud.com");

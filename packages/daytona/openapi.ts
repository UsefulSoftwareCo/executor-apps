import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Daytona product, three official specs listed at https://www.daytona.io/docs/en/tools/api/.
// index.ts mounts each under its own key.
//
// Platform API: the description declares only http://localhost:3000 as a server, so baseUrl points the
// tools at the hosted API. Its oauth2 scheme is Daytona's own dashboard login, so only the API key
// (bearer) method is wired. Alternate source URL with identical content: https://daytona.io/openapi.json.
export const platformOptions = {
  source: { url: "https://www.daytona.io/docs/openapi.json" },
  allowedOrigin: "https://app.daytona.io",
  baseUrl: "https://app.daytona.io/api",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/daytona.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1health/get/security", value: [] },
    { op: "add", path: "/paths/~1config/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// Toolbox API: runs inside a sandbox through the proxy at https://proxy.app.daytona.io/toolbox/{sandboxId}.
// pathPrefix turns {sandboxId} into a required argument of every tool. The spec's security scheme is an
// apiKey header named Authorization whose value is "Bearer <API key>".
export const toolboxOptions = {
  source: { url: "https://www.daytona.io/docs/toolbox-openapi.json" },
  allowedOrigin: "https://proxy.app.daytona.io",
  baseUrl: "https://proxy.app.daytona.io",
  pathPrefix: "/toolbox/{sandboxId}",
  securitySchemes: { Bearer: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ Bearer: [] }],
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// The Analytics API (https://www.daytona.io/docs/analytics-openapi.json) is not mounted: its scheme takes "JWT
// token or Admin API key", and nothing documents that a dashboard API key works there (README).
export const apis = { platform: platformOptions, toolbox: toolboxOptions } as const;

// scripts/tools.ts reads `options`; the Platform API is the main one.
export const options = platformOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Appcircle product, twelve official module specs listed in the Swagger UI at
// https://api.appcircle.io/openapi/index.html. The auth module is not mounted: index.ts exchanges the
// Personal Access Key for a token itself.
const api = (module: string) =>
  ({
    source: { url: `https://api.appcircle.io/openapi/modules/${module}` },
    allowedOrigin: "https://api.appcircle.io",
    securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "Bearer", field: "personalAccessKey", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  "build": api("build"),
  "distribution": api("distribution"),
  "signing-identity": api("signing-identity"),
  "license": api("license"),
  "identity": api("identity"),
  "store-credential": api("store-credential"),
  "report": api("report"),
  "task": api("task"),
  "store": api("store"),
  "store-report": api("store-report"),
  "webhook": api("webhook"),
  "publish": api("publish"),
} as const;

// scripts/tools.ts reads `options`; the Build module is the main one.
export const options = apis.build;

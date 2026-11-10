import type { OpenapiToolNamesOptions } from "apps/openapi";

// OneSignal's official spec (OneSignal/api) declares two bearer schemes: app_key for operations
// scoped to one app and user_key for organization-level operations (listing and creating apps).
// Both are sent as `Authorization: Key <key>`.
export const options = {
  source: { url: "https://raw.githubusercontent.com/OneSignal/api/main/api.json" },
  allowedOrigin: "https://api.onesignal.com",
  // The spec lists the legacy https://onesignal.com/api/v1; the vendor docs serve the REST API at api.onesignal.com.
  baseUrl: "https://api.onesignal.com",
  // delete_user has no security in the spec and there is no global security.
  fallbackSecurity: [{ app_key: [] }],
  securitySchemes: {
    app_key: { type: "http", scheme: "bearer" },
    user_key: { type: "http", scheme: "bearer" },
  },
  methods: {
    appKey: [{ scheme: "app_key", field: "token", part: "value", prefix: "Key " }],
    organizationKey: [{ scheme: "user_key", field: "token", part: "value", prefix: "Key " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

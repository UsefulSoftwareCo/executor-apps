import type { OpenapiToolNamesOptions } from "apps/openapi";

// AddressZen's official OpenAPI 3.0.3 document (info.version 4.1.1). Both security schemes are
// HTTP bearer: ApiKey (ak_..., or an sl_ licensee key) for lookups, ManagementKey (uk_...) for
// everything under /keys/{key}.
export const options = {
  source: { url: "https://openapi.addresszen.com/openapi.json" },
  allowedOrigin: "https://api.addresszen.com",
  securitySchemes: {
    ApiKey: { type: "http", scheme: "bearer" },
    ManagementKey: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }],
    managementKey: [
      { scheme: "ApiKey", field: "token", part: "value", prefix: "" },
      { scheme: "ManagementKey", field: "managementKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

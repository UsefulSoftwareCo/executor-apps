import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://stoplight.io/api/v1/projects/endorsal/endorsal/nodes/Public%20API/Endorsal.v1.json?fromExportButton=true&snapshotType=http_service&deref=optimizedBundle",
  },
  allowedOrigin: "https://api.endorsal.io",
  securitySchemes: { Authorization: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

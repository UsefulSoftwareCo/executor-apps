import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cloudinary's official combined API schema (Upload, Admin, metadata, search, ...). Every path is
// /v1_1/{cloud_name}/..., so cloud_name is a tool argument. Authentication is HTTP Basic with the API key and secret.
export const options = {
  source: { url: "https://raw.githubusercontent.com/cloudinary/api-schemas/main/api/schema.yml" },
  allowedOrigin: "https://api.cloudinary.com",
  baseUrl: "https://api.cloudinary.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" }, bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ basicAuth: [] }, { bearer: [] }] as Array<Record<string, string[]>>,
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "apiKey", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "apiSecret", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

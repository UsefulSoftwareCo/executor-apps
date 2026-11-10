import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document's global security lists the header key and the query key in one requirement,
// which reads as "both". The API accepts either, so keep only the header (the key stays out of URLs).
// Array values are valid at runtime; the declared patch type only admits objects.
const patches = [
  { op: "replace", path: "/security", value: [{ ApiKeyInHeader: [] }] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://v2.api2pdf.com/swagger/v2/swagger.json" },
  baseUrl: "https://v2.api2pdf.com",
  allowedOrigin: "https://v2.api2pdf.com",
  securitySchemes: {
    ApiKeyInHeader: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyInHeader", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// WaiverFile's Swagger 2.0 document declares `apiKey` as a header scheme, but the API
// reads both `apiKey` and `siteID` from the query string (see the operations' parameters).
export const options = {
  source: { url: "https://api.waiverfile.com/swagger/docs/v1" },
  allowedOrigin: "https://api.waiverfile.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "query", name: "apiKey" },
    siteID: { type: "apiKey", in: "query", name: "siteID" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ apiKey: [], siteID: [] }],
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "apiKey", part: "value", prefix: "" },
      { scheme: "siteID", field: "siteID", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

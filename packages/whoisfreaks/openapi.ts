import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official WhoisFreaks OpenAPI 3.0.3 document, shipped in the vendor's SDK repository (WhoisFreaks/whoisfreaks-go).
// Left out: the key-rotation operation (a GET that invalidates the current key, removed by patch), the threat-feed
// file downloads (binary CSV, removed by patch), and the bulk database downloads, which the document serves from
// `files.whoisfreaks.com`; the compiler skips them because they live on a second origin.
export const options = {
  source: { url: "https://raw.githubusercontent.com/WhoisFreaks/whoisfreaks-go/main/api/openapi.yaml" },
  allowedOrigin: "https://api.whoisfreaks.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "apiKey" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The POST bulk lookups only read data.
  kinds: {
    bulkWhois: "query",
    dnsBulk: "query",
    bulkDomainAvailabilityV2: "query",
    bulkGeolocation: "query",
    bulkIpReputation: "query",
  },
  patches: [
    { op: "remove", path: "/paths/~1v1.0~1api-key~1rotate" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1phishing" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1phishing~1sample" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1malware" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1malware~1sample" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1spam" },
    { op: "remove", path: "/paths/~1v3.4~1download~1threat-feed~1spam~1sample" },
  ],
} satisfies OpenapiToolNamesOptions;

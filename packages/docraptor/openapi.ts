import type { OpenapiToolNamesOptions } from "apps/openapi";

// DocRaptor's official client-generation spec (Swagger 2.0), maintained in its own GitHub repo.
export const options = {
  source: { url: "https://raw.githubusercontent.com/DocRaptor/docraptor-swagger/ebbd1928879169da90bad0ae161676b03a9c540c/docraptor.yaml" },
  // The spec says host docraptor.com; the vendor docs put the API at api.docraptor.com, so credentials go there.
  baseUrl: "https://api.docraptor.com",
  allowedOrigin: "https://api.docraptor.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The API key is the basic-auth username; the password stays empty.
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

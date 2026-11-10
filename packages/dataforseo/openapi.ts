import type { OpenapiToolNamesOptions } from "apps/openapi";

// DataForSEO's official full specification, published in github.com/dataforseo/OpenApiDocumentation.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/dataforseo/OpenApiDocumentation/master/openapi_specification.yaml",
  },
  allowedOrigin: "https://api.dataforseo.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The API login shown on the API access page is the Basic username; the API password is generated in the dashboard.
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "login", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "password", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

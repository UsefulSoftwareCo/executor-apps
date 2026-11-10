import type { OpenapiToolNamesOptions } from "apps/openapi";

// Labs64's official Swagger 2.0 definition behind the NetLicensing RESTful API Test Center.
export const options = {
  source: { url: "https://netlicensing.io/NetLicensing-API/v2.x/netlicensing.json" },
  allowedOrigin: "https://go.netlicensing.io",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // An API key is sent as HTTP Basic with the literal username "apiKey" and the key as the password.
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "username", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "token", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

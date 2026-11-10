import type { OpenapiToolNamesOptions } from "apps/openapi";

// BambooHR is hosted per company (<companyDomain>.bamboohr.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://companysubdomain.bamboohr.com";

export const options = {
  source: { url: "https://openapi.bamboohr.io/main/latest/docs/openapi/public-openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // Only the API key (HTTP Basic) is offered. BambooHR OAuth needs per-company authorize/token
  // URLs, but the framework declares oauth2 authorizationUrl/tokenUrl as static strings.
  securitySchemes: { basic: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basic", field: "apiKey", part: "username", prefix: "" },
      // BambooHR docs: the API key is the Basic username and the password is any random string
      // (their example uses "x"). index.ts supplies this non-secret constant as a derived field.
      { scheme: "basic", field: "basicPassword", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

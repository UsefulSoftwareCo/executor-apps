import type { OpenapiToolNamesOptions } from "apps/openapi";

// Epic's Fortnite Data API is public: the document defines an unused oauth2 clientCredentials
// scheme (Auth, tokenUrl https://api.epicgames.dev/epic/oauth/v1/token) that no operation or
// top-level `security` references, and the API answers without credentials, so there are no
// credential bindings.
export const options = {
  source: { url: "https://api.fortnite.com/ecosystem/v1/docs/openapi.yaml" },
  allowedOrigin: "https://api.fortnite.com",
  securitySchemes: {},
  methods: {},
  oauth: [],
} satisfies OpenapiToolNamesOptions;

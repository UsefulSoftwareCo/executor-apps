import type { OpenapiToolNamesOptions } from "apps/openapi";

// listmonk's official OpenAPI 3.0 document, kept in the knadh/listmonk repository (docs/swagger/collections.yaml). It
// declares only a localhost server and no security scheme, so index.ts pins each account's own origin and adds the
// Authorization header itself.
export const placeholderOrigin = "https://listmonk.example.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/knadh/listmonk/master/docs/swagger/collections.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  securitySchemes: {},
  methods: {},
  oauth: [],
} satisfies OpenapiToolNamesOptions;

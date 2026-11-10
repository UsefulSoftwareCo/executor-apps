import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is a verbatim snapshot (retrieved 2026-10-12) of Elai's own ReadMe-hosted document
// (https://dash.readme.com/api/v1/api-registry/1j85n432mtn498yc, id from oasPublicUrl on elai.readme.io). It declares an
// apiKey header scheme on Authorization with a bearer format, so the value needs the "Bearer " prefix.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://apis.elai.io",
  securitySchemes: { sec0: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ sec0: [] }],
  methods: { apiKey: [{ scheme: "sec0", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

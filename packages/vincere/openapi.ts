import type { OpenapiToolNamesOptions } from "apps/openapi";
import patches from "./patches.json" with { type: "json" };

// Vincere's official OpenAPI 3.1 document, linked from https://api.vincere.io (the RapiDoc page loads ./vapi.yaml).
// The API lives on each customer's own host, https://<tenant>.vincere.io/api/v2. Every request carries an
// `x-api-key` header (declared in the document) and an `id-token` header (minted from a refresh token; added in
// index.ts because the document models it as an OAuth scheme with a non-standard header alias).
export const apiKeyScheme = { type: "apiKey", in: "header", name: "x-api-key" } as const;

export const optionsFor = (tenant: string) =>
  ({
    source: { url: "https://api.vincere.io/vapi.yaml" },
    allowedOrigin: `https://${tenant}.vincere.io`,
    baseUrl: `https://${tenant}.vincere.io/api/v2`,
    securitySchemes: { "default-apikey": apiKeyScheme },
    methods: {
      credentials: [{ scheme: "default-apikey", field: "apiKey", part: "value", prefix: "" }],
    },
    oauth: [],
    // The document's global security asks for the OAuth scheme as well as the key; the id-token header is added by
    // the app's fetch, so only the key scheme is declared here.
    //
    // The compiler follows only #/components/schemas/<name> references; the document also points at single
    // properties of schemas. patches.json (made by gen-patches.py from the published document) inlines those.
    patches: [{ op: "replace", path: "/security", value: [{ "default-apikey": [] }] }, ...patches] as NonNullable<
      OpenapiToolNamesOptions["patches"]
    >,
  }) satisfies OpenapiToolNamesOptions;

// scripts/tools.ts checks this export.
export const options = optionsFor("example");

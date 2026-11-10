import type { OpenapiToolNamesOptions } from "apps/openapi";

// Adobe's official Marketo Engage REST API Swagger 2.0 documents, published in the AdobeDocs/marketo-apis repository
// (the source of https://developer.adobe.com/marketo-apis/). Marketo splits its REST API into one document per area
// (Lead Database, Assets, User Management); each is mounted under its own key in one router. Every document lists
// `localhost:8080` as its host, so index.ts pins each account's own `<munchkin-id>.mktorest.com` origin. The
// placeholder below is only used to compile.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/AdobeDocs/marketo-apis/main/static/swagger-${name}.json`,
});

export const placeholderOrigin = "https://000-aaa-000.mktorest.com";

// The documents declare no security scheme. index.ts mints an access token from the client credentials and sends it
// as a bearer token on every request to the account's origin, so both api and token accounts fill one bearer scheme.
const api = (name: string) =>
  ({
    source: spec(name),
    allowedOrigin: placeholderOrigin,
    baseUrl: placeholderOrigin,
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    methods: { clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const leadsOptions = api("mapi");
export const assetsOptions = api("asset");
export const usersOptions = api("user");

// scripts/tools.ts reads `options`.
export const options = leadsOptions;

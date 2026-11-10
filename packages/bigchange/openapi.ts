import type { OpenapiToolNamesOptions } from "apps/openapi";

// BigChange's official OpenAPI documents, the ones the developer portal (https://developers.bigchange.com) renders:
// the REST API, Asset Management and Webhooks. They are one product, mounted under separate keys by index.ts.
// Every operation takes a required Customer-Id header; index.ts overwrites it with the connected account's
// customer id and adds the bearer token minted from the client credentials.
const origin = "https://api.bigchange.com";

const api = (path: string) =>
  ({
    source: { url: `${origin}/swagger/${path}swagger.json` },
    allowedOrigin: origin,
    baseUrl: origin,
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    methods: { clientCredentials: [{ scheme: "bearer", field: "clientSecret", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const restOptions = api("v1/");
export const assetsOptions = api("asset-management/v1/");
export const webhooksOptions = api("webhooks/v1/");
export const options = restOptions;

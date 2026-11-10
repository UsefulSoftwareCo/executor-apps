import type { OpenapiToolNamesOptions } from "apps/openapi";

// One TinyFish product, five official specs served by https://agent.tinyfish.ai/v1/openapi/<name>.
// index.ts mounts each under its own key.
const api = (name: string, origin: string) =>
  ({
    source: { url: `https://agent.tinyfish.ai/v1/openapi/${name}` },
    allowedOrigin: origin,
    securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
    methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const mainOptions = api("main", "https://agent.tinyfish.ai");
export const researchOptions = api("research", "https://agent.tinyfish.ai");
export const searchOptions = api("search", "https://api.search.tinyfish.ai");
export const fetchOptions = api("fetch", "https://api.fetch.tinyfish.ai");
export const browserOptions = api("browser", "https://api.browser.tinyfish.ai");

// Used by scripts/tools.ts.
export const options = mainOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// DataRobot runs one managed cloud per region; each serves the same API on its own host.
export const regions = ["app.datarobot.com", "app.eu.datarobot.com", "app.jp.datarobot.com"] as const;

export const siteUrl = (endpoint: string) => {
  const host = endpoint.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!(regions as readonly string[]).includes(host))
    throw new Error(`Enter your DataRobot host: ${regions.join(", ")}.`);
  return `https://${host}`;
};

// The document declares a BearerAuth scheme; the provider's request template sends the bearer
// header, so security is cleared. Paths already start with /api/v2 and the server is "/".
export const datarobotOptions = (endpoint: string) =>
  ({
    source: { url: "https://app.datarobot.com/api/v2/openapi.yaml" },
    allowedOrigin: siteUrl(endpoint),
    baseUrl: siteUrl(endpoint),
    securitySchemes: {},
    methods: {},
    oauth: [],
    patches: [{ op: "add" as const, path: "/security", value: [] }],
  }) satisfies OpenapiToolNamesOptions;

export const options = datarobotOptions("app.datarobot.com");

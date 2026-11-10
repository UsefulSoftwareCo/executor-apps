import type { OpenapiToolNamesOptions } from "apps/openapi";

const source = { url: "https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json" };

// API token accounts talk to the site directly: https://<site>.atlassian.net/wiki/api/v2.
export const siteUrl = (site: string) => {
  if (!/^[a-z0-9-]+$/i.test(site)) throw new Error("Confluence site must be the <site> in <site>.atlassian.net (letters, digits, hyphens)");
  return `https://${site}.atlassian.net`;
};

export const tokenOptions = (site: string) =>
  ({
    source,
    allowedOrigin: siteUrl(site),
    baseUrl: `${siteUrl(site)}/wiki/api/v2`,
    securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
    // The document declares no security; send the account's credential on every operation.
    fallbackSecurity: [{ basicAuth: [] }],
    methods: {
      token: [
        { scheme: "basicAuth", field: "email", part: "username", prefix: "" },
        { scheme: "basicAuth", field: "token", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// OAuth (3LO) tokens only work through the gateway, addressed by the site's cloud id.
export const oauthOptions = {
  source,
  allowedOrigin: "https://api.atlassian.com",
  baseUrl: "https://api.atlassian.com",
  pathPrefix: "/ex/confluence/{cloudId}/wiki/api/v2",
  // The document's operations require its oAuthDefinitions scheme. The provider's OAuth method is
  // OAuth2, so its access token is bound to that scheme as the bearer token the gateway expects.
  securitySchemes: { oAuthDefinitions: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ oAuthDefinitions: [] }],
  methods: { OAuth2: [{ scheme: "oAuthDefinitions", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const options = tokenOptions("your-domain");

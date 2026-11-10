import type { OpenapiToolNamesOptions } from "apps/openapi";

const source = { url: "https://dac-static.atlassian.com/cloud/jira/platform/swagger-v3.v3.json" };

// API token accounts talk to the site directly: https://<site>.atlassian.net/rest/api/3.
export const siteUrl = (site: string) => {
  if (!/^[a-z0-9-]+$/i.test(site)) throw new Error("Jira site must be the <site> in <site>.atlassian.net (letters, digits, hyphens)");
  return `https://${site}.atlassian.net`;
};

export const tokenOptions = (site: string) =>
  ({
    source,
    allowedOrigin: siteUrl(site),
    baseUrl: siteUrl(site),
    securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
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
  pathPrefix: "/ex/jira/{cloudId}",
  securitySchemes: {
    OAuth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://auth.atlassian.com/authorize",
          tokenUrl: "https://auth.atlassian.com/oauth/token",
          scopes: {},
        },
      },
    },
  },
  methods: {},
  oauth: ["OAuth2"],
} satisfies OpenapiToolNamesOptions;

export const options = tokenOptions("your-domain");

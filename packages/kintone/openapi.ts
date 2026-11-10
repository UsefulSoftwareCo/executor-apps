import type { OpenapiToolNamesOptions } from "apps/openapi";

// Kintone sites live on a per-customer host: <subdomain>.cybozu.com, or the same subdomain on one
// of Cybozu's other regional domains.
const domains = ["cybozu.com", "kintone.com", "cybozu.cn"] as const;

export const siteUrl = (input: string) => {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const match = /^([a-z0-9][a-z0-9-]{0,61}[a-z0-9]|[a-z0-9])\.([a-z0-9.-]+)$/.exec(host);
  if (match === null || !(domains as readonly string[]).includes(match[2]!))
    throw new Error(`Enter your Kintone host, like example.cybozu.com (domains: ${domains.join(", ")}).`);
  return `https://${host}`;
};

// The document declares API token, password and OAuth security per operation. The token and the
// password header are declared here so every operation imports; the password header carries a
// base64 value that the account builds itself, and index.ts overwrites it on every request.
// OAuth is not offered (per-site endpoints), so that scheme is left undeclared.
export const kintoneOptions = (site: string) =>
  ({
    source: { url: "https://raw.githubusercontent.com/kintone/openapi-spec/main/openapi.json" },
    allowedOrigin: siteUrl(site),
    baseUrl: siteUrl(site),
    securitySchemes: {
      apiToken: { type: "apiKey", in: "header", name: "X-Cybozu-API-Token" },
      passwordAuth: { type: "apiKey", in: "header", name: "X-Cybozu-Authorization" },
    },
    methods: {
      apiToken: [{ scheme: "apiToken", field: "token", part: "value", prefix: "" }],
      password: [{ scheme: "passwordAuth", field: "login", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = kintoneOptions("example.cybozu.com");

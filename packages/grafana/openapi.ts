import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every Grafana Cloud stack lives on its own host: https://<stack>.grafana.net.
export const siteUrl = (domain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)\.grafana\.net\/?$/.exec(domain.trim().toLowerCase());
  if (match === null) throw new Error("Enter your Grafana Cloud host, for example mystack.grafana.net.");
  return `https://${match[1]}.grafana.net`;
};

// The document declares an Authorization api_key scheme; the provider's request template sends the
// bearer header instead, so security is cleared.
export const grafanaOptions = (domain: string) =>
  ({
    source: { url: "https://raw.githubusercontent.com/grafana/grafana/main/public/openapi3.json" },
    allowedOrigin: siteUrl(domain),
    baseUrl: `${siteUrl(domain)}/api`,
    securitySchemes: {},
    methods: {},
    oauth: [],
    patches: [{ op: "add" as const, path: "/security", value: [] }],
  }) satisfies OpenapiToolNamesOptions;

export const options = grafanaOptions("example.grafana.net");

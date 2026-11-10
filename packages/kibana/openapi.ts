import type { OpenapiToolNamesOptions } from "apps/openapi";

// Kibana runs on Elastic Cloud (https://<id>.kb.<region>.<provider>.elastic-cloud.com) or on a
// self-managed host, so every account has its own origin.
export const siteUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
  } catch {
    throw new Error("Enter your Kibana URL, for example https://my-deployment.kb.us-east-1.aws.elastic-cloud.com.");
  }
  if (parsed.search !== "" || parsed.hash !== "" || parsed.username !== "")
    throw new Error("Enter only the Kibana base URL, without credentials, query or fragment.");
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
};

// Elastic's official Kibana OpenAPI document declares `https://{kibana_url}` as its server; the
// base URL comes from the account. Its apiKey scheme sends `Authorization: ApiKey <encoded>`.
export const kibanaOptions = (url: string) =>
  ({
    source: { url: "https://www.elastic.co/docs/api/doc/kibana.json" },
    allowedOrigin: new URL(siteUrl(url)).origin,
    baseUrl: siteUrl(url),
    securitySchemes: {
      apiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" },
      basicAuth: { type: "http", scheme: "basic" },
    },
    methods: {
      apiKey: [{ scheme: "apiKeyAuth", field: "apiKey", part: "value", prefix: "ApiKey " }],
      basic: [
        { scheme: "basicAuth", field: "username", part: "username", prefix: "" },
        { scheme: "basicAuth", field: "password", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = kibanaOptions("https://example.kb.us-east-1.aws.elastic-cloud.com");

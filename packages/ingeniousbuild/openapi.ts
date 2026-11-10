import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// Every INGENIOUS.BUILD workspace lives on its own host: https://<subdomain>.ingenious.build.
export const siteUrl = (subdomain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)(?:\.ingenious\.build)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter the <subdomain> of <subdomain>.ingenious.build.");
  return `https://${match[1]}.ingenious.build`;
};

// The public reference publishes one OpenAPI fragment per operation; spec.json is those fragments
// merged (header parameters for auth removed) because no single document is published.
export const openapiOptions = (subdomain: string) =>
  ({
    source: { document: document as never },
    allowedOrigin: siteUrl(subdomain),
    baseUrl: siteUrl(subdomain),
    securitySchemes: { accessToken: { type: "apiKey", in: "header", name: "AccessToken" } },
    methods: { accessToken: [{ scheme: "accessToken", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    fallbackSecurity: [{ accessToken: [] }],
  }) satisfies OpenapiToolNamesOptions;

export const options = openapiOptions("example");

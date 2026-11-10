import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// Langfuse Cloud runs one deployment per data region.
export const regionHosts = {
  eu: "cloud.langfuse.com",
  us: "us.cloud.langfuse.com",
  jp: "jp.cloud.langfuse.com",
  hipaa: "hipaa.cloud.langfuse.com",
} as const;

export const regionOrigin = (region: string) => {
  const host = (regionHosts as Record<string, string | undefined>)[region.trim().toLowerCase()];
  if (host === undefined) throw new Error("Region must be one of: eu, us, jp, hipaa.");
  return `https://${host}`;
};

// The public API uses HTTP Basic auth: public key as username, secret key as password. The document
// declares no servers, so baseUrl is set from the account's region.
export const langfuseOptions = (region: string) =>
  ({
    // openapi.json is the official YAML document converted to JSON: the generator rejects its YAML anchors.
    source: { document: document as never },
    allowedOrigin: regionOrigin(region),
    baseUrl: regionOrigin(region),
    securitySchemes: { BasicAuth: { type: "http", scheme: "basic" } },
    methods: {
      apiKey: [
        { scheme: "BasicAuth", field: "publicKey", part: "username", prefix: "" },
        { scheme: "BasicAuth", field: "secretKey", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = langfuseOptions("eu");

import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Pinata product, four official specs from https://github.com/PinataCloud/docs (served at
// https://docs.pinata.cloud/<name>.yaml). index.ts mounts each under its own key.
const credentials = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = (name: string, origin: string) =>
  ({
    source: { url: `https://docs.pinata.cloud/${name}.yaml` },
    allowedOrigin: origin,
    ...credentials,
  }) satisfies OpenapiToolNamesOptions;

export const v3Options = api("pinata-api-v3", "https://api.pinata.cloud");
export const ipfsOptions = api("pinata-api-ipfs", "https://api.pinata.cloud");
export const uploadsOptions = api("pinata-api-v3-uploads", "https://uploads.pinata.cloud");
export const x402Options = api("pinata-x402-api-v3", "https://api.pinata.cloud");

export const apis = { files: v3Options, ipfs: ipfsOptions, uploads: uploadsOptions, x402: x402Options } as const;

// scripts/tools.ts reads `options`.
export const options = v3Options;

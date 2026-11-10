import type { OpenapiToolNamesOptions } from "apps/openapi";

// Clover runs one API host per region; a merchant lives in exactly one.
export const regions = {
  na: "https://api.clover.com",
  eu: "https://api.eu.clover.com",
  la: "https://api.la.clover.com",
  sandbox: "https://apisandbox.dev.clover.com",
} as const;

export type Region = keyof typeof regions;

// The connect form rejects any other value, so this only narrows the decoded JSON type.
export const regionUrl = (region: unknown) => {
  if (typeof region === "string" && Object.hasOwn(regions, region)) return regions[region as Region];
  throw new Error("Region must be one of: na, eu, la, sandbox.");
};

// Clover's Platform API definition, published through its ReadMe developer hub (docs.clover.com).
export const optionsFor = (region: unknown) => {
  const url = regionUrl(region);
  return {
    source: { url: "https://dash.readme.com/api/v1/api-registry/1836s2z4smohp2458" },
    allowedOrigin: url,
    baseUrl: url,
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    methods: { apiToken: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  } satisfies OpenapiToolNamesOptions;
};

export const options = optionsFor("na");

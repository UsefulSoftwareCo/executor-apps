import type { OpenapiToolNamesOptions } from "apps/openapi";

// Nylas runs one API host per data-residency region; an application lives in exactly one.
export const regions = {
  us: "https://api.us.nylas.com",
  eu: "https://api.eu.nylas.com",
} as const;

export type Region = keyof typeof regions;

// The connect form rejects any other value, so this only narrows the decoded JSON type.
export const regionUrl = (region: unknown) => {
  if (typeof region === "string" && Object.hasOwn(regions, region)) return regions[region as Region];
  throw new Error("Region must be one of: us, eu.");
};

// Nylas's official OpenAPI 3.1 document for the v3 API, published on developer.nylas.com.
export const optionsFor = (region: unknown) => {
  const url = regionUrl(region);
  return {
    source: { url: "https://developer.nylas.com/openapi.yaml" },
    allowedOrigin: url,
    baseUrl: url,
    securitySchemes: { NYLAS_API_KEY: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "NYLAS_API_KEY", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  } satisfies OpenapiToolNamesOptions;
};

export const options = optionsFor("us");

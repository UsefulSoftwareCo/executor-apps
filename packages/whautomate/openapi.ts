import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Whautomate documents two API hosts, one per data region (help.whautomate.com/product-guides/whautomate-rest-api).
export const regions = {
  global: "https://api.whautomate.com",
  india: "https://api.in.whautomate.com",
} as const;

export const originOf = (region: string) => {
  const key = region.trim().toLowerCase();
  if (key in regions) return regions[key as keyof typeof regions];
  throw new Error(`Region must be one of: ${Object.keys(regions).join(", ")}.`);
};

export const options = {
  source: { document },
  allowedOrigin: regions.global,
  baseUrl: regions.global,
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

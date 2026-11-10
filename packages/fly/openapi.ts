import type { OpenapiToolNamesOptions } from "apps/openapi";

// Fly publishes two official documents for the product: the Machines API and the Sprites API.
export const machinesOptions = {
  source: { url: "https://docs.fly.io/api/machines/openapi.json" },
  allowedOrigin: "https://api.machines.dev",
  securitySchemes: { FlyBearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "FlyBearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const spritesOptions = {
  source: { url: "https://api.sprites.dev/openapi.json" },
  allowedOrigin: "https://api.sprites.dev",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { spritesToken: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const apis = { machines: machinesOptions, sprites: spritesOptions } as const;

// scripts/tools.ts reads `options`; the Machines API is the main one.
export const options = machinesOptions;

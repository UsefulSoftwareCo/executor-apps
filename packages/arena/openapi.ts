import type { OpenapiToolNamesOptions } from "apps/openapi";

const patches = [
  { op: "remove", path: "/paths/~1v3~1oauth~1token" },
  { op: "remove", path: "/paths/~1v3~1openapi" },
  { op: "remove", path: "/paths/~1v3~1openapi.json" },
  { op: "remove", path: "/paths/~1v3~1ping" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.are.na/v3/openapi.json" },
  allowedOrigin: "https://api.are.na",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

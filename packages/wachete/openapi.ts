import type { OpenapiToolNamesOptions } from "apps/openapi";

// Wachete's own Swagger document declares no servers or security; paths carry the
// /thirdparty/v1 prefix. The bearer token comes from the apilogin exchange in index.ts.
// The login, apilogin and invalidateTokens operations are removed: index.ts manages the token itself,
// and invalidateTokens would revoke the cached token behind the app's back.
const patches = [
  { op: "remove", path: "/paths/~1thirdparty~1v1~1user~1login" },
  { op: "remove", path: "/paths/~1thirdparty~1v1~1user~1apilogin" },
  { op: "remove", path: "/paths/~1thirdparty~1v1~1user~1invalidateTokens" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.wachete.com/swagger/v1/swagger.json" },
  allowedOrigin: "https://api.wachete.com",
  baseUrl: "https://api.wachete.com",
  securitySchemes: {},
  methods: {},
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

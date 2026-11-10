import type { OpenapiToolNamesOptions } from "apps/openapi";

// Routes left out: the catch-all proxies (`/gateway|tokenwise/{v1,v1beta,off/v1,on/v1}/{path}`, which
// also publish an OPTIONS verb and an `X-AI21-Key` header that a Bearer key is not documented to satisfy),
// the malformed `v1internal{path}` templates, `/harness/api/{path}` and `cli-config`, the stored
// provider-key routes, and the customer-specific `/solutions*/tlv_municipality` demo routes.
const removedPaths = [
  ...["gateway", "tokenwise"].flatMap((p) => [
    `/${p}/v1/{path}`,
    `/${p}/v1beta/{path}`,
    `/${p}/v1internal{path}`,
    `/${p}/off/v1/{path}`,
    `/${p}/on/v1/{path}`,
    `/${p}/settings/provider-keys`,
  ]),
  "/harness/api/{path}",
  "/harness/api/auth/cli-config",
  "/solutions/tlv_municipality/convrag",
  "/solutions-preview/tlv_municipality/convrag",
];
const pointer = (path: string) => path.replaceAll("~", "~0").replaceAll("/", "~1");

// AI21's description declares no servers or security schemes; every operation takes a bearer API key.
export const options = {
  source: { url: "https://api.ai21.com/openapi.json" },
  baseUrl: "https://api.ai21.com",
  allowedOrigin: "https://api.ai21.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: removedPaths.map((path) => ({ op: "remove" as const, path: `/paths/${pointer(path)}` })),
} satisfies OpenapiToolNamesOptions;

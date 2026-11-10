import type { OpenapiToolNamesOptions } from "apps/openapi";
import raw from "./spec.json" with { type: "json" };

// Drop non-API plumbing: /webhook-events is documentation only, and the OAuth endpoints are driven
// by Executor's connect flow (only token/info, used by the health check, stays).
const keep = (path: string) =>
  path !== "/webhook-events" && (!path.startsWith("/1.1/oauth/") || path === "/1.1/oauth/token/info");
const spec = {
  ...raw,
  paths: Object.fromEntries(Object.entries(raw.paths).filter(([path]) => keep(path))),
};

// Timely publishes its OpenAPI 3.1 document only inline in the developer portal page
// (https://developer.timely.com/), with no stable file URL, so a copy is vendored as spec.json.
export const options = {
  source: { document: spec as never },
  allowedOrigin: "https://api.timelyapp.com",
  securitySchemes: {
    oauth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://api.timelyapp.com/1.1/oauth/authorize",
          tokenUrl: "https://api.timelyapp.com/1.1/oauth/token",
          scopes: { manage: "Manage Timely data" },
        },
      },
    },
  },
  fallbackSecurity: [{ oauth2: ["manage"] }],
  methods: {},
  oauth: ["oauth2"],
} satisfies OpenapiToolNamesOptions;

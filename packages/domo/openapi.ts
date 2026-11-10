import type { OpenapiToolNamesOptions } from "apps/openapi";

// Domo's official Platform API (https://developer.domo.com), one OpenAPI document per resource from
// https://github.com/DomoApps/domo-documentation-hub/tree/main/openapi/platform. index.ts mounts each under its own
// key. Every document uses https://api.domo.com and a bearer token minted by the client credentials grant. The
// token endpoint's own document (authentication.yaml) is not mounted: Executor handles the grant.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/DomoApps/domo-documentation-hub/main/openapi/platform/${name}.yaml`,
});

const origin = "https://api.domo.com";

// Most documents name their bearer scheme bearerAuth; Cards and Embed use other names.
const credentials = (scheme: string) =>
  ({
    securitySchemes: { [scheme]: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ [scheme]: [] }],
    methods: { oauth: [{ scheme, field: "access_token", part: "value", prefix: "" }] },
    oauth: [],
  }) as const;

const api = <const K extends Record<string, "query">>(name: string, scheme = "bearerAuth", kinds?: K) =>
  ({
    source: spec(name),
    allowedOrigin: origin,
    baseUrl: origin,
    ...credentials(scheme),
    ...(kinds === undefined ? {} : { kinds }),
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  accounts: api("accounts"),
  activity: api("activity"),
  cards: api("cards", "oauth2Auth"),
  datasets: api("dataset", "bearerAuth", { postQueryExecute: "query" }),
  embed: api("embed", "API Key - 1"),
  groups: api("group"),
  pages: api("page"),
  projects: api("projects"),
  simple: api("simple"),
  streams: api("stream"),
  users: api("user"),
} as const;

// scripts/tools.ts reads `options`; Datasets is the main API.
export const options = apis.datasets;

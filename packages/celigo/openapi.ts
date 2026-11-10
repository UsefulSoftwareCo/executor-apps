import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Celigo product, 44 official OpenAPI documents (one per resource) published by Celigo in the
// @celigo/api-specs npm package, pinned to an exact version as the vendor recommends (bump after reviewing the diff): https://developer.celigo.com/api/using-the-api/openapi-specs
// index.ts mounts each under its own key and swaps in the account's regional origin; the US origin here is
// only used to compile.
const spec = (name: string) => ({ url: `https://cdn.jsdelivr.net/npm/@celigo/api-specs@0.2.87/dist/${name}.yml` });

const api = (name: string) =>
  ({
    source: spec(name),
    allowedOrigin: "https://api.integrator.io",
    baseUrl: "https://api.integrator.io",
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const specs = {
  account: api("account"),
  agent: api("agent"),
  aiAgent: api("ai-agent"),
  api: api("api"),
  apim: api("apim"),
  asynchelper: api("asynchelper"),
  audit: api("audit"),
  connection: api("connection"),
  connector: api("connector"),
  ediprofile: api("ediprofile"),
  editransaction: api("editransaction"),
  enduser: api("enduser"),
  environment: api("environment"),
  eventreport: api("eventreport"),
  export: api("export"),
  filedefinition: api("filedefinition"),
  filestorage: api("filestorage"),
  flow: api("flow"),
  guardrail: api("guardrail"),
  httpconnector: api("httpconnector"),
  httpconnectorendpoint: api("httpconnectorendpoint"),
  httpconnectorresource: api("httpconnectorresource"),
  iclient: api("iclient"),
  import: api("import"),
  integration: api("integration"),
  job: api("job"),
  lookupcache: api("lookupcache"),
  marketplace: api("marketplace"),
  mcpOauthProvider: api("mcp-oauth-provider"),
  mcpServer: api("mcp-server"),
  notification: api("notification"),
  processor: api("processor"),
  profile: api("profile"),
  recyclebin: api("recyclebin"),
  script: api("script"),
  stack: api("stack"),
  state: api("state"),
  subscription: api("subscription"),
  sync: api("sync"),
  tag: api("tag"),
  template: api("template"),
  tool: api("tool"),
  tradingpartnerconnector: api("tradingpartnerconnector"),
  user: api("user"),
} as const;

// scripts/tools.ts compiles this one; the full list is in specs.
export const options = specs.tag;

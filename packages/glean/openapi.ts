import type { OpenapiToolNamesOptions } from "apps/openapi";

// Glean's official OpenAPI documents, published by Glean at https://github.com/gleanwork/open-api
// (generated_specs). Every Glean deployment has its own host, https://<instance>-be.glean.com; index.ts
// swaps in the account's server. The placeholder origin below is only used to compile.
export const placeholderOrigin = "https://instance-name-be.glean.com";

const credentials = {
  securitySchemes: {
    APIToken: { type: "http", scheme: "bearer" },
    ActAs: { type: "apiKey", in: "header", name: "X-Glean-ActAs" },
  },
  methods: {
    token: [{ scheme: "APIToken", field: "token", part: "value", prefix: "" }],
    // Global tokens must name the user to act as.
    globalToken: [
      { scheme: "APIToken", field: "token", part: "value", prefix: "" },
      { scheme: "ActAs", field: "actAs", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/gleanwork/open-api/main/generated_specs/${name}.yaml`,
});

// Most Client API operations are POSTs that only read; they are queries so they need no approval.
export const clientOptions = {
  source: spec("client_rest"),
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  ...credentials,
  kinds: {
    getanswer: "query",
    listanswers: "query",
    checkdatasourceauth: "query",
    getchat: "query",
    listchats: "query",
    getchatapplication: "query",
    getchatfiles: "query",
    getChatFile: "query",
    getAgent: "query",
    getAgentSchemas: "query",
    searchAgents: "query",
    getcollection: "query",
    listcollections: "query",
    getdocpermissions: "query",
    getdocuments: "query",
    getdocumentsbyfacets: "query",
    insights: "query",
    messages: "query",
    getpin: "query",
    listpins: "query",
    adminsearch: "query",
    autocomplete: "query",
    feed: "query",
    recommendations: "query",
    search: "query",
    listentities: "query",
    people: "query",
    getPersonPhoto: "query",
    getshortcut: "query",
    listshortcuts: "query",
    summarize: "query",
    listverifications: "query",
    getActionPackAuthStatus: "query",
    getToolServerAuthStatus: "query",
    getToolServerTools: "query",
  },
} satisfies OpenapiToolNamesOptions;

export const indexingOptions = {
  source: spec("indexing"),
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`: report the Client API.
export const options = clientOptions;

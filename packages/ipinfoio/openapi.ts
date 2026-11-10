import type { OpenapiToolNamesOptions } from "apps/openapi";

// IPinfo splits one official document across two origins. The Lite, Core/Plus (lookup), places, batch and tools
// routes are served by https://api.ipinfo.io; the legacy routes (/{ip}, /me, /AS{asn}, /{ip}/company, ranges,
// domains, whois, the single-field routes) are served by https://ipinfo.io and return 404 on api.ipinfo.io.
// The document lists both hosts plus per-operation overrides, which compiles to "multiple_hosts", so index.ts
// mounts two copies of the document, each patched down to one origin and the paths that origin serves.
const removePath = (path: string) => ({ op: "remove", path: `/paths/${path}` }) as const;
const removeServers = (path: string) => ({ op: "remove", path: `/paths/${path}/get/servers` }) as const;

const common = {
  source: { url: "https://ipinfo.io/developers/openapi.yaml" },
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// api.ipinfo.io: Lite, Lookup, places, /ip, batch and tools.
export const apiOptions = {
  ...common,
  allowedOrigin: "https://api.ipinfo.io",
  baseUrl: "https://api.ipinfo.io",
  patches: [
    { op: "replace", path: "/servers", value: [{ url: "https://api.ipinfo.io" }] },
    removeServers("~1places~1{ip}"),
    removeServers("~1lite~1me"),
    removeServers("~1lite~1{ip}"),
    removeServers("~1lite~1me~1{field}"),
    removeServers("~1lite~1{ip}~1{field}"),
    removeServers("~1lookup~1me"),
    removeServers("~1lookup~1{ip}"),
    removeServers("~1lookup~1me~1{field}"),
    removeServers("~1lookup~1{ip}~1{field}"),
    removePath("~1"),
    removePath("~1{ip}"),
    removePath("~1me"),
    removePath("~1AS{asn}"),
    removePath("~1{ip}~1company"),
    removePath("~1{ip}~1carrier"),
    removePath("~1ranges~1{domain}"),
    removePath("~1domains~1{ip}"),
    removePath("~1{ip}~1abuse"),
    removePath("~1{ip}~1privacy"),
    removePath("~1resproxy~1{ip}"),
    removePath("~1{ip}~1privacy_extended"),
    removePath("~1whois~1net~1{whoisnetid}"),
    removePath("~1whois~1net~1{whoisip}"),
    removePath("~1whois~1net~1{domain}"),
    removePath("~1whois~1net~1AS{asn}"),
    removePath("~1whois~1org~1{whoisorgid}"),
    removePath("~1whois~1poc~1{whoispoc}"),
    removePath("~1{ip}~1ip"),
    removePath("~1hostname"),
    removePath("~1{ip}~1hostname"),
    removePath("~1city"),
    removePath("~1{ip}~1city"),
    removePath("~1region"),
    removePath("~1{ip}~1region"),
    removePath("~1country"),
    removePath("~1{ip}~1country"),
    removePath("~1loc"),
    removePath("~1{ip}~1loc"),
    removePath("~1postal"),
    removePath("~1{ip}~1postal"),
    removePath("~1timezone"),
    removePath("~1{ip}~1timezone"),
    removePath("~1org"),
    removePath("~1{ip}~1org"),
  ],
} satisfies OpenapiToolNamesOptions;

// ipinfo.io: the legacy routes.
export const legacyOptions = {
  ...common,
  allowedOrigin: "https://ipinfo.io",
  baseUrl: "https://ipinfo.io",
  patches: [
    { op: "replace", path: "/servers", value: [{ url: "https://ipinfo.io" }] },
    removePath("~1places~1{ip}"),
    removePath("~1batch"),
    removePath("~1tools~1summarize-ips"),
    removePath("~1tools~1map"),
    removePath("~1ip"),
    removePath("~1lite~1me"),
    removePath("~1lite~1{ip}"),
    removePath("~1lite~1me~1{field}"),
    removePath("~1lite~1{ip}~1{field}"),
    removePath("~1lookup~1me"),
    removePath("~1lookup~1{ip}"),
    removePath("~1lookup~1me~1{field}"),
    removePath("~1lookup~1{ip}~1{field}"),
  ],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; it checks the api.ipinfo.io half. The legacy half is checked by hand with
// openapiToolNames(legacyOptions).
export const options = apiOptions;

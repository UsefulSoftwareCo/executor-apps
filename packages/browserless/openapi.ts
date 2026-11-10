import type { OpenapiToolNamesOptions } from "apps/openapi";

// Browserless publishes its REST API as OpenAPI 2.57 at https://docs.browserless.io/openapi.json (no token needed to
// read it). The document has 87 paths; the ones below are removed because they are not request/response HTTP calls:
// WebSocket and CDP endpoints (/devtools, /json, /*/playwright, /session/connect, /function/connect, /reconnect,
// /stealth/reconnect), the interactive /live viewers, the licensed /chrome and /edge builds and the
// self-hosted /browser, /chromium/cli and /integrations/onepassword endpoints.
const removed = [
  "/chrome", "/chrome/bql?(/*)", "/chrome/content", "/chrome/download", "/chrome/export", "/chrome/function",
  "/chrome/live/*", "/chrome/pdf", "/chrome/performance", "/chrome/playwright", "/chrome/scrape",
  "/chrome/screenshot", "/chrome/stealth", "/chrome/unblock",
  "/edge", "/edge/content", "/edge/download", "/edge/function", "/edge/pdf", "/edge/performance",
  "/edge/playwright", "/edge/scrape", "/edge/screenshot",
  "/chromium/playwright", "/chromium/stealth/reconnect/*", "/chromium/cli",
  "/firefox/playwright", "/webkit/playwright",
  "/browser/*", "/browser/*/live", "/browser/*/live/*",
  "/devtools/browser/*", "/devtools/page/*", "/function/connect/*", "/live/*", "/reconnect/*",
  "/session/connect/*", "/json/new", "/json/protocol", "/json/version",
  "/integrations/onepassword", "/integrations/onepassword/*", "/integrations/onepassword/*/audit",
  "/integrations/onepassword/autologin/form", "/integrations/onepassword/profile",
  "/integrations/onepassword/profile/*",
  // WebSocket upgrades that Swagger documents as GET, and BQL paths that use `?(/*)` route syntax.
  "/", "/chromium", "/chromium/stealth", "/stealth", "/chromium/agent",
  "/chromium/bql?(/*)", "/stealth/bql?(/*)",
];
// GET and DELETE operations that declare an empty requestBody (`content: {}`) fail to compile; the body is dropped.
const emptyBodies: [string, string][] = [
  ["/active", "get"], ["/kill/+([0-9a-zA-Z-_])", "get"], ["/meta", "get"], ["/crawl", "get"], ["/crawl/*", "get"],
  ["/crawl/*", "delete"], ["/proxy/cities", "get"], ["/profiles", "get"], ["/profile/*", "get"],
  ["/profile/*", "delete"], ["/profile/*/download", "get"], ["/agent/run", "get"], ["/agent/run/*", "get"],
  ["/agent/run/*", "delete"], ["/chromium/agent/capabilities", "get"], ["/session/*", "delete"],
  ["/skills", "get"], ["/integrations/script-generator", "post"],
];
const escape = (path: string) => path.replace(/~/g, "~0").replace(/\//g, "~1");
const patches = [
  ...removed.map((path) => ({ op: "remove", path: `/paths/${escape(path)}` })),
  ...emptyBodies.map(([path, method]) => ({ op: "remove", path: `/paths/${escape(path)}/${method}/requestBody` })),
  // The `env` schema references a component named `Record<string,string|undefined>`, which the importer rejects.
  {
    op: "replace",
    path: "/components/schemas/BrowserServerOptions/properties/env",
    value: { type: "object", additionalProperties: { type: "string" }, description: "Environment variables for the browser process." },
  },
] as unknown as NonNullable<
  OpenapiToolNamesOptions["patches"]
>;

export const options = {
  source: { url: "https://docs.browserless.io/openapi.json" },
  baseUrl: "https://production-sfo.browserless.io",
  allowedOrigin: "https://production-sfo.browserless.io",
  securitySchemes: { tokenAuth: { type: "apiKey", name: "token", in: "query" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;

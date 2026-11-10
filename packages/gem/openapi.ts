import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Gem product, three official specs published at https://api.gem.com (the specs declare no servers, so
// baseUrl is set here). index.ts mounts each under its own key.
const origin = "https://api.gem.com";

const credentials = {
  securitySchemes: { "API Key": { type: "apiKey", in: "header", name: "X-API-Key" } },
  // The documents declare no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ "API Key": [] }],
  methods: { apiKey: [{ scheme: "API Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = (path: string) =>
  ({
    source: { url: `${origin}/${path}/openapi.json` },
    allowedOrigin: origin,
    baseUrl: origin,
    ...credentials,
  }) satisfies OpenapiToolNamesOptions;

export const crmOptions = api("v0");
export const atsOptions = api("ats/v0");
export const jobBoardOptions = {
  ...api("job_board/v0"),
  // Public operations keep no security (catalog/status/gem.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1departments~1/get/security", value: [] },
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1departments~1{department_id}/get/security", value: [] },
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1job_posts~1/get/security", value: [] },
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1job_posts~1{job_post_id}/get/security", value: [] },
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1offices~1/get/security", value: [] },
    { op: "add", path: "/paths/~1job_board~1v0~1{vanity_url_path}~1offices~1{office_id}/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; the CRM API is the main one.
export const options = crmOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// One product, seven official specs from https://github.com/IPGeolocation/openapi. index.ts mounts each under
// its own key. All share the api.ipgeolocation.io origin and the `apiKey` query-parameter scheme.
const spec = (dir: string) => ({ url: `https://raw.githubusercontent.com/IPGeolocation/openapi/main/${dir}/openapi.json` });

const credentials = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "apiKey" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(dir: string, kinds: K) =>
  ({
    source: spec(dir),
    allowedOrigin: "https://api.ipgeolocation.io",
    ...credentials,
    kinds,
  }) satisfies OpenapiToolNamesOptions;

// Bulk and body-carrying POSTs only read data, so they run without an approval prompt.
export const locationOptions = api("ip-location-api", { bulkLookupIpGeolocation: "query" });
export const securityOptions = api("ip-security-api", { bulkLookupIpSecurity: "query" });
export const userAgentOptions = api("user-agent-api", { parseCustomUserAgent: "query", parseUserAgentBulk: "query" });
export const asnOptions = api("asn-api", {});
export const abuseOptions = api("ip-abuse-contact-api", {});
export const timezoneOptions = api("timezone-api", {});
export const astronomyOptions = api("astronomy-api", {});

export const apis = {
  location: locationOptions,
  security: securityOptions,
  userAgent: userAgentOptions,
  asn: asnOptions,
  abuse: abuseOptions,
  timezone: timezoneOptions,
  astronomy: astronomyOptions,
} as const;

// scripts/tools.ts reads `options`; the IP Location API is the main one.
export const options = locationOptions;

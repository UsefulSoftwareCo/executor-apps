import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI documents published at https://dev.bandwidth.com/docs/tools/openapi-specs/.
// API credentials work as HTTP Basic (username/password); an OAuth 2 client-credentials token is sent as a bearer.
const spec = (name: string) => ({ url: `https://dev.bandwidth.com/spec/${name}.yml` });

const auth = {
  securitySchemes: {
    Basic: { type: "http", scheme: "basic" },
    Bearer: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ Basic: [] }, { Bearer: [] }],
  methods: {
    basic: [
      { scheme: "Basic", field: "username", part: "username", prefix: "" },
      { scheme: "Basic", field: "password", part: "password", prefix: "" },
    ],
    oauth: [{ scheme: "Bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

const make = (name: string, origin: string, baseUrl: string) =>
  ({ source: spec(name), allowedOrigin: origin, baseUrl, ...auth }) satisfies OpenapiToolNamesOptions;

export const messagingOptions = make("messaging", "https://messaging.bandwidth.com", "https://messaging.bandwidth.com/api/v2");
export const voiceOptions = make("voice", "https://voice.bandwidth.com", "https://voice.bandwidth.com/api/v2");
export const mfaOptions = make("multi-factor-auth", "https://mfa.bandwidth.com", "https://mfa.bandwidth.com/api/v1");
export const lookupOptions = make("phone-number-lookup-v2", "https://api.bandwidth.com", "https://api.bandwidth.com/v2");
export const tollFreeOptions = make("toll-free-verification", "https://api.bandwidth.com", "https://api.bandwidth.com/api/v2");
export const tenDlcOptions = make("tendlc", "https://api.bandwidth.com", "https://api.bandwidth.com/api/v2");
export const accountsOptions = make("accounts", "https://api.bandwidth.com", "https://api.bandwidth.com/api/v2");
export const applicationsOptions = make("applications", "https://api.bandwidth.com", "https://api.bandwidth.com/api/v2");
export const endUsersOptions = make("end-user-management", "https://api.bandwidth.com", "https://api.bandwidth.com/api/v2");
export const voiceDebugLogsOptions = make("voice-debug-logs", "https://api.bandwidth.com", "https://api.bandwidth.com/v2/voice-api");
export const callIntelligenceOptions = make("call-intelligence", "https://api.bandwidth.com", "https://api.bandwidth.com/v2");
export const insightsOptions = make("insights", "https://insights.bandwidth.com", "https://insights.bandwidth.com/api");

// scripts/tools.ts reads `options`; Messaging is the main API.
export const options = messagingOptions;

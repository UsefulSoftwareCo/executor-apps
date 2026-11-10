import type { OpenapiToolNamesOptions } from "apps/openapi";

// Twilio's official OpenAPI documents live in https://github.com/twilio/twilio-oai (spec/json). One product,
// many specs, each on its own *.twilio.com host; index.ts mounts each under its own key.
const api = (name: string, host: string) =>
  ({
    source: { url: `https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_${name}.json` },
    allowedOrigin: `https://${host}.twilio.com`,
    securitySchemes: { accountSid_authToken: { type: "http", scheme: "basic" } },
    // HTTP Basic: Account SID (or API Key SID) as the username, Auth Token (or API Key Secret) as the password.
    methods: {
      apiKey: [
        { scheme: "accountSid_authToken", field: "username", part: "username", prefix: "" },
        { scheme: "accountSid_authToken", field: "password", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const mounts = {
  api: api("api_v2010", "api"),
  messaging: api("messaging_v1", "messaging"),
  messagingV2: api("messaging_v2", "messaging"),
  verify: api("verify_v2", "verify"),
  lookups: api("lookups_v2", "lookups"),
  conversations: api("conversations_v1", "conversations"),
  content: api("content_v1", "content"),
  voice: api("voice_v1", "voice"),
  numbers: api("numbers_v2", "numbers"),
  studio: api("studio_v2", "studio"),
  taskrouter: api("taskrouter_v1", "taskrouter"),
  sync: api("sync_v1", "sync"),
  proxy: api("proxy_v1", "proxy"),
  trusthub: api("trusthub_v1", "trusthub"),
  video: api("video_v1", "video"),
  serverless: api("serverless_v1", "serverless"),
  trunking: api("trunking_v1", "trunking"),
  wireless: api("wireless_v1", "wireless"),
  supersim: api("supersim_v1", "supersim"),
  pricing: api("pricing_v2", "pricing"),
  events: api("events_v1", "events"),
  intelligence: api("intelligence_v2", "intelligence"),
};

// scripts/tools.ts compiles this one.
export const options = mounts.api;

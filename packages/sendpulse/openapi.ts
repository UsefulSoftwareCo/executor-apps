import type { OpenapiToolNamesOptions } from "apps/openapi";

// One SendPulse product, 19 official OpenAPI documents listed in
// https://api.sendpulse.com/.well-known/openapi/index.yaml. index.ts mounts each under its own key.
// The documents declare an `apiKey` bearer scheme and an OAuth client-credentials scheme, named `oauth2`,
// `outh2` or `oAuth2ClientCredentials`. Every one is the same Authorization: Bearer header, so each name
// the operations require is declared as a bearer scheme and filled from either account method.
const spec = (name: string) =>
  ({
    source: { url: `https://api.sendpulse.com/.well-known/openapi/${name}.yaml` },
    allowedOrigin: "https://api.sendpulse.com",
    securitySchemes: {
      apiKey: { type: "http", scheme: "bearer" },
      oauth2: { type: "http", scheme: "bearer" },
      oAuth2ClientCredentials: { type: "http", scheme: "bearer" },
    },
    methods: {
      apiKey: [
        { scheme: "apiKey", field: "token", part: "value", prefix: "" },
        { scheme: "oAuth2ClientCredentials", field: "token", part: "value", prefix: "" },
      ],
      oauth: [
        { scheme: "oauth2", field: "access_token", part: "value", prefix: "" },
        { scheme: "oAuth2ClientCredentials", field: "access_token", part: "value", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const specs = {
  automation360: spec("a360"),
  email: spec("bulk-email"),
  smtp: spec("smtp"),
  sms: spec("sms"),
  verifier: spec("verifier"),
  viber: spec("viber"),
  webPush: spec("web-push"),
  popups: spec("popups"),
  crm: spec("crm"),
  education: spec("edu"),
  fileManager: spec("file-manager"),
  liveChat: spec("live-chat"),
  chatbots: spec("chatbots"),
  facebook: spec("facebook"),
  instagram: spec("instagram"),
  telegram: spec("telegram"),
  tiktok: spec("tiktok"),
  viberChatbots: spec("viber-chatbot"),
  whatsapp: spec("whatsapp"),
};

// scripts/tools.ts reads `options`; it checks the largest document and the loop below the rest.
export const options = specs.crm;

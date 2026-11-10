import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mailtrap's official OpenAPI documents (https://github.com/mailtrap/mailtrap-openapi). Account-level
// APIs live on mailtrap.io; sending uses dedicated hosts. Every document accepts the same API token
// in the Api-Token header.
const raw = "https://raw.githubusercontent.com/mailtrap/mailtrap-openapi/main/specs";
const securitySchemes = { HeaderAuth: { type: "apiKey", in: "header", name: "Api-Token" } } as const;
const methods = { apiKey: [{ scheme: "HeaderAuth", field: "token", part: "value", prefix: "" }] } as const;

function spec(file: string, origin: string) {
  return {
    source: { url: `${raw}/${file}.openapi.yml` },
    allowedOrigin: origin,
    baseUrl: origin,
    securitySchemes,
    fallbackSecurity: [{ HeaderAuth: [] }],
    methods,
    oauth: [],
  } satisfies OpenapiToolNamesOptions;
}

export const specs = {
  account: spec("account-management", "https://mailtrap.io"),
  contacts: spec("contacts", "https://mailtrap.io"),
  campaigns: spec("email-campaigns", "https://mailtrap.io"),
  sendingAdmin: spec("email-sending", "https://mailtrap.io"),
  transactional: spec("email-sending-transactional", "https://send.api.mailtrap.io"),
  bulk: spec("email-sending-bulk", "https://bulk.api.mailtrap.io"),
  sandboxSend: spec("sandbox-sending", "https://sandbox.api.mailtrap.io"),
  sandbox: spec("sandbox", "https://mailtrap.io"),
  templates: spec("templates", "https://mailtrap.io"),
  inbound: spec("inbound", "https://mailtrap.io"),
} as const;

// scripts/tools.ts reads this: the account-level document.
export const options = specs.account;

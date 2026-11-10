import type { OpenapiToolNamesOptions } from "apps/openapi";
import contentDocument from "./content.json" with { type: "json" };
import emailDocument from "./email.json" with { type: "json" };

// email.json and content.json are Mailjet's bundled documents (URLs below) converted to JSON, with
// parameter schemas that point into #/components/schemas/<name>/properties/<field> inlined, because
// the generator only supports references to whole component schemas.

const common = {
  allowedOrigin: "https://api.mailjet.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The API key is the Basic username and the secret key the password.
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "apiKey", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "secretKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} as const;

// Email API (v3 and v3.1): send, contacts, lists, campaigns, statistics, webhooks, senders.
export const emailOptions = {
  ...common,
  source: { document: emailDocument as never },
} satisfies OpenapiToolNamesOptions;

// Content API (v1): templates, template content, images, labels, tokens.
export const contentOptions = {
  ...common,
  source: { document: contentDocument as never },
} satisfies OpenapiToolNamesOptions;

export const options = emailOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

const credentials = {
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// iMessage, RCS and SMS Partner API v3.
export const options = {
  source: { url: "https://cdn.linqapp.com/openapi/linq-api-v3.yaml" },
  allowedOrigin: "https://api.linqapp.com",
  ...credentials,
} satisfies OpenapiToolNamesOptions;

// WhatsApp Messages Partner API v1: a separate host and brand-bound keys, mounted under `whatsapp`.
export const whatsappOptions = {
  source: { url: "https://whatsapp.messages.api.linqapp.com/v1/openapi.yaml" },
  allowedOrigin: "https://whatsapp.messages.api.linqapp.com",
  ...credentials,
} satisfies OpenapiToolNamesOptions;

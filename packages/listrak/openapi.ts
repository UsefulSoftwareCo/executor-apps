import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import dataSpec from "./spec-data.json" with { type: "json" };
import emailSpec from "./spec-email.json" with { type: "json" };
import smsSpec from "./spec-sms.json" with { type: "json" };

// Official Swagger 2.0 documents published by Listrak at https://api.listrak.com/<api>/swagger/docs/v1, stored as
// spec-<api>.json with two changes: definition names such as Collection[List] become CollectionOfList (the compiler
// rejects references with brackets) and response examples are dropped to keep the files small.
// All three APIs share one origin and one OAuth 2 client-credentials token endpoint. The operations name their
// security scheme "OAuth 2" while the document defines "OAuth2", so both names are declared.
const origin = "https://api.listrak.com";

const api = (document: JsonObject) =>
  ({
    source: { document },
    allowedOrigin: origin,
    securitySchemes: {
      OAuth2: { type: "http", scheme: "bearer" },
      "OAuth 2": { type: "http", scheme: "bearer" },
    },
    methods: {
      oauth: [
        { scheme: "OAuth2", field: "access_token", part: "value", prefix: "" },
        { scheme: "OAuth 2", field: "access_token", part: "value", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const emailOptions = api(emailSpec as unknown as JsonObject);
export const smsOptions = api(smsSpec as unknown as JsonObject);
export const dataOptions = api(dataSpec as unknown as JsonObject);
export const options = emailOptions;

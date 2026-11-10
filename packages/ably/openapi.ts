import type { OpenapiToolNamesOptions } from "apps/openapi";
import controlDocument from "./control.json" with { type: "json" };

// Ably's official definitions live in github.com/ably/open-specs.
export const options = {
  source: { url: "https://raw.githubusercontent.com/ably/open-specs/main/definitions/platform-v1.yaml" },
  allowedOrigin: "https://rest.ably.io",
  securitySchemes: {
    basicAuth: { type: "http", scheme: "basic" },
    bearerAuth: { type: "http", scheme: "bearer" },
  },
  // An API key is "<appId>.<keyId>:<secret>"; the part before the colon is the Basic username.
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "keyName", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "secret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// control.json is control-v1.yaml from the same repository converted to JSON unchanged: the
// generator rejects the raw YAML file but accepts the identical content as a document.
export const controlOptions = {
  source: { document: controlDocument as never },
  allowedOrigin: "https://control.ably.net",
  securitySchemes: { bearer_auth: { type: "http", scheme: "bearer" } },
  methods: { accessToken: [{ scheme: "bearer_auth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ory's official "Ory APIs" OpenAPI 3.0 document (ory/client-go, generated from ory/sdk). Its server is
// https://{project_slug}.projects.oryapis.com, so index.ts pins each account's own project origin.
export const placeholderOrigin = "https://playground.projects.oryapis.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/ory/client-go/master/api/openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // Project API keys and OAuth2 access tokens are both sent as a bearer header. The client-credentials token is
  // minted in index.ts, so that method fills the scheme from its (placeholder) secret field and the wrapped fetch
  // swaps in the minted token.
  securitySchemes: {
    bearer: { type: "http", scheme: "bearer" },
    oryAccessToken: { type: "http", scheme: "bearer" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearer: [], oryAccessToken: [] }],
  methods: {
    apiKey: [
      { scheme: "oryAccessToken", field: "token", part: "value", prefix: "" },
      { scheme: "bearer", field: "token", part: "value", prefix: "" },
    ],
    clientCredentials: [
      { scheme: "oryAccessToken", field: "clientSecret", part: "value", prefix: "" },
      { scheme: "bearer", field: "clientSecret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  // Public operations keep no security (catalog/status/ory.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1self-service~1login~1test/delete/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1logout~1api/delete/security", value: [] },
    { op: "add", path: "/paths/~1sessions/delete/security", value: [] },
    { op: "add", path: "/paths/~1sessions~1{id}/delete/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1auth/get/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1device~1verify/get/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1sessions~1logout/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1login~1api/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1login~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1login~1flows/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1logout/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1logout~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1sessions/get/security", value: [] },
    { op: "add", path: "/paths/~1sessions~1token-exchange/get/security", value: [] },
    { op: "add", path: "/paths/~1sessions~1whoami/get/security", value: [] },
    { op: "add", path: "/paths/~1v2alpha1~1derivedKeys~1jwks.json/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1change-password/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1jwks.json/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1openid-configuration/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1ory~1webauthn.js/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1webauthn/get/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1device~1auth/post/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1register/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1fed-cm~1token/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1login/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1acs~1{provider}/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1idp-initiated~1{provider}/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1init~1{provider}/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1init~1{provider}/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1metadata/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1methods~1saml~1metadata~1{provider}/get/security", value: [] },
    { op: "add", path: "/paths/~1elements~1configuration/get/security", value: [] },
    { op: "add", path: "/paths/~1schemas/get/security", value: [] },
    { op: "add", path: "/paths/~1schemas~1{id}/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1errors/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1fed-cm~1parameters/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1recovery/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1recovery~1api/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1recovery~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1recovery~1flows/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1registration/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1registration~1api/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1registration~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1registration~1flows/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1settings~1api/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1settings~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1settings~1flows/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1verification/post/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1verification~1api/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1verification~1browser/get/security", value: [] },
    { op: "add", path: "/paths/~1self-service~1verification~1flows/get/security", value: [] },
    { op: "add", path: "/paths/~1v2alpha1~1apiKeys:selfRevoke/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

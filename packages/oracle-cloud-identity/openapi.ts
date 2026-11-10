import type { OpenapiToolNamesOptions } from "apps/openapi";

// Oracle's official Swagger 2.0 document for "REST API for Oracle Identity Cloud Service" (the download linked
// from https://docs.oracle.com/en/cloud/paas/identity-cloud/rest-api/). It declares no host, so index.ts pins
// each account's own identity domain origin.
export const placeholderOrigin = "https://idcs-00000000000000000000000000000000.identity.oraclecloud.com";

export const options = {
  source: { url: "https://docs.oracle.com/en/cloud/paas/identity-cloud/idcsa/swagger.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares no security scheme. The bearer token is minted in index.ts from the client's
  // credentials, so both methods fill a bearer header.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: {
    clientCredentials: [{ scheme: "bearerAuth", field: "clientSecret", part: "value", prefix: "" }],
    token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
  // Public operations keep no security (catalog/status/oracle-cloud-identity.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1oauth2~1v1~1authorize/get/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1userlogout/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1idcs-configuration/get/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1openid-configuration/get/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1authorize/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1device/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1introspect/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1revoke/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1sdk~1MySocialAccountLinker/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1token/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1userinfo/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1userlogout/options/security", value: [] },
    { op: "add", path: "/paths/~1sso~1v1~1sdk~1authenticate/options/security", value: [] },
    { op: "add", path: "/paths/~1sso~1v1~1sdk~1secure~1session/options/security", value: [] },
    { op: "add", path: "/paths/~1sso~1v1~1sdk~1session/options/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1idcs-configuration/options/security", value: [] },
    { op: "add", path: "/paths/~1.well-known~1openid-configuration/options/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1device/post/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1introspect/post/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1revoke/post/security", value: [] },
    { op: "add", path: "/paths/~1oauth2~1v1~1token/post/security", value: [] },
    { op: "add", path: "/paths/~1sso~1v1~1sdk~1idp/post/security", value: [] },
    // Takes the user's own access token (with urn:opc:idm:t.user.me) in the form's authorization field, not the
    // account's bearer.
    { op: "add", path: "/paths/~1oauth2~1v1~1sdk~1MySocialAccountLinker/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;

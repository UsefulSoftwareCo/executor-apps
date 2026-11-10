import type { OpenapiToolNamesOptions } from "apps/openapi";

// SCIM provisioning paths (/Users, /Groups, /ServiceProviderConfig, /ResourceTypes, /Schemas) need a
// SCIM credential, not an OAuth or app token, so they are removed.
const scimPaths = ["Users", "Users/{id}", "Groups", "Groups/{id}", "ServiceProviderConfig", "ResourceTypes", "ResourceTypes/{resource}", "Schemas", "Schemas/{uri}"];

// The spec declares one oauth2 scheme; both an access token and OAuth fill it as a bearer token.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/miroapp/api-clients/39161f97cee3f887f5f67cf4a003ce93b3a6903b/packages/generator/spec.json",
  },
  allowedOrigin: "https://api.miro.com",
  securitySchemes: { oAuth2AuthCode: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ oAuth2AuthCode: [] }],
  methods: {
    token: [{ scheme: "oAuth2AuthCode", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "oAuth2AuthCode", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    ...scimPaths.map((p) => ({
      op: "remove" as const,
      path: `/paths/${("/" + p).replace(/~/g, "~0").replace(/\//g, "~1")}`,
    })),
    // App metrics take an app management API token from Developer Hub, which neither method holds, so they get no
    // credential (catalog/status/miro.json "credentialFree").
    { op: "add" as const, path: "/paths/~1v2-experimental~1apps~1{app_id}~1metrics/get/security", value: [] },
    { op: "add" as const, path: "/paths/~1v2-experimental~1apps~1{app_id}~1metrics-total/get/security", value: [] },
    // The v2 revoke takes the token to revoke and its client's ID and secret in the body, so it gets no credential
    // (catalog/status/miro.json "credentialFree").
    { op: "add" as const, path: "/paths/~1v2~1oauth~1revoke/post/security", value: [] },
    // Miro calls the v1 revoke vulnerable and deprecated (it takes the token in the URL) and points to /v2/oauth/revoke.
    { op: "remove" as const, path: "/paths/~1v1~1oauth~1revoke" },
  ],
} satisfies OpenapiToolNamesOptions;

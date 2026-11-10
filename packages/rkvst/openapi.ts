import type { OpenapiToolNamesOptions } from "apps/openapi";

// One DataTrails product, split by the vendor into one Swagger 2.0 document per API at
// https://github.com/datatrails/datatrails-openapi/tree/main/doc. index.ts mounts each under its own key.
// The documents declare no security scheme, so bearer auth is filled in here; every path already starts
// with /archivist, so the base URL is just the origin. Unauthenticated public* documents, the did:web
// document and the OpenAPI document endpoint are left out.
const spec = (name: string) =>
  ({
    source: { url: `https://raw.githubusercontent.com/datatrails/datatrails-openapi/main/doc/${name}.swagger.json` },
    allowedOrigin: "https://app.datatrails.ai",
    baseUrl: "https://app.datatrails.ai",
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ bearerAuth: [] }],
    methods: {
      appRegistration: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const specs = {
  assets: spec("assetsv2"),
  events: spec("events"),
  attachments: spec("attachmentsv2"),
  blobs: spec("blobsv1"),
  locations: spec("locationsv2"),
  accessPolicies: spec("accesspoliciesv1"),
  iamAssets: spec("iamassetsv1"),
  subjects: spec("subjectsv1"),
  members: spec("membersv1"),
  memberships: spec("membershipsv1"),
  appRegistrations: spec("appregistrationsv1"),
  compliancePolicies: spec("compliancepoliciesv1"),
  complianceAssets: spec("complianceassetsv1"),
  scitt: spec("scittv1"),
  tenancies: spec("tenanciesv1"),
  caps: spec("capsv1"),
};

export const options = specs.assets;

import type { OpenapiToolNamesOptions } from "apps/openapi";

type Patches = NonNullable<OpenapiToolNamesOptions["patches"]>;

// Xero publishes one OpenAPI document per API in github.com/XeroAPI/Xero-OpenAPI (pinned to a
// commit so the tool set only changes when this file does). Every API lives on api.xero.com under
// its own path. For the oauth method every call takes the organisation in an xero-tenant-id header
// (a required parameter of each tool; list ids with identity.getConnections). A custom connection
// is bound to one organisation and needs no header, so machine variants make it optional.
// The documents declare an OAuth2 scheme; both account methods supply the same bearer token, so
// the scheme is redeclared as http bearer and filled from access_token.
const raw = "https://raw.githubusercontent.com/XeroAPI/Xero-OpenAPI/fd9d44b04bf4934a7509b8e7ece51a9e0e462e4f";

const shared = {
  allowedOrigin: "https://api.xero.com",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
    machine: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} as const;

// Journals need accounting.journals.read (Advanced tier + certification), which is not requested.
const withoutJournals = [
  { op: "remove", path: "/paths/~1Journals" },
  { op: "remove", path: "/paths/~1Journals~1{JournalID}" },
  { op: "remove", path: "/paths/~1Journals~1{JournalNumber}" },
] as unknown as Patches;

// Every operation references components.parameters.requiredHeader (xero-tenant-id); making it
// optional lets custom connections omit it.
const optionalTenant = [
  { op: "replace", path: "/components/parameters/requiredHeader/required", value: false },
] as unknown as Patches;

export const specs = {
  accounting: { ...shared, source: { url: raw + "/xero_accounting.yaml" }, patches: withoutJournals },
  identity: { ...shared, source: { url: raw + "/xero-identity.yaml" } },
  assets: { ...shared, source: { url: raw + "/xero_assets.yaml" } },
  files: { ...shared, source: { url: raw + "/xero_files.yaml" } },
  projects: { ...shared, source: { url: raw + "/xero-projects.yaml" } },
  payrollAu: { ...shared, source: { url: raw + "/xero-payroll-au.yaml" } },
  payrollUk: { ...shared, source: { url: raw + "/xero-payroll-uk.yaml" } },
  payrollNz: { ...shared, source: { url: raw + "/xero-payroll-nz.yaml" } },
} satisfies Record<string, OpenapiToolNamesOptions>;

// Variants for the machine (custom connection) method: single organisation, tenant header optional.
export const machineSpecs = {
  accounting: { ...specs.accounting, patches: [...withoutJournals, ...optionalTenant] },
  assets: { ...specs.assets, patches: optionalTenant },
  files: { ...specs.files, patches: optionalTenant },
  projects: { ...specs.projects, patches: optionalTenant },
} satisfies Record<string, OpenapiToolNamesOptions>;

export const options = specs.accounting;

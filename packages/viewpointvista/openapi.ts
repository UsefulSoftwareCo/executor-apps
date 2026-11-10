import type { OpenapiToolNamesOptions } from "apps/openapi";

// Trimble Vista (Viewpoint Vista) Xchange Direct API: one official OpenAPI document per Vista module, all
// served from the same North America origin. Every operation carries the subscriber code in its path.
const origin = "https://api.xchange.trimble.com";

const api = (module: string) =>
  ({
    source: { url: `${origin}/connect/v1/direct/vista/${module}/2/swagger/openapi.json` },
    allowedOrigin: origin,
    baseUrl: `${origin}/connect/v1`,
    securitySchemes: { applicationKey: { type: "apiKey", in: "header", name: "X-Application-Key" } },
    methods: { apiKey: [{ scheme: "applicationKey", field: "applicationKey", part: "value", prefix: "" }] },
    oauth: [],
    // Each document's top-level `security: [{}]` declares every operation public; every one needs the key.
    patches: [{ op: "add", path: "/security", value: [{ applicationKey: [] }] }],
  }) satisfies OpenapiToolNamesOptions;

export const modules = {
  accountsPayable: api("ap"),
  accountsReceivable: api("ar"),
  documentManagement: api("dm"),
  equipmentManagement: api("em"),
  generalLedger: api("gl"),
  headquarters: api("hq"),
  humanResources: api("hr"),
  inventory: api("in"),
  jobCost: api("jc"),
  materialSales: api("ms"),
  preConstruction: api("pc"),
  projectManagement: api("pm"),
  purchaseOrder: api("po"),
  payroll: api("pr"),
  serviceManagement: api("sm"),
  subcontractLedger: api("sl"),
  userDefinedTables: api("ud"),
  viewpointAdministration: api("va"),
} as const;

// scripts/tools.ts reads `options`; Accounts Payable is the largest module.
export const options = modules.accountsPayable;

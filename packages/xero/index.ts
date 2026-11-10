import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { machineSpecs, specs } from "./openapi.js";

// Only tenantId is decoded: the identity spec marks every Connection field optional.
const Connections = array(object({ tenantId: string() }));
// Organisation is a tenanted read that a custom connection can call without a tenant header.
const Organisations = object({ Organisations: array(object({ OrganisationID: string() })) });

// Granular accounting scopes: Xero stopped granting accounting.transactions and
// accounting.reports.read to apps created after 2 March 2026.
const accountingScopes = [
  "accounting.contacts",
  "accounting.settings",
  "accounting.attachments",
  "accounting.budgets.read",
  "accounting.invoices",
  "accounting.payments",
  "accounting.banktransactions",
  "accounting.manualjournals",
  "accounting.reports.aged.read",
  "accounting.reports.balancesheet.read",
  "accounting.reports.banksummary.read",
  "accounting.reports.executivesummary.read",
  "accounting.reports.profitandloss.read",
  "accounting.reports.trialbalance.read",
  "accounting.reports.taxreports.read",
  "files",
  "assets",
  "projects",
];

const xero = defineProvider({
  name: "Xero",
  hosts: ["api.xero.com"],
  auth: {
    oauth: oauth2({
      discover: "https://identity.xero.com",
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        ...accountingScopes,
        "payroll.employees",
        "payroll.payruns",
        "payroll.payslip",
        "payroll.settings",
        "payroll.timesheets",
      ],
    }),
    // Xero custom connection: one organisation, authorised by the client credentials grant.
    machine: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://identity.xero.com/connect/token",
      scopes: accountingScopes,
      tokenEndpointAuthMethod: "client_secret_basic",
    }),
  },
  async health({ account, fetch, signal }) {
    const headers = { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" };
    if (account.method === "machine") {
      // Custom connections cannot call /connections (non-tenanted); read the single organisation.
      const response = await fetch("https://api.xero.com/api.xro/2.0/Organisation", { signal, headers });
      const [org] = (await decodeJson(response, Organisations)).Organisations;
      if (org === undefined) throw new Error("The custom connection returned no organisation.");
      return { accountInfo: { externalId: org.OrganisationID, displayName: org.OrganisationID } };
    }
    const response = await fetch("https://api.xero.com/connections", { signal, headers });
    const [first] = await decodeJson(response, Connections);
    if (first === undefined) throw new Error("No Xero organisation is authorised for this connection.");
    return { accountInfo: { externalId: first.tenantId, displayName: first.tenantId } };
  },
});

export default defineApp(
  { user: { accounts: { xero: xero.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.xero ?? [],
        async (account) => {
          const mount = (options: (typeof specs)[keyof typeof specs]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          // A custom connection is one organisation with accounting, files, assets and projects
          // scopes only: no identity or payroll, and no tenant header.
          if (account.method === "machine") {
            return router({
              accounting: mount(machineSpecs.accounting),
              assets: mount(machineSpecs.assets),
              files: mount(machineSpecs.files),
              projects: mount(machineSpecs.projects),
            });
          }
          return router({
            accounting: mount(specs.accounting),
            identity: mount(specs.identity),
            assets: mount(specs.assets),
            files: mount(specs.files),
            projects: mount(specs.projects),
            payrollAu: mount(specs.payrollAu),
            payrollUk: mount(specs.payrollUk),
            payrollNz: mount(specs.payrollNz),
          });
        },
        { signal },
      ),
      {
        title: "Xero",
        description:
          "Xero accounting: invoices, contacts, payments, bank transactions, journals, reports, files, fixed assets, projects and payroll.",
        instructions:
          "With the oauth method every call needs the xero-tenant-id header: list organisations with identity.getConnections and pass the tenantId. With the machine method (custom connection, one organisation) omit the header; identity and payroll are not available.",
        icons,
      },
    ),
  }),
);

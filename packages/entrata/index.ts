import {
  accountRouter,
  base64,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const baseUrl = (subdomain: string) => `https://${subdomain}.entrata.com/api/v1`;

const entrata = defineProvider({
  name: "Entrata",
  hosts: ["*.entrata.com"],
  auth: {
    apiUser: secrets({
      label: "API user",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
      request: ({ username, password }) => header("authorization", t`Basic ${base64(t`${username}:${password}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${baseUrl(account.fields.subdomain)}/status`), {
      signal,
      method: "POST",
      headers: { ...account.headers(), "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ auth: { type: "basic" }, requestId: "1", method: { name: "getStatus", version: "r1", params: {} } }),
    });
    // Every Entrata reply is wrapped in a `response` object.
    await decodeJson(response, object({ response: json() }));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

// service path -> [method names]. A method whose name starts with one of the write
// prefixes below is a mutation and requires approval.
const services: Record<string, string[]> = {
  status: ["getStatus"],
  applications: ["getCompanyApplications", "sendApplication", "updateApplication"],
  arcodes: ["getArCodes"],
  arpayments: ["getArPayments"],
  artransactions: ["getArInvoices", "getLeaseArTransactions", "getMitsLeaseArTransactions", "sendLeaseArTransactionReversals", "sendLeaseArTransactions"],
  communications: ["getMarketingPreferencePickList", "getMarketingPreferences"],
  customers: ["getCustomers", "getCustomerTestimonials", "getTestimonialPickLists", "searchCustomers", "sendCustomerTestimonials", "updateCustomers", "updateCustomerTestimonials", "updatePropertyResponse"],
  financial: ["getApCodes", "getBankAccounts", "getBudgetActuals", "getBudgets", "getFinancialPickList", "getGlTransactions", "getGlTrees", "getJobCategories", "getJobCostBudgets", "getJobs", "getTransactionTagLists", "markGlTransactionsExported", "sendBudgets", "sendJournalEntries", "updateBudgets"],
  leads: ["applyQuote", "generateQuotes", "getLeadEvents", "getLeadPickLists", "getLeads", "getMitsLeads", "getQuotes", "sendLeads", "sendMitsLeads", "updateLeads"],
  leases: ["cancelLease", "getEvictedLeases", "getExpiringLeases", "getLeaseActivities", "getLeaseDetails", "getLeaseDocuments", "getLeaseDocumentsList", "getLeasePickList", "getLeases", "getMitsCollections", "getMitsLeases", "getParcelAlerts", "getRentersInsurancePolicies", "moveInLease", "moveOutLease", "onNoticeLease", "sendLeaseActivities", "sendLeases", "sendRentersInsurancePolicies", "sendRoommateGroups", "sendScheduledCharges", "updateLease", "updateScheduledCharges"],
  leasingcenter: ["getCallLogs", "getLeasingCenterPickLists"],
  maintenance: ["getInspections", "getInspectionTemplates", "getWorkOrderPickLists", "getWorkOrders", "sendWorkOrders", "updateWorkOrders"],
  pricing: ["getMitsPropertyFees", "getPricingPicklists", "getPropertyFees", "insertPricing", "sendBudgetedRent"],
  properties: ["deletePropertyMedia", "getAmenityReservations", "getCalendarAvailability", "getFloorPlans", "getPetTypes", "getPhoneNumber", "getProperties", "getPropertyAddOns", "getPropertyAnnouncements", "getPropertyMedia", "getPropertyPickLists", "getRentableItems", "getReservableAmenities", "getWebsites", "sendFloorplans", "sendPropertyMedia", "sendRentableItems", "updatePropertyMedia"],
  propertyunits: ["getAmenities", "getMitsPropertyUnits", "getPropertyUnits", "getSpecials", "getUnitsAvailabilityAndPricing", "getUnitTypes", "sendAmenities", "sendPropertyUnits", "sendSpecialGroup", "updateAmenities", "updateSpecialGroup"],
  queue: ["getResponse"],
  vendors: ["getInvoices", "getPoReceivingRecords", "getPurchaseOrders", "getTaxFormData", "getVendorLocations", "getVendorPickLists", "getVendors", "markInvoicesExported", "sendInvoices", "sendPurchaseOrders", "sendVendors", "updateInvoices", "updateVendors", "voidApPayments"],
};

const isWrite = (name: string) => !name.startsWith("get") && name !== "searchCustomers";

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

const input = object({
  params: json().optional(),
  version: string().optional(),
});

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const tool = (service: string, name: string) => {
    const write = isWrite(name);
    const options = {
      description:
        `Entrata ${name} (service /${service}). params is the method's parameter object exactly as documented at https://docs.entrata.com/api/v1/documentation/${name}; ` +
        `version is the method version (default r1; for example r2 for methods that publish a Version 2).` +
        (write ? " Changes data in Entrata." : ""),
      input,
    };
    const handler = async (_ctx: unknown, args: { params?: unknown; version?: string }) => {
      const response = await fetcher(account.url(`${baseUrl(account.fields.subdomain)}/${service}`), {
        method: "POST",
        signal,
        headers: { ...account.headers(), "content-type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          auth: { type: "basic" },
          requestId: "1",
          method: { name, version: args.version ?? "r1", params: args.params ?? {} },
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Entrata answered ${response.status}: ${text.slice(0, 1000)}`);
      return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
    };
    return write ? mutation(options, handler as never) : query(options, handler as never);
  };

  return router(
    Object.fromEntries(
      Object.entries(services).map(([service, names]) => [
        service,
        router(Object.fromEntries(names.map((name) => [name, tool(service, name)])) as never),
      ]),
    ) as never,
  );
}

export default defineApp({ user: { accounts: { entrata: entrata.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.entrata ?? [],
      (account) =>
        withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "Entrata",
      description:
        "Entrata property management: properties, units, leases, leads, customers, applications, maintenance work orders, financials, vendors and pricing.",
      instructions:
        "One tool per Entrata web-service method, grouped by service. Pass the method's documented parameters as params; results arrive under response.result. Methods whose names start with send, update, delete, move, cancel, mark, void, apply, generate or insert change data and need approval. The API user must have each web service enabled in Entrata (Apps > API Access).",
      icons,
    },
  ),
}));

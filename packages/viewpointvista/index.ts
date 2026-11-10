import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { modules } from "./openapi.js";

const vista = defineProvider({
  name: "Trimble Vista",
  hosts: ["api.xchange.trimble.com"],
  auth: {
    apiKey: secrets({
      label: "Application key",
      fields: object({ applicationKey: string({ minLength: 1 }) }),
    }),
  },
  // The Xchange Direct API has no account or whoami endpoint, and every other endpoint needs a subscriber
  // code that the key alone does not reveal, so there is nothing safe to call without it.
});

export default defineApp(
  { user: { accounts: { vista: vista.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vista ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer P ? Omit<P & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              accountsPayable: mount(modules.accountsPayable),
              accountsReceivable: mount(modules.accountsReceivable),
              documentManagement: mount(modules.documentManagement),
              equipmentManagement: mount(modules.equipmentManagement),
              generalLedger: mount(modules.generalLedger),
              headquarters: mount(modules.headquarters),
              humanResources: mount(modules.humanResources),
              inventory: mount(modules.inventory),
              jobCost: mount(modules.jobCost),
              materialSales: mount(modules.materialSales),
              preConstruction: mount(modules.preConstruction),
              projectManagement: mount(modules.projectManagement),
              purchaseOrder: mount(modules.purchaseOrder),
              payroll: mount(modules.payroll),
              serviceManagement: mount(modules.serviceManagement),
              subcontractLedger: mount(modules.subcontractLedger),
              userDefinedTables: mount(modules.userDefinedTables),
              viewpointAdministration: mount(modules.viewpointAdministration),
            },
            { title: "Trimble Vista", description: "Trimble Vista modules." },
          );
        },
        { signal },
      ),
      {
        title: "Trimble Vista",
        description: "Trimble Vista (Viewpoint Vista) construction ERP. Modules: Accounts Payable, Accounts Receivable, Document Management, Equipment Management, General Ledger, Headquarters, Human Resources, Inventory, Job Cost, Material Sales, Pre-Construction, Project Management, Purchase Order, Payroll, Service Management, Subcontract Ledger, User Defined Tables, Viewpoint Administration. Every tool takes the Vista subscriber_code in its path.",
        instructions: "Each Vista module is its own namespace. Pass your Xchange subscriber code as subscriber_code. Data objects are read from the cache (get/search) and changed through actions.",
        icons,
      },
    ),
  }),
);

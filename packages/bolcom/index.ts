import {
  accountRouter,
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
import { options } from "./openapi.js";

const Retailer = object({ retailerId: string() });

const bolcom = defineProvider({
  name: "bol.com",
  hosts: ["api.bol.com", "login.bol.com"],
  auth: {
    // Retailer API credentials (Partner Platform > Settings > API settings) use the client-credentials grant.
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://login.bol.com/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.bol.com/retailer/retailers/current", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        Accept: "application/vnd.retailer.v10+json",
      },
    });
    const retailer = await decodeJson(response, Retailer);
    return { accountInfo: { externalId: retailer.retailerId } };
  },
});

export default defineApp(
  { user: { accounts: { bolcom: bolcom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bolcom ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "bol.com",
        description:
          "bol.com Retailer API: orders, shipments, returns, offers, stock, products, invoices, promotions, replenishments and insights.",
        icons,
      },
    ),
  }),
);

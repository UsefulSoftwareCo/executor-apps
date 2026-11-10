import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Administrations = array(object({ name: string() }));

const moneybird = defineProvider({
  name: "Moneybird",
  hosts: ["moneybird.com"],
  auth: {
    token: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Moneybird offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://moneybird.com/oauth/authorize",
      tokenUrl: "https://moneybird.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["sales_invoices", "documents", "estimates", "bank", "time_entries", "settings"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://moneybird.com/api/v2/administrations.json", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const administrations = await decodeJson(response, Administrations);
    return { accountInfo: { displayName: administrations.map((a) => a.name).join(", ") || "Moneybird" } };
  },
});

export default defineApp(
  { user: { accounts: { moneybird: moneybird.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.moneybird ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Moneybird",
        description:
          "Contacts, sales invoices, estimates, purchase documents, bank accounts, products, time entries and the rest of the Moneybird accounting API. Most tools take an administration_id; list administrations first.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
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
import { v1Options, v2Options } from "./openapi.js";

const Profile = object({});

const keap = defineProvider({
  name: "Keap",
  hosts: ["api.infusionsoft.com", "api.keap.com"],
  auth: {
    apiKey: secrets({
      label: "Service account key or personal access token",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Keap offers no client registration: the connect page asks for the client of an app made at keys.developer.keap.com.
    oauth: oauth2({
      authorizationUrl: "https://accounts.infusionsoft.com/app/oauth/authorize",
      tokenUrl: "https://api.infusionsoft.com/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["full"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Keap-API-Key": account.fields.apiKey };
    const response = await fetch("https://api.infusionsoft.com/crm/rest/v1/account/profile", {
      signal,
      headers: { ...headers, Accept: "application/json" },
    });
    await decodeJson(response, Profile);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { keap: keap.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.keap ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              v2: approve(liveOpenapiRouter({ ...v2Options, cache, fetch, signal, account })),
              v1: approve(liveOpenapiRouter({ ...v1Options, cache, fetch, signal, account })),
            },
            { title: "Keap", description: "Keap CRM REST API." },
          );
        },
        { signal },
      ),
      {
        title: "Keap",
        description:
          "Keap CRM. v2 (preferred): contacts, companies, opportunities, orders, products, tags, automations, campaigns, emails, files, users. v1: REST Hooks, appointments, notes, tasks, subscriptions and resources not yet in v2.",
        icons,
      },
    ),
  }),
);

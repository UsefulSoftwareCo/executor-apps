import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
import {
  addressesOptions,
  auditOptions,
  campaignsOptions,
  chatOptions,
  customer360Options,
  historicalAuOptions,
  historicalCaOptions,
  historicalEuOptions,
  historicalOptions,
  operationsOptions,
  phoneNumbersOptions,
  realtimeAuOptions,
  realtimeCaOptions,
  realtimeEuOptions,
  realtimeOptions,
  ringGroupsOptions,
  sitesOptions,
  usersOptions,
  workChatOptions,
} from "./openapi.js";

const eightByEight = defineProvider({
  name: "8x8",
  hosts: ["api.8x8.com"],
  auth: {
    // Admin Console > API Keys. The key goes in the x-api-key header of the Admin Provisioning and Audit APIs.
    apiKey: secrets({
      label: "Admin Console API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // The key and secret of an Admin Console API app, exchanged for a bearer token (Basic client authentication).
    // The Contact Center analytics APIs use it; access depends on the API products assigned to the key, not scopes.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.8x8.com/oauth/v2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch("https://api.8x8.com/analytics/cc/v5/realtime-metrics/queues", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
      });
      await decodeJson(response, json());
      return { accountInfo: { externalId: "8x8", displayName: "8x8 (client credentials)" } };
    }
    const response = await fetch("https://api.8x8.com/admin-provisioning/sites?pageSize=1", {
      signal,
      headers: { "x-api-key": account.fields.apiKey, Accept: "application/vnd.sites.v1+json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "8x8", displayName: "8x8 (API key)" } };
  },
});

export default defineApp(
  { user: { accounts: { eightByEight: eightByEight.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eightByEight ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          if (account.method === "oauth") {
            return router(
              {
                realtime: mount(realtimeOptions),
                realtimeEu: mount(realtimeEuOptions),
                realtimeAu: mount(realtimeAuOptions),
                realtimeCa: mount(realtimeCaOptions),
                historical: mount(historicalOptions),
                historicalEu: mount(historicalEuOptions),
                historicalAu: mount(historicalAuOptions),
                historicalCa: mount(historicalCaOptions),
                chat: mount(chatOptions),
              },
              { title: "8x8", description: "8x8 Contact Center analytics (US, EU, AU, CA) and Chat API v2." },
            );
          }
          return router(
            {
              users: mount(usersOptions),
              sites: mount(sitesOptions),
              ringGroups: mount(ringGroupsOptions),
              phoneNumbers: mount(phoneNumbersOptions),
              addresses: mount(addressesOptions),
              operations: mount(operationsOptions),
              audit: mount(auditOptions),
              campaigns: mount(campaignsOptions),
              workChat: mount(workChatOptions),
              customer360: mount(customer360Options),
            },
            { title: "8x8", description: "8x8 Admin Provisioning, Audit, campaigns, Work Chat and Customer 360." },
          );
        },
        { signal },
      ),
      {
        title: "8x8",
        description:
          "8x8. With an Admin Console API key: users, sites, ring groups, phone numbers, addresses, async operations, audit records, outbound campaigns, Work Chat and Customer 360. With OAuth client credentials: Contact Center real-time and historical analytics (default/US plus eu, au, ca mounts) and Chat API v2.",
        icons,
        instructions:
          "Admin Provisioning writes (create, update, delete) are asynchronous: they return an operation; poll it with operations. Analytics tools exist per region: use realtime/historical for the default (US) origin and the Eu, Au and Ca variants for tenants in those regions.",
      },
    ),
  }),
);

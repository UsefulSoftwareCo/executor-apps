import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  number,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mightyNetworks = defineProvider({
  name: "Mighty Networks",
  hosts: ["api.mn.co"],
  auth: {
    apiKey: secrets({
      label: "Admin API key (token) and Network ID or subdomain (networkId)",
      fields: object({ token: string({ minLength: 1 }), networkId: string({ minLength: 1 }) }),
    }),
  },
  // Admin API keys are scoped to one network, so the key is verified against that network.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://api.mn.co/admin/v1/networks/${encodeURIComponent(account.fields.networkId)}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ network: object({ id: number() }), user: object({ id: number() }) }));
  },
});

export default defineApp(
  { user: { accounts: { mightynetworks: mightyNetworks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mightynetworks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache,
              fetch,
              signal,
              account,
              parameterDefaults: { path: { network_id: String(account.fields.networkId) } },
            }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mighty Networks",
        description: "Manage a Mighty Network: members, spaces, plans, posts, events, courses and more.",
        icons,
      },
    ),
  }),
);

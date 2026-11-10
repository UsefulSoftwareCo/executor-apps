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
import { options } from "./openapi.js";

const peaka = defineProvider({
  name: "Peaka",
  hosts: ["partner.peaka.studio"],
  auth: {
    apiKey: secrets({
      label: "Partner API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://partner.peaka.studio/api/v1/organizations", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Peaka rejected the API key (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { peaka: peaka.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.peaka ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Peaka",
        description:
          "Manage Peaka organizations, workspaces, projects, API keys, data connections, catalogs, tables, queries and semantic catalogs.",
        icons,
      },
    ),
  }),
);

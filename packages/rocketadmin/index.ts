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

const rocketadmin = defineProvider({
  name: "Rocketadmin",
  hosts: ["app.rocketadmin.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.rocketadmin.com/api/check/apikey", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Rocketadmin rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { rocketadmin: rocketadmin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rocketadmin ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rocketadmin",
        description: "Manage Rocketadmin admin panels: connections, tables and rows, groups, permissions, dashboards, saved queries and logs.",
        icons,
      },
    ),
  }),
);

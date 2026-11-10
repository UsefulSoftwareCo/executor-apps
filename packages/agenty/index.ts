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

const agenty = defineProvider({
  name: "Agenty",
  hosts: ["api.agenty.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Only the response status is checked: the list response shape is not documented.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.agenty.com/v2/agents?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Agenty rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { agenty: agenty.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.agenty ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Agenty",
        description: "Run Agenty web scraping and browser automation agents: agents, jobs, lists, inputs, schedules, workflows, connections and team users.",
        icons,
      },
    ),
  }),
);

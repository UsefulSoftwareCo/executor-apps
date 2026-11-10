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

const lyzr = defineProvider({
  name: "Lyzr",
  hosts: ["agent-prod.studio.lyzr.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://agent-prod.studio.lyzr.ai/v3/agents/", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    // The agent list is a bare JSON array, which the object decoder cannot describe.
    if (!response.ok) throw new Error(`Lyzr rejected the API key: ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { lyzr: lyzr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lyzr ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lyzr",
        description: "Build, run and manage AI agents in Lyzr Agent Studio: agents, sessions, knowledge bases, tools, workflows and more.",
        icons,
      },
    ),
  }),
);

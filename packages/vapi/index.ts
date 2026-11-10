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

const vapi = defineProvider({
  name: "Vapi",
  hosts: ["api.vapi.ai"],
  auth: {
    apiKey: secrets({
      label: "Private API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.vapi.ai/assistant?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Vapi health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { vapi: vapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Vapi",
        description: "Build and run voice AI agents with Vapi: assistants, calls, phone numbers, tools, squads, files, knowledge bases and analytics.",
        icons,
      },
    ),
  }),
);

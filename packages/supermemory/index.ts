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

const supermemory = defineProvider({
  name: "Supermemory",
  hosts: ["api.supermemory.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.supermemory.ai/v3/container-tags/list", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Supermemory rejected the API key (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { supermemory: supermemory.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.supermemory ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Supermemory",
        description:
          "Memory and context for AI agents with Supermemory: documents, memories, user profiles, search, container tags and connections.",
        icons,
      },
    ),
  }),
);

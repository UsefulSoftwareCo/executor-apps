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

const langbase = defineProvider({
  name: "Langbase",
  hosts: ["api.langbase.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists the pipes visible to the key; a bare 200 is enough.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.langbase.com/v1/pipes", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Langbase returned ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { langbase: langbase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.langbase ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Langbase",
        description: "Run and manage Langbase AI agents: pipes, memory, threads, tools, embeddings and traces.",
        icons,
      },
    ),
  }),
);

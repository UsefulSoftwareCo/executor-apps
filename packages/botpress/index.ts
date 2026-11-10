import {
  accountRouter,
  decodeJson,
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
import { adminOptions, filesOptions, runtimeOptions, tablesOptions } from "./openapi.js";

const botpress = defineProvider({
  name: "Botpress",
  hosts: ["api.botpress.cloud"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.botpress.cloud/v1/admin/account/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { botpress: botpress.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.botpress ?? [],
        async (account) => {
          const mount = (options: typeof adminOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({
            admin: await mount(adminOptions),
            runtime: await mount(runtimeOptions),
            files: await mount(filesOptions),
            tables: await mount(tablesOptions),
          });
        },
        { signal },
      ),
      {
        title: "Botpress",
        description:
          "Build and manage Botpress Cloud agents: workspaces, bots, integrations, runtime conversations and messages, files and tables.",
        instructions:
          "Admin operations that act inside a workspace take an x-workspace-id header parameter (list workspaces first). Runtime, files and tables operations take x-bot-id to choose the bot.",
        icons,
      },
    ),
  }),
);

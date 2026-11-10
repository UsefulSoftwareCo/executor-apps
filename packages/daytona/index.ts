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
import { platformOptions, toolboxOptions } from "./openapi.js";

const daytona = defineProvider({
  name: "Daytona",
  hosts: ["app.daytona.io", "proxy.app.daytona.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.daytona.io/api/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { daytona: daytona.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.daytona ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              platform: mount(platformOptions),
              toolbox: mount(toolboxOptions),
            },
            { title: "Daytona", description: "Daytona account." },
          );
        },
        { signal },
      ),
      {
        title: "Daytona",
        description:
          "Daytona cloud sandboxes. platform: sandboxes, snapshots, volumes, runners, organizations and API keys. toolbox: files, processes, git, LSP and computer use inside a running sandbox (pass sandboxId).",
        icons,
      },
    ),
  }),
);

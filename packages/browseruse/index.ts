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
import { options, v2Options, v4Options } from "./openapi.js";

const browseruse = defineProvider({
  name: "Browser Use",
  hosts: ["api.browser-use.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.browser-use.com/api/v3/billing/account", {
      signal,
      headers: { "X-Browser-Use-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { browseruse: browseruse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.browseruse ?? [],
        (account) => {
          const mount = (spec: typeof options | typeof v2Options | typeof v4Options) =>
            withApprovals(liveOpenapiRouter({ ...spec, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { v4: mount(v4Options), v3: mount(options), v2: mount(v2Options) },
            { title: "Browser Use", description: "Browser Use Cloud account. Prefer v4." },
          );
        },
        { signal },
      ),
      {
        title: "Browser Use",
        description:
          "Browser Use Cloud. v4 (current, prefer it): runs, sessions, browsers, profiles, workspaces, integrations, wallets and extensions. v3 (superseded by v4): session-based browser agents, raw browsers, profiles, workspaces and billing. v2: tasks, sessions, browsers, profiles, skills, marketplace and files.",
        icons,
      },
    ),
  }),
);

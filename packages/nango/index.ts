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
import { options } from "./openapi.js";

const nango = defineProvider({
  name: "Nango",
  hosts: ["api.nango.dev"],
  auth: {
    apiKey: secrets({
      label: "Environment API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    accountKey: secrets({
      label: "Account API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Account API keys cannot call environment endpoints, so they are checked on /environments.
    const path = account.method === "accountKey" ? "/environments" : "/integrations";
    const response = await fetch(`https://api.nango.dev${path}`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { nango: nango.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nango ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nango",
        description: "Manage Nango integrations, connections, syncs, actions, records, functions and Connect sessions.",
        icons,
      },
    ),
  }),
);

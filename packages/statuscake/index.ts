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

const statuscake = defineProvider({
  name: "StatusCake",
  hosts: ["api.statuscake.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists one uptime test; any valid API key can read it.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.statuscake.com/v1/uptime?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { statuscake: statuscake.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.statuscake ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "StatusCake",
        description: "Monitor websites and servers with StatusCake: uptime, page speed, SSL and heartbeat tests, contact groups, maintenance windows and public pages.",
        icons,
      },
    ),
  }),
);

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

const xquik = defineProvider({
  name: "Xquik",
  hosts: ["xquik.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://xquik.com/api/v1/account", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ plan: string() }));
  },
});

export default defineApp(
  { user: { accounts: { xquik: xquik.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.xquik ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Xquik",
        description: "Search public X data, monitor accounts and keywords, compose and publish posts, run giveaways and exports with Xquik.",
        icons,
      },
    ),
  }),
);

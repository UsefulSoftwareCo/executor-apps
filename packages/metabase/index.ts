import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { metabaseOptions, siteUrl } from "./openapi.js";

const metabase = defineProvider({
  name: "Metabase",
  // No `hosts`: self-hosted instances live on any domain, and a wildcard is not a valid host pattern.
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        url: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = siteUrl(account.fields.url);
    const response = await fetch(`${base}/api/user/current`, {
      signal,
      headers: { "X-API-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { metabase: metabase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.metabase ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...metabaseOptions(account.fields.url), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Metabase",
        description:
          "Metabase cards, dashboards, collections, databases, tables, datasets, users, permissions and alerts on your own Metabase instance.",
        icons,
      },
    ),
  }),
);

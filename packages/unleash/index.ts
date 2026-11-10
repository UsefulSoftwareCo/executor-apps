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
import { siteUrl, unleashOptions } from "./openapi.js";

const unleash = defineProvider({
  name: "Unleash",
  // No `hosts`: self-hosted instances live on any domain, and a wildcard is not a valid host pattern.
  auth: {
    // Personal access token, service account token or admin API token, sent as the raw Authorization header.
    token: secrets({
      label: "API token",
      fields: object({
        url: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = siteUrl(account.fields.url);
    const response = await fetch(`${base}/api/admin/projects`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { unleash: unleash.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.unleash ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...unleashOptions(account.fields.url), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Unleash",
        description:
          "Unleash feature flags: projects, flags, environments, strategies, segments, contexts, API tokens, users, groups, change requests and metrics.",
        icons,
      },
    ),
  }),
);

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
import { openapiOptions, siteUrl } from "./openapi.js";

const ingeniousbuild = defineProvider({
  name: "INGENIOUS.BUILD",
  hosts: ["*.ingenious.build"],
  auth: {
    // The OAuth client-credentials token endpoint is per-workspace
    // (https://<subdomain>.ingenious.build/api/v2/pub/oauth/token); the framework only takes a
    // static endpoint, so only the personal access token is offered.
    accessToken: secrets({
      label: "Access token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${siteUrl(account.fields.subdomain)}/api/v2/pub/account-types?per_page=1`,
      { signal, headers: { AccessToken: account.fields.token, Accept: "application/json" } },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ingeniousbuild: ingeniousbuild.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ingeniousbuild ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...openapiOptions(account.fields.subdomain),
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "INGENIOUS.BUILD",
        description:
          "INGENIOUS.BUILD construction management: projects, accounting, cost codes, contracts, change orders, RFIs, submittals and more.",
        icons,
      },
    ),
  }),
);

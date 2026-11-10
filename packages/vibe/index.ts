import {
  accountRouter,
  decodeJson,
  array,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, revision } from "./openapi.js";

const Account = object({ id: number(), name: string() });

const vibe = defineProvider({
  name: "Vibe",
  hosts: ["api.vibe.co"],
  auth: {
    // Create the app under My Applications in the Vibe Developer tool, choosing OAuth. Register
    // Executor's redirect URI and copy the client id and secret into the connect page.
    oauth: oauth2({
      discover: "https://api.vibe.co",
      scopes: [
        "offline_access",
        "account:read",
        "advertisers:read",
        "advertisers:write",
        "audiences:read",
        "audiences:write",
        "billing:read",
        "campaigns:read",
        "campaigns:publish",
        "campaigns:write",
        "creatives:read",
        "creatives:write",
        "reporting:read",
      ],
    }),
    // Server-to-server app (client credentials), created the same way with that grant selected.
    serverToServer: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.vibe.co/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      tokenRequestFormat: "form",
      scopes: [
        "account:read",
        "advertisers:read",
        "advertisers:write",
        "audiences:read",
        "audiences:write",
        "billing:read",
        "campaigns:read",
        "campaigns:publish",
        "campaigns:write",
        "creatives:read",
        "creatives:write",
        "reporting:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.vibe.co/accounts", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, "X-Vibe-Revision": revision },
    });
    await decodeJson(response, array(Account));
  },
});

export default defineApp(
  { user: { accounts: { vibe: vibe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vibe ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              parameterDefaults: { headers: { "X-Vibe-Revision": revision } },
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
        title: "Vibe",
        description:
          "Vibe Connected TV advertising: accounts, advertisers, audiences, campaigns, strategies, creatives, targeting catalog, billing and reports.",
        instructions:
          "Campaign and strategy publish or ACTIVATE actions can begin paid delivery and spend. Embedded apps must also pass account_id.",
        icons,
      },
    ),
  }),
);

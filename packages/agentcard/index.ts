import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Credential = object({ organization_id: string() });

const agentcard = defineProvider({
  name: "Agentcard",
  hosts: ["api.agentcard.sh"],
  auth: {
    // OAuth2 client credentials from Organization > Developer > Credentials in the Agentcard dashboard.
    // Tokens live one hour; the client is sandbox or production depending on the credential.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.agentcard.sh/api/v2/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.agentcard.sh/api/v2", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Credential);
    return { accountInfo: { externalId: me.organization_id, displayName: me.organization_id } };
  },
});

export default defineApp(
  { user: { accounts: { agentcard: agentcard.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.agentcard ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Agentcard",
        description:
          "Connect users to your platform, verify their identity, manage virtual cards, and buy from merchants on their behalf.",
        icons,
      },
    ),
  }),
);

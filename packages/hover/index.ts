import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// List Organization Tree: [{ id, dashed_ancestral_name }]; the first entry is the authenticated org.
const OrgTree = array(object({ id: number() }));

const hover = defineProvider({
  name: "Hover",
  hosts: ["hover.to"],
  auth: {
    // Hover issues a client ID and secret per integration; the connect page asks for them.
    oauth: oauth2({
      authorizationUrl: "https://hover.to/oauth/authorize",
      tokenUrl: "https://hover.to/oauth/token",
      // Hover documents client_id/client_secret as JSON or multipart body parameters.
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://hover.to/api/v2/orgs/administered", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const orgs = await decodeJson(response, OrgTree);
    const org = orgs[0];
    return org === undefined ? {} : { accountInfo: { externalId: String(org.id) } };
  },
});

export default defineApp(
  { user: { accounts: { hover: hover.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hover ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Hover",
        description:
          "Hover property capture jobs, capture requests, measurements, images, deliverables, job shares, webhooks, wallets and users.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const rydoo = defineProvider({
  name: "Rydoo",
  hosts: ["api.rydoo.com", "accounts.rydoo.com"],
  auth: {
    // The Client ID and secret Rydoo support issues for a company; exchanged at the token endpoint with Basic
    // client authentication.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://accounts.rydoo.com/connect/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["api_xpd2", "openid"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.rydoo.com/v2/groups/count", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "rydoo", displayName: "Rydoo" } };
  },
});

export default defineApp(
  { user: { accounts: { rydoo: rydoo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rydoo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rydoo",
        description:
          "Rydoo expense management: expenses, receipts, users, groups, branches, projects, transactions, custom fields, categories, trips, reimbursements and approval workflows.",
        icons,
      },
    ),
  }),
);

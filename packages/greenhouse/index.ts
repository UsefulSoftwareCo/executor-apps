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

const greenhouse = defineProvider({
  name: "Greenhouse",
  hosts: ["harvest.greenhouse.io", "auth.greenhouse.io"],
  auth: {
    // Harvest v3 custom integration: credentials from Greenhouse > API Credentials > Harvest V3 (OAuth).
    // The scopes are fixed on the credential in Greenhouse, so none are requested here.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://auth.greenhouse.io/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // Needs the harvest:users:list scope on the credential.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://harvest.greenhouse.io/v3/users?per_page=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, array(object({ id: number() })));
  },
});

export default defineApp(
  { user: { accounts: { greenhouse: greenhouse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.greenhouse ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Greenhouse",
        description:
          "Greenhouse recruiting (Harvest v3): candidates, applications, jobs, job posts, interviews, scorecards, offers, openings, users and organization settings.",
        instructions:
          "Tools only work for scopes granted to the API credential; a 403 usually means a missing harvest:<resource>:<action> scope. List endpoints use cursor pagination.",
        icons,
      },
    ),
  }),
);

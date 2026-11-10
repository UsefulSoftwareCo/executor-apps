import {
  accountRouter,
  array,
  json,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// listGroups (GET /groups) inherits the spec's global security, so it needs a valid bearer token, and it
// returns only the projects the account can see, so it also works for project-scoped service accounts
// (listing organizations does not). The response always carries "results"; no per-account identity is
// exposed by it, so health returns no accountInfo.
const Projects = object({ results: array(json()) });

const mongodb = defineProvider({
  name: "MongoDB Atlas",
  hosts: ["cloud.mongodb.com"],
  auth: {
    // An Atlas service account (organization or project Access Manager > Applications > Service Accounts).
    // Its permissions come from the roles granted to the account, so no scopes are requested.
    serviceAccount: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://cloud.mongodb.com/api/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://cloud.mongodb.com/api/atlas/v2/groups?itemsPerPage=1", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        Accept: "application/vnd.atlas.2023-01-01+json",
      },
    });
    await decodeJson(response, Projects);
  },
});

export default defineApp(
  { user: { accounts: { mongodb: mongodb.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mongodb ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "MongoDB",
        description:
          "MongoDB Atlas organizations, projects, clusters, database users, network access, backups, alerts, search indexes and the rest of the Atlas Administration API.",
        icons,
      },
    ),
  }),
);

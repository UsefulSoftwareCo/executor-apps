import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  array,
  object,
  string,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { v1Options, v2Options } from "./openapi.js";

const neo4j = defineProvider({
  name: "Neo4j",
  hosts: ["api.neo4j.io"],
  auth: {
    // Aura console > Account settings > API keys (Client credentials): a client ID and secret.
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.neo4j.io/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.neo4j.io/v1/tenants", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: array(object({ id: string() })) }));
  },
});

export default defineApp(
  { user: { accounts: { neo4j: neo4j.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.neo4j ?? [],
        (account) => {
          const mount = (options: typeof v1Options | typeof v2Options) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { v1: mount(v1Options), v2beta1: mount(v2Options) },
            { title: "Neo4j Aura", description: "Neo4j Aura API." },
          );
        },
        { signal },
      ),
      {
        title: "Neo4j",
        description:
          "Neo4j Aura management. v1: instances, tenants, snapshots, customer-managed keys, Graph Analytics sessions. v2beta1: organizations, projects, users, invites, IP filters, databases, backups, import jobs, billing, fleet manager.",
        icons,
      },
    ),
  }),
);

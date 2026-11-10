import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://backboard.railway.com/graphql/v2";
const userinfoUrl = "https://backboard.railway.com/oauth/me";

const tokenFields = object({ token: string({ minLength: 1 }) });

type Account =
  | { method: "apiKey" | "workspaceToken"; fields: { token: string } }
  | { method: "projectToken"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Project tokens use their own header; every other token is a bearer token.
function authorization(account: Account): Record<string, string> {
  if (account.method === "oauth") return { Authorization: `Bearer ${account.fields.access_token}` };
  if (account.method === "projectToken") return { "Project-Access-Token": account.fields.token };
  return { Authorization: `Bearer ${account.fields.token}` };
}

const railway = defineProvider({
  name: "Railway",
  hosts: ["backboard.railway.com"],
  auth: {
    // Account tokens cover everything the user can access.
    apiKey: secrets({ label: "Account token", fields: tokenFields }),
    workspaceToken: secrets({ label: "Workspace token", fields: tokenFields }),
    projectToken: secrets({ label: "Project token", fields: tokenFields }),
    // Railway publishes OIDC metadata; the connect page asks for an OAuth app's client.
    oauth: oauth2({
      discover: "https://backboard.railway.com",
      scopes: ["openid", "email", "profile", "offline_access", "workspace:member", "project:member"],
      authorizationParams: { prompt: "consent" },
      // Railway's protected-resource metadata names https://backboard.railway.com, but its token
      // endpoint answers that resource indicator with `invalid_target`. Railway's OAuth docs send
      // no resource, and tokens issued without one work for the GraphQL API.
      resource: null,
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch(userinfoUrl, { signal, headers: authorization(account) });
      const me = await decodeJson(response, object({ sub: string() }));
      return { accountInfo: { externalId: me.sub, displayName: "Railway account" } };
    }
    const query =
      account.method === "apiKey"
        ? "{ me { id email } }"
        : account.method === "workspaceToken"
          ? "{ apiToken { workspaces { id name } } }"
          : "{ projectToken { projectId environmentId } }";
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (account.method === "apiKey") {
      const { data } = await decodeJson(
        response,
        object({ data: object({ me: object({ id: string(), email: string() }) }) }),
      );
      return { accountInfo: { externalId: data.me.id, displayName: data.me.email, email: data.me.email } };
    }
    if (account.method === "projectToken") {
      const { data } = await decodeJson(
        response,
        object({ data: object({ projectToken: object({ projectId: string(), environmentId: string() }) }) }),
      );
      return { accountInfo: { externalId: data.projectToken.projectId, displayName: "Railway project token" } };
    }
    const { data } = await decodeJson(
      response,
      object({ data: object({ apiToken: object({ workspaces: array(object({ id: string(), name: string() })) }) }) }),
    );
    const workspace = data.apiToken.workspaces[0];
    return {
      accountInfo: {
        externalId: workspace === undefined ? "workspace-token" : workspace.id,
        displayName: workspace === undefined ? "Railway workspace token" : workspace.name,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { railway: railway.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.railway ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Railway",
        description: "Projects, services, deployments, environments, variables, domains and the rest of Railway's GraphQL API.",
        icons,
      },
    ),
  }),
);

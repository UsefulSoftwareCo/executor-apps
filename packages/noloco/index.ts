import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  toolAnnotations,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const mcpUrl = "https://api.core.noloco.io/mcp";

type OAuthAccount = { method: "oauth"; fields: { access_token: string } };

const mcpHeaders = (account: OAuthAccount) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// Every Noloco app has its own generated GraphQL schema, and so its own endpoint.
const appNamePattern = /^[A-Za-z0-9_-]+$/;

const graphqlEndpoint = (appName: string) => {
  const name = appName.trim();
  if (!name) throw new Error("Enter the Noloco app name.");
  if (!appNamePattern.test(name)) throw new Error("Enter the app name exactly as it appears in the app's API URL.");
  return `https://api.portals.noloco.io/data/${name}`;
};

const noloco = defineProvider({
  name: "Noloco",
  hosts: ["api.core.noloco.io", "api.portals.noloco.io"],
  auth: {
    oauth: oauth2({ discover: mcpUrl }),
    // Found under API & Integrations in the app's settings; scoped to one app.
    apiKey: secrets({
      label: "App API key (GraphQL)",
      fields: object({
        appName: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health(check) {
    const { account } = check;
    if (account.method === "oauth") return mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(account) });
    const appName = account.fields.appName.trim();
    const response = await check.fetch(graphqlEndpoint(appName), {
      method: "POST",
      signal: check.signal,
      headers: { ...account.headers(), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
    return { accountInfo: { externalId: appName, displayName: appName } };
  },
});

export default defineApp({ user: { accounts: { noloco: noloco.many() } }, icons }, async ({ user, cache, signal }) => ({
  tools: router(
    {
      mcp: await accountRouter(
        (user?.accounts.noloco ?? []).filter((account) => account.method === "oauth"),
        async (account) =>
          withApprovals(await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      graphql: router(
        await accountRouter(
          (user?.accounts.noloco ?? []).filter((account) => account.method === "apiKey"),
          async (account) =>
            withApprovals(
              await graphqlRouter({
                url: graphqlEndpoint(account.fields.appName),
                account,
                headers: account.headers(),
                cache,
                signal,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        {
          title: "Noloco GraphQL",
          description: "One app's generated GraphQL API: query, create, update and delete records in its tables.",
        },
      ),
    },
    {
      title: "Noloco",
      description:
        "Noloco no-code apps and portals: tables, schemas and records. Use mcp (OAuth) across every app you approve; use graphql with one app's API key for that app's generated schema.",
      icons,
    },
  ),
}));

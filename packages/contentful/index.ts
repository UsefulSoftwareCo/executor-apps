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

const usUrl = "https://mcp.contentful.com/mcp";
const euUrl = "https://mcp.eu.contentful.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The GraphQL Content API has one generated schema, and so one endpoint, per space and environment.
const identifier = /^[A-Za-z0-9_-]+$/;

const graphqlEndpoint = (space: string, environment: string) => {
  const spaceId = space.trim();
  const environmentId = environment.trim();
  if (!spaceId) throw new Error("Enter the space ID.");
  if (!environmentId) throw new Error("Enter the environment ID, for example master.");
  if (!identifier.test(spaceId)) throw new Error("Enter the space ID (letters, digits, hyphens, underscores).");
  if (!identifier.test(environmentId))
    throw new Error("Enter the environment ID, for example master (letters, digits, hyphens, underscores).");
  return `https://graphql.contentful.com/content/v1/spaces/${spaceId}/environments/${environmentId}`;
};

// Both servers publish OAuth metadata with dynamic client registration and no scopes.
const contentful = defineProvider({
  name: "Contentful",
  hosts: ["mcp.contentful.com", "graphql.contentful.com"],
  auth: {
    oauth: oauth2({ discover: usUrl }),
    // A Content Delivery API token reads published content; a Content Preview API token also reads drafts.
    // Both are created under Settings > API keys in the Contentful web app. Contentful offers no OAuth
    // flow for the GraphQL Content API (OAuth tokens belong to the Content Management API), so this
    // method is used only by the graphql group.
    accessToken: secrets({
      label: "Content Delivery or Preview API token (GraphQL)",
      fields: object({
        space: plain(string({ minLength: 1 })),
        environment: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health(check) {
    const { account } = check;
    if (account.method === "oauth") return mcpHealth(check, { url: usUrl, headers: headers(account) });
    const response = await check.fetch(graphqlEndpoint(account.fields.space, account.fields.environment), {
      method: "POST",
      signal: check.signal,
      headers: { ...account.headers(), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
    const environment = account.fields.environment.trim();
    return {
      accountInfo: {
        externalId: `${account.fields.space.trim()}/${environment}`,
        displayName: `${account.fields.space.trim()} (${environment})`,
      },
    };
  },
});

const contentfulEu = defineProvider({
  name: "Contentful (EU)",
  hosts: ["mcp.eu.contentful.com"],
  auth: {
    oauth: oauth2({ discover: euUrl }),
  },
  health: (check) => mcpHealth(check, { url: euUrl, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { contentful: contentful.many(), contentfulEu: contentfulEu.many() } }, icons },
  async ({ user, cache, signal }) => {
    const mount = (url: string) => async (account: Account & { readonly id: string }) =>
      withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
        toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
      );
    return {
      tools: router(
        {
          us: await accountRouter(
            (user?.accounts.contentful ?? []).filter((account) => account.method === "oauth"),
            mount(usUrl),
            { signal },
          ),
          eu: await accountRouter(user?.accounts.contentfulEu ?? [], mount(euUrl), { signal }),
          graphql: router(
            await accountRouter(
              (user?.accounts.contentful ?? []).filter((account) => account.method === "accessToken"),
              async (account) =>
                withApprovals(
                  await graphqlRouter({
                    url: graphqlEndpoint(account.fields.space, account.fields.environment),
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
              title: "Contentful GraphQL",
              description: "Read a space's entries, assets and collections through its generated GraphQL Content API.",
              instructions:
                "Queries return published content by default. To read drafts (Content Preview API token only), pass `preview: true` on each collection or entry field, for example `blogPostCollection(preview: true) { items { title } }`. Without it a preview token still returns published content.",
            },
          ),
        },
        {
          title: "Contentful",
          description:
            "Contentful headless CMS: spaces, environments, content types, entries, assets, locales, tags and releases. Use the us group for the global region and eu for the EU region (both manage content over OAuth); use graphql to read delivered content with a Content Delivery or Preview API token.",
          icons,
        },
      ),
    };
  },
);

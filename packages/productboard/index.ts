import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const productboard = defineProvider({
  name: "Productboard",
  hosts: ["api.productboard.com"],
  auth: {
    token: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Productboard has no dynamic registration for this flow: the connect page asks for the client of an
    // OAuth2 application registered at https://app.productboard.com/oauth2/applications.
    oauth: oauth2({
      authorizationUrl: "https://app.productboard.com/oauth2/authorize",
      tokenUrl: "https://app.productboard.com/oauth2/token",
      revocationUrl: "https://app.productboard.com/oauth2/revoke",
      // The guide lists client_id and client_secret as parameters of the token POST. It sends no scope
      // parameter on the authorize request: scopes are chosen when the application is registered.
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  // Lists the workspace's entity types: read-only and available to every token with entities:read.
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.productboard.com/v2/entities/configurations", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: array(object({})) }));
    return { accountInfo: { externalId: "productboard", displayName: "Productboard workspace" } };
  },
});

export default defineApp(
  { user: { accounts: { productboard: productboard.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.productboard ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              entities: mount(apis.entities),
              notes: mount(apis.notes),
              members: mount(apis.members),
              teams: mount(apis.teams),
              webhooks: mount(apis.webhooks),
              jiraIntegrations: mount(apis.jiraIntegrations),
              pluginIntegrations: mount(apis.pluginIntegrations),
              customerScores: mount(apis.customerScores),
              analytics: mount(apis.analytics),
            },
            { title: "Productboard", description: "Productboard workspace." },
          );
        },
        { signal },
      ),
      {
        title: "Productboard",
        description:
          "Productboard REST API v2. entities: features, components, products, initiatives, objectives, key results, releases and their relationships and custom fields. notes: customer feedback notes and their links. members and teams. webhooks. jiraIntegrations and pluginIntegrations. customerScores. analytics.",
        icons,
      },
    ),
  }),
);

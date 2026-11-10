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
import { apis } from "./openapi.js";

const domo = defineProvider({
  name: "Domo",
  hosts: ["api.domo.com"],
  auth: {
    // An API client (client ID and secret) created at https://developer.domo.com/manage-clients, using the client
    // credentials grant with HTTP Basic client authentication. With no scope requested, the token carries every
    // scope the client was granted.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.domo.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // The token carries no account identity, so the check only proves that it works. Listing users needs the `user`
  // scope; every client created in the developer portal is offered it.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.domo.com/v1/users?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, array(object({ id: number() })));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { domo: domo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.domo ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              datasets: mount(apis.datasets),
              streams: mount(apis.streams),
              accounts: mount(apis.accounts),
              cards: mount(apis.cards),
              pages: mount(apis.pages),
              users: mount(apis.users),
              groups: mount(apis.groups),
              projects: mount(apis.projects),
              activity: mount(apis.activity),
              embed: mount(apis.embed),
              simple: mount(apis.simple),
            },
            { title: "Domo", description: "Domo Platform API." },
          );
        },
        { signal },
      ),
      {
        title: "Domo",
        description:
          "Domo. datasets: DataSets, data, queries and PDP policies. streams: Streams and executions for uploading data. accounts: data accounts and account types. cards: cards. pages: pages and collections. users, groups: people and groups. projects: projects, lists, tasks and attachments. activity: audit log. embed: embed tokens. simple: simple JSON data push.",
        instructions:
          "This is Domo's public Platform API on api.domo.com. What a call may do depends on the scopes (data, user, dashboard, account, audit, buzz) granted to the API client.",
        icons,
      },
    ),
  }),
);

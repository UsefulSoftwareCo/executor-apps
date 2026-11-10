import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { registryOptions, userManagementOptions } from "./openapi.js";

const swaggerhub = defineProvider({
  name: "SwaggerHub",
  hosts: ["api.swaggerhub.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the caller's organizations needs only a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.swaggerhub.com/user-management/v1/orgs", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { swaggerhub: swaggerhub.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.swaggerhub ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              registry: approve(liveOpenapiRouter({ ...registryOptions, cache, fetch, signal, account })),
              users: approve(liveOpenapiRouter({ ...userManagementOptions, cache, fetch, signal, account })),
            },
            { title: "SwaggerHub", description: "SwaggerHub account." },
          );
        },
        { signal },
      ),
      {
        title: "SwaggerHub",
        description:
          "SwaggerHub. registry: APIs, domains, projects, templates, integrations, comments and lifecycle settings. users: organizations, members, teams, roles and resource permissions.",
        icons,
      },
    ),
  }),
);

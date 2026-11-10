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
import { options } from "./openapi.js";

const rollbar = defineProvider({
  name: "Rollbar",
  hosts: ["api.rollbar.com"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing items works with both project and account tokens that have read scope.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.rollbar.com/api/1/items?page=1", {
      signal,
      headers: { "X-Rollbar-Access-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { rollbar: rollbar.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rollbar ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rollbar",
        description: "Rollbar error tracking: items, occurrences, deploys, projects, teams, access tokens and RQL queries.",
        icons,
      },
    ),
  }),
);

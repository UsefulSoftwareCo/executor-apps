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

const redirectPizza = defineProvider({
  name: "redirect.pizza",
  hosts: ["redirect.pizza"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Needs the team:read scope on the token.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://redirect.pizza/api/v1/team", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { redirectPizza: redirectPizza.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.redirectPizza ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "redirect.pizza",
        description: "Manage redirect.pizza redirects, email forwards, domains, analytics and team members, and test redirects or generate QR codes.",
        icons,
      },
    ),
  }),
);

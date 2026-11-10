import {
  accountRouter,
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

const shortenrest = defineProvider({
  name: "Shorten.REST",
  hosts: ["api.shorten.rest"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists one alias; a bad key answers 401/403.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.shorten.rest/aliases/all?limit=1", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Shorten.REST rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { shortenrest: shortenrest.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shortenrest ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Shorten.REST",
        description: "Create and manage Shorten.REST short link aliases and read click analytics.",
        icons,
      },
    ),
  }),
);

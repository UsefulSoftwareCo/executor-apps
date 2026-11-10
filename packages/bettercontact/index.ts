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

const description =
  "Waterfall email and phone enrichment, lead finder, company finder and profile lookups with BetterContact.";

const bettercontact = defineProvider({
  name: "BetterContact",
  hosts: ["app.bettercontact.rocks"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.bettercontact.rocks/api/v2/account", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { bettercontact: bettercontact.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bettercontact ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { title: "BetterContact", description, icons },
    ),
  }),
);

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

const highergov = defineProvider({
  name: "HigherGov",
  hosts: ["www.highergov.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Smallest keyed read-only lookup. decodeJson rejects non-2xx with a status-only error, so the key in the
    // query string is not echoed into error messages.
    const url = new URL("https://www.highergov.com/api-external/naics/");
    url.searchParams.set("page_size", "1");
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { highergov: highergov.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.highergov ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HigherGov",
        description:
          "Government market intelligence: federal and state/local opportunities, contracts, grants, awardees, agencies, vehicles and people.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  literal,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { matchOptions, options } from "./openapi.js";

const interzoid = defineProvider({
  name: "Interzoid",
  hosts: ["api.interzoid.com", "match.interzoid.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // getcountryinfo is a single-row lookup (about one credit per call; every Interzoid endpoint
  // is metered). A bad key is answered with 403 text, so only a Code: Success body passes.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.interzoid.com/getcountryinfo?country=France", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ Code: literal("Success") }));
  },
});

export default defineApp(
  { user: { accounts: { interzoid: interzoid.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.interzoid ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        match: await accountRouter(
          user?.accounts.interzoid ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...matchOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Interzoid",
        description:
          "Data quality and enrichment: similarity keys and match scores for companies, names and addresses, standardization, verification, and entity enrichment.",
        icons,
      },
    ),
  }),
);

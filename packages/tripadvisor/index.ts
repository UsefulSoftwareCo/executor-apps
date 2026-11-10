import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { accountOptions, feedOptions, partnerOptions } from "./openapi.js";

const tripadvisor = defineProvider({
  name: "Tripadvisor",
  hosts: ["terra.tripadvisor.com"],
  auth: {
    apiKey: secrets({
      label: "Terra API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The catalog is not limited by the partner allowlist, so any key can read a known location.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://terra.tripadvisor.com/api/catalog/locations/187147", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({ id: number() }));
  },
});

export default defineApp(
  { user: { accounts: { tripadvisor: tripadvisor.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tripadvisor ?? [],
        (account) => {
          const mount = (options: typeof partnerOptions | typeof accountOptions | typeof feedOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({
            partner: mount(partnerOptions),
            account: mount(accountOptions),
            feed: mount(feedOptions),
          });
        },
        { signal },
      ),
      {
        title: "Tripadvisor",
        description: "Tripadvisor Terra: Partner API (locations, geos, reviews, photos, search, recommendations), Account API (location allowlist) and Feed API (feed files).",
        icons,
      },
    ),
  }),
);

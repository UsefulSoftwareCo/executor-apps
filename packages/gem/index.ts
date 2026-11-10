import {
  accountRouter,
  array,
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
import { atsOptions, crmOptions, jobBoardOptions } from "./openapi.js";

const gem = defineProvider({
  name: "Gem",
  hosts: ["api.gem.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists the team's users; any CRM key can read them.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gem.com/v0/users?page_size=1", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp({ user: { accounts: { gem: gem.many() } }, icons }, async ({ user, cache, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.gem ?? [],
      (account) => {
        const mount = (
          options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">,
        ) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        return router(
          {
            crm: mount(crmOptions),
            ats: mount(atsOptions),
            jobBoard: mount(jobBoardOptions),
          },
          { title: "Gem", description: "Gem account." },
        );
      },
      { signal },
    ),
    {
      title: "Gem",
      description:
        "Gem recruiting. crm: candidates, projects, sequences, custom fields, users. ats: jobs, applications, candidates, scorecards, offers (requires Gem ATS). jobBoard: public job posts, departments and offices, and application submission.",
      icons,
    },
  ),
}));

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
import { options } from "./openapi.js";

const dataforseo = defineProvider({
  name: "DataForSEO",
  hosts: ["api.dataforseo.com"],
  auth: {
    apiKey: secrets({
      label: "API login and password",
      fields: object({ login: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.login}:${account.fields.password}`)}` },
    });
    await decodeJson(response, object({ status_code: number() }));
  },
});

export default defineApp(
  { user: { accounts: { dataforseo: dataforseo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dataforseo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DataForSEO",
        description: "SEO data with DataForSEO: SERP, keywords, backlinks, on-page, domain analytics, labs, merchant, business data and AI optimization.",
        icons,
      },
    ),
  }),
);

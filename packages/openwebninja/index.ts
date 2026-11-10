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

const openwebninja = defineProvider({
  name: "OpenWeb Ninja",
  hosts: ["api.openwebninja.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // UNVERIFIED: /usage is not documented by the vendor; it returns 401 without a key (unknown routes
  // return 403), but its success response was never seen with a real key, so only a 2xx JSON object is
  // required. It also needs the key to have access to the JSearch API.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.openwebninja.com/usage?api_id=jsearch", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { openwebninja: openwebninja.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openwebninja ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenWeb Ninja",
        description:
          "Real-time web data: Google search and AI answers, maps and local business, jobs, Amazon/Walmart/eBay products, Zillow/Redfin listings, finance, news, events, contacts and scraping.",
        icons,
      },
    ),
  }),
);

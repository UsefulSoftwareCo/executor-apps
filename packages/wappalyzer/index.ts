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

const wappalyzer = defineProvider({
  name: "Wappalyzer",
  hosts: ["api.wappalyzer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.wappalyzer.com/v2/credits/balance/", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ credits: number() }));
  },
});

export default defineApp(
  { user: { accounts: { wappalyzer: wappalyzer.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wappalyzer ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Wappalyzer",
        description: "Website technology lookup, lead lists, subdomain discovery, email verification and credit balance.",
        icons,
      },
    ),
  }),
);

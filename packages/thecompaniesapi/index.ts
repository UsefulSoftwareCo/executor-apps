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

const thecompaniesapi = defineProvider({
  name: "The Companies API",
  hosts: ["api.thecompaniesapi.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.thecompaniesapi.com/v2/user", {
      signal,
      headers: { Authorization: `Basic ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`The Companies API rejected the token (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { thecompaniesapi: thecompaniesapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.thecompaniesapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "The Companies API",
        description:
          "Search, enrich and analyze company data: companies by domain, name, email or social profile, technologies, industries, locations, lists and analytics.",
        icons,
      },
    ),
  }),
);

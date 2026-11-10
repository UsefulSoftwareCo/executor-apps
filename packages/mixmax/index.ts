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

const mixmax = defineProvider({
  name: "Mixmax",
  hosts: ["api.mixmax.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mixmax.com/v1/users/me", {
      signal,
      headers: { "X-API-Token": account.fields.token },
    });
    const user = await decodeJson(response, object({ _id: string() }));
    return { accountInfo: { externalId: user._id } };
  },
});

export default defineApp(
  { user: { accounts: { mixmax: mixmax.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mixmax ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mixmax",
        description:
          "Sales engagement in Gmail: sequences and recipients, contacts, messages, templates, tasks, meetings, teams, reports and Salesforce sync.",
        icons,
      },
    ),
  }),
);

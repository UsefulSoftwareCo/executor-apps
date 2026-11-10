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

const benchmarkemail = defineProvider({
  name: "Benchmark Email",
  hosts: ["clientapi.benchmarkemail.com"],
  auth: {
    apiKey: secrets({
      label: "API key (AuthToken)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://clientapi.benchmarkemail.com/Client/ProfileDetails", {
      signal,
      headers: { AuthToken: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { benchmarkemail: benchmarkemail.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.benchmarkemail ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Benchmark Email",
        description: "Benchmark Email marketing: contact lists and contacts, segments, emails and templates, automations, A/B tests, reports and webhooks.",
        icons,
      },
    ),
  }),
);

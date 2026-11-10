import {
  accountRouter,
  array,
  decodeJson,
  json,
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

const sendspark = defineProvider({
  name: "Sendspark",
  hosts: ["api-gw.sendspark.com"],
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api-gw.sendspark.com/v1/workspaces", {
      signal,
      headers: { "x-api-key": account.fields.apiKey, "x-api-secret": account.fields.apiSecret },
    });
    await decodeJson(response, object({ workspaces: array(json()) }));
  },
});

export default defineApp(
  { user: { accounts: { sendspark: sendspark.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sendspark ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Sendspark",
        description:
          "Sendspark video messaging: dynamic video campaigns, prospects, bundles, webhooks and transcripts.",
        icons,
      },
    ),
  }),
);

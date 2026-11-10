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

const doppler = defineProvider({
  name: "Doppler Marketing Automation",
  hosts: ["restapi.fromdoppler.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        accountName: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://restapi.fromdoppler.com/accounts/${encodeURIComponent(account.fields.accountName)}`,
      { signal, headers: { Authorization: `token ${account.fields.token}` } },
    );
    await decodeJson(response, object({ message: string() }));
  },
});

export default defineApp(
  { user: { accounts: { doppler: doppler.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.doppler ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: { path: { accountName: String(account.fields.accountName) } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Doppler Marketing Automation",
        description: "Doppler email marketing: campaigns, lists, subscribers, fields, segments, templates, automations and reports.",
        icons,
      },
    ),
  }),
);

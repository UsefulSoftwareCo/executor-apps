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

const enrich = defineProvider({
  name: "Enrich",
  hosts: ["dev.enrich.so"],
  auth: {
    apiKey: secrets({
      label: "API key (starts with sk_)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only call that returns the credit balance of the key's organization.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://dev.enrich.so/api/v3/wallets/balance", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { enrich: enrich.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.enrich ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Enrich",
        description:
          "Validate and find emails and phones, look up professional profiles, search leads and people, and manage credits with Enrich.",
        icons,
      },
    ),
  }),
);

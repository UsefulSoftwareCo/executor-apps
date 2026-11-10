import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const deel = defineProvider({
  name: "Deel",
  hosts: ["api.letsdeel.com"],
  auth: {
    // Organization or personal token from More > Developer > Access Tokens.
    token: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.fields.token;
    const response = await fetch("https://api.letsdeel.com/rest/v2/legal-entities", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "deel", displayName: "Deel" } };
  },
});

export default defineApp(
  { user: { accounts: { deel: deel.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.deel ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Deel",
        description:
          "Contracts, workers, payroll, invoices, time off, timesheets, legal entities and webhooks in Deel.",
        icons,
      },
    ),
  }),
);

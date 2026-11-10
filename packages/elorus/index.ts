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

const elorus = defineProvider({
  name: "Elorus",
  hosts: ["api.elorus.com"],
  auth: {
    apiKey: secrets({
      label: "API key and organization ID",
      fields: object({
        token: string({ minLength: 1 }),
        organization: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.elorus.com/v1.2/contacts/?page_size=1", {
      signal,
      headers: {
        Authorization: `Token ${account.fields.token}`,
        "X-Elorus-Organization": account.fields.organization,
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { elorus: elorus.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.elorus ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: { headers: { "X-Elorus-Organization": String(account.fields.organization) } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Elorus",
        description:
          "Elorus invoicing and time tracking: contacts, invoices, estimates, credit notes, bills, expenses, payments, products, projects, tasks and time entries.",
        icons,
      },
    ),
  }),
);

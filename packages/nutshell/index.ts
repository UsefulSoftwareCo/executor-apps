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

const nutshell = defineProvider({
  name: "Nutshell",
  hosts: ["app.nutshell.com"],
  auth: {
    apiKey: secrets({
      label: "API key (the email of the Nutshell user that owns the key, and the key)",
      fields: object({ email: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.nutshell.com/rest/users", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.email}:${account.fields.apiKey}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { nutshell: nutshell.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nutshell ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nutshell",
        description: "Nutshell CRM: leads, contacts, accounts, activities, notes, tasks, products, quotes, invoices, audiences and reports.",
        icons,
      },
    ),
  }),
);

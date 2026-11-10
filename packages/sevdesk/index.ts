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

const sevdesk = defineProvider({
  name: "sevdesk",
  hosts: ["my.sevdesk.de"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://my.sevdesk.de/api/v1/Tools/bookkeepingSystemVersion", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { sevdesk: sevdesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sevdesk ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "sevdesk",
        description: "Accounting for sevdesk: contacts, invoices, credit notes, orders, vouchers, transactions, check accounts, parts, tags and exports.",
        icons,
      },
    ),
  }),
);

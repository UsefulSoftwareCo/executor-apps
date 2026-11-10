import {
  accountRouter,
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

const persistiq = defineProvider({
  name: "PersistIQ",
  hosts: ["api.persistiq.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.persistiq.com/v1/users", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`PersistIQ rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { persistiq: persistiq.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.persistiq ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PersistIQ",
        description:
          "Manage PersistIQ sales outreach: leads, campaigns, lead fields and statuses, replies, events, tags, do-not-contact domains and users.",
        icons,
      },
    ),
  }),
);

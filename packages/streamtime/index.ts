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

const streamtime = defineProvider({
  name: "Streamtime",
  hosts: ["api.streamtime.net"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.streamtime.net/v2/branches", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // The branches list is a JSON array, which the object decoder cannot describe.
    if (!response.ok) throw new Error(`Streamtime rejected the token (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { streamtime: streamtime.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.streamtime ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Streamtime",
        description: "Jobs, companies, contacts, invoices, quotes, time tracking and scheduling in Streamtime, through its public v2 API.",
        icons,
      },
    ),
  }),
);

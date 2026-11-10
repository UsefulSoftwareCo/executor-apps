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

const kaleido = defineProvider({
  name: "Kaleido",
  hosts: ["console.kaleido.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://console.kaleido.io/api/v1/orgs", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // GET /orgs answers with a JSON array, so only the status is checked.
    if (!response.ok) throw new Error(`Kaleido health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { kaleido: kaleido.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kaleido ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kaleido",
        description: "Manage Kaleido enterprise blockchain platform resources: organizations, consortia, environments, nodes, services, API keys and app credentials.",
        icons,
      },
    ),
  }),
);

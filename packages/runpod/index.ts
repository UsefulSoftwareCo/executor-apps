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

const runpod = defineProvider({
  name: "Runpod",
  hosts: ["api.runpod.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.runpod.io/v2/account/ssh-keys", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 401) throw new Error("Runpod rejected the API key (HTTP 401)");
    if (response.status === 403) {
      throw new Error("The Runpod API key lacks permission to read account SSH keys (HTTP 403)");
    }
    if (!response.ok) throw new Error(`Runpod health check failed (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { runpod: runpod.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.runpod ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Runpod",
        description: "Manage Runpod GPU cloud: pods, serverless endpoints, templates, network volumes, container registry auth and billing.",
        icons,
      },
    ),
  }),
);

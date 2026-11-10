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

const Workspace = object({ id: string(), name: string() });

const instantly = defineProvider({
  name: "Instantly",
  hosts: ["api.instantly.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.instantly.ai/api/v2/workspaces/current", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const workspace = await decodeJson(response, Workspace);
    return { accountInfo: { externalId: workspace.id, username: workspace.name } };
  },
});

export default defineApp(
  { user: { accounts: { instantly: instantly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.instantly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Instantly",
        description: "Cold email outreach with Instantly: campaigns, leads, sending accounts, warmup, emails, analytics and webhooks.",
        icons,
      },
    ),
  }),
);

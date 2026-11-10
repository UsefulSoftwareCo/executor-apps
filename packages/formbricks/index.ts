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

const formbricks = defineProvider({
  name: "Formbricks",
  hosts: ["app.formbricks.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.formbricks.com/api/v2/me", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    const scoped = response.clone();
    await decodeJson(response, object({ organizationId: string() }));
    // Most tools are workspace-scoped routes; an organization-only key gets 401 on them.
    const body = (await scoped.json()) as { workspaces?: unknown };
    if (!Array.isArray(body.workspaces) || body.workspaces.length === 0) {
      throw new Error(
        "This Formbricks API key has no workspace access. Recreate it with at least one Workspace permission; organization-only keys are rejected by most operations.",
      );
    }
  },
});

export default defineApp(
  { user: { accounts: { formbricks: formbricks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.formbricks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Formbricks",
        description: "Manage Formbricks surveys data: responses, contacts, attributes, webhooks, teams and users.",
        icons,
      },
    ),
  }),
);

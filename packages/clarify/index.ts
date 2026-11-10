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

const clarify = defineProvider({
  name: "Clarify",
  hosts: ["api.clarify.ai"],
  auth: {
    // Settings > API Keys in Clarify. Sent as `Authorization: api-key <key>`, not Bearer.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), workspace: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // GET /v1/workspaces is user-Bearer only; an API key belongs to one workspace, so read that one.
    const response = await fetch(
      `https://api.clarify.ai/v1/workspaces/${encodeURIComponent(account.fields.workspace)}`,
      {
        signal,
        headers: { Authorization: `api-key ${account.fields.token}`, Accept: "application/json" },
      },
    );
    await decodeJson(response, object({ data: object({ id: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { clarify: clarify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clarify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Clarify",
        description:
          "Clarify CRM: query and update records (people, companies, deals, meetings), lists, schemas, workflows, campaigns and workspace users.",
        icons,
      },
    ),
  }),
);

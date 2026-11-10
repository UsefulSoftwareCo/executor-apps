import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const gleap = defineProvider({
  name: "Gleap",
  hosts: ["api.gleap.io"],
  auth: {
    // Project Settings > Security shows both the API key and the project ID.
    apiKey: secrets({
      label: "API key and project ID",
      fields: object({ token: string({ minLength: 1 }), projectId: plain(string({ minLength: 1 })) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gleap.io/v3/teams", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Project: account.fields.projectId,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`Gleap rejected the API key (HTTP ${response.status}).`);
    await response.text();
  },
});

export default defineApp(
  { user: { accounts: { gleap: gleap.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gleap ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gleap",
        description:
          "Customer feedback and support with Gleap: tickets, conversations, sessions, companies, help center, engagement and project settings.",
        icons,
      },
    ),
  }),
);

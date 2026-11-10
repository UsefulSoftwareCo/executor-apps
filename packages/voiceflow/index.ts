import {
  accountRouter,
  array,
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

const voiceflow = defineProvider({
  name: "Voiceflow",
  hosts: ["realtime-api.voiceflow.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://realtime-api.voiceflow.com/v1/stable/workspace", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ workspaces: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { voiceflow: voiceflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.voiceflow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Voiceflow",
        description:
          "Build, run and analyze Voiceflow AI agents: agents, playbooks, functions, tools, knowledge base, conversations, transcripts, tests and analytics.",
        icons,
      },
    ),
  }),
);

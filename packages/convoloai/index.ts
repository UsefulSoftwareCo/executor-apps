import {
  accountRouter,
  array,
  boolean,
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

const convoloai = defineProvider({
  name: "Convolo AI",
  hosts: ["app.brightcall.ai"],
  auth: {
    apiKey: secrets({
      label: "Account API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.brightcall.ai/api/v1/agents?page=1&itemsPerPage=1", {
      signal,
      headers: { "api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Convolo AI rejected the API key (${response.status})`);
    await decodeJson(response, object({ success: boolean(), agents: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { convoloai: convoloai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.convoloai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Convolo AI",
        description: "Brightcall (formerly Convolo.ai) speed-to-lead: agents, widgets, calls, call logs, leads and outcome tags.",
        icons,
      },
    ),
  }),
);

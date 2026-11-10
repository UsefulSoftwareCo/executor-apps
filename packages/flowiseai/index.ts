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

// Scoped to Flowise Cloud so credentials are pinned to a declared host. Self-hosted instances use
// arbitrary domains and are not supported (see README).
const flowise = defineProvider({
  name: "Flowise",
  hosts: ["cloud.flowiseai.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The chatflow list needs a valid API key; /ping does not.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://cloud.flowiseai.com/api/v1/chatflows", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { flowise: flowise.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.flowise ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Flowise",
        description:
          "Flowise Cloud: chatflows, agentflows, predictions, chat messages, document stores, tools, variables, assistants and feedback.",
        icons,
      },
    ),
  }),
);

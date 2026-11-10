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
import { agentOptions, options, platformOptions, workflowsOptions } from "./openapi.js";

const kapso = defineProvider({
  name: "Kapso",
  hosts: ["api.kapso.ai"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.kapso.ai/platform/v1/whatsapp/phone_numbers", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { kapso: kapso.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kapso ?? [],
        async (account) => {
          const mount = (opts: typeof options | typeof platformOptions) =>
            withApprovals(liveOpenapiRouter({ ...opts, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({
            whatsapp: mount(options),
            platform: mount(platformOptions),
            workflows: mount(workflowsOptions),
            agent: mount(agentOptions),
          });
        },
        { signal },
      ),
      {
        title: "Kapso",
        description:
          "Kapso WhatsApp platform: send messages, manage conversations, templates, flows, customers, setup links, webhooks, workflows and Kapso Agent.",
        icons,
      },
    ),
  }),
);

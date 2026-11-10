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

// The apps contract classifies every GET as a query, but these three GETs start work or return
// credentials: they run a function, trigger a structure run, and return a connection access token.
const sideEffectGets = [
  "functionExecute.createFunctionExecutionGet",
  "structures.invokeStructureWebhookGet",
  "connections.getToken",
];

const griptape = defineProvider({
  name: "Griptape",
  hosts: ["cloud.griptape.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://cloud.griptape.ai/api/models", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { griptape: griptape.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.griptape ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || sideEffectGets.some((gated) => name === gated || name.endsWith(`.${gated}`))
              ? always()
              : undefined,
          ),
        { signal },
      ),
      {
        title: "Griptape",
        description: "Build and run generative AI on Griptape Cloud: assistants, structures, threads, rulesets, knowledge bases, data connectors, tools, models and more.",
        icons,
      },
    ),
  }),
);

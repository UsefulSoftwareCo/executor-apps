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

const insightoai = defineProvider({
  name: "Insighto.ai",
  hosts: ["api.insighto.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.insighto.ai/api/v1/assistant");
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { insightoai: insightoai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.insightoai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Insighto.ai",
        description:
          "Insighto.ai conversational AI: assistants, conversations, contacts, widgets, forms, data sources, outbound calls and messaging.",
        icons,
      },
    ),
  }),
);

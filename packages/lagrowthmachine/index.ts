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

const lagrowthmachine = defineProvider({
  name: "La Growth Machine",
  hosts: ["apiv2.lagrowthmachine.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://apiv2.lagrowthmachine.com/flow/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ id: string(), email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { lagrowthmachine: lagrowthmachine.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lagrowthmachine ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "La Growth Machine",
        description:
          "Multichannel sales outreach with La Growth Machine: campaigns, audiences, leads, enrichment, LinkedIn and email inbox, conversations and webhooks.",
        icons,
      },
    ),
  }),
);

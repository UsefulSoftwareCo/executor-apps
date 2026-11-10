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

const valley = defineProvider({
  name: "Valley",
  hosts: ["api.joinvalley.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.joinvalley.co/public/v1/users/me", {
      signal,
      headers: { "x-api-key": account.fields.apiKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { valley: valley.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.valley ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Valley",
        description: "Run LinkedIn and email outreach with Valley: campaigns, prospects, inbox conversations, message approvals, warmlist, templates, writing styles, webhooks and analytics.",
        icons,
      },
    ),
  }),
);

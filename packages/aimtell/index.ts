import {
  accountRouter,
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

const aimtell = defineProvider({
  name: "AimTell",
  hosts: ["api.aimtell.com"],
  auth: {
    // Created in the Aimtell dashboard under API Keys.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.aimtell.com/prod/user/", {
      signal,
      headers: { "X-Authorization-Api-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Aimtell rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { aimtell: aimtell.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aimtell ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "AimTell",
        description:
          "Manage Aimtell web push notifications: websites, campaigns, segments, subscribers, opt-in prompts, pixels, analytics and logs.",
        icons,
      },
    ),
  }),
);

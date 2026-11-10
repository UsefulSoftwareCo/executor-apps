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

const Users = object({ currentUserId: string() });

const zernio = defineProvider({
  name: "Zernio",
  hosts: ["zernio.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://zernio.com/api/v1/users", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, Users);
    return { accountInfo: { externalId: me.currentUserId } };
  },
});

export default defineApp(
  { user: { accounts: { zernio: zernio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zernio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Zernio",
        description:
          "Schedule social posts, manage inbox conversations, pull analytics and run ads across 14+ platforms.",
        icons,
      },
    ),
  }),
);

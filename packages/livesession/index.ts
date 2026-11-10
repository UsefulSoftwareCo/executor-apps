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

const livesession = defineProvider({
  name: "LiveSession",
  hosts: ["api.livesession.io"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists one session; the token needs the users.sessions:read scope.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.livesession.io/v1/sessions?size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { livesession: livesession.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.livesession ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LiveSession",
        description: "Session replay and product analytics with LiveSession: sessions, alerts, webhooks and websites.",
        icons,
      },
    ),
  }),
);

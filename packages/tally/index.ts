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

const tally = defineProvider({
  name: "Tally",
  hosts: ["api.tally.so"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.tally.so/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { tally: tally.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tally ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // GET /users/me writes the stored timezone when `timezone` is passed, so it needs approval too.
            tool.kind === "mutation" || name.endsWith("users.getMe") ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tally",
        description: "Create and manage Tally forms, questions, submissions, workspaces, organization members, webhooks and form analytics.",
        icons,
      },
    ),
  }),
);

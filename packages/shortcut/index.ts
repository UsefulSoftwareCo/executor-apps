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

const shortcut = defineProvider({
  name: "Shortcut",
  hosts: ["api.app.shortcut.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.app.shortcut.com/api/v3/member", {
      signal,
      headers: { "Shortcut-Token": account.fields.token },
    });
    if (!response.ok) throw new Error(`Shortcut rejected the API token (${response.status})`);
    await decodeJson(response, object({ id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { shortcut: shortcut.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shortcut ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Shortcut",
        description: "Shortcut project management: stories, epics, iterations, objectives, labels, projects, docs, members and search.",
        icons,
      },
    ),
  }),
);

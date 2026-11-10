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

const guru = defineProvider({
  name: "Guru",
  hosts: ["api.getguru.com"],
  auth: {
    apiToken: secrets({
      label: "API token (username is your Guru email for a user token, or the collection ID for a collection token)",
      fields: object({ username: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.getguru.com/api/v1/whoami", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.token}`)}` },
    });
    if (!response.ok) throw new Error(`Guru rejected the credentials (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { guru: guru.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.guru ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Guru",
        description: "Search and manage Guru knowledge: cards, collections, boards, groups, members, teams and analytics.",
        icons,
      },
    ),
  }),
);

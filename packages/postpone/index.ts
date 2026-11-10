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
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.postpone.app/gql";

const postpone = defineProvider({
  name: "Postpone",
  hosts: ["api.postpone.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ profile { id username } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ profile: object({ id: string(), username: string() }) }) }),
    );
    return { accountInfo: { externalId: data.profile.id, displayName: data.profile.username } };
  },
});

export default defineApp(
  { user: { accounts: { postpone: postpone.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postpone ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.token}` },
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Postpone",
        description: "Schedule, publish and analyze social posts across Reddit, X, Instagram, Facebook, TikTok, YouTube, LinkedIn and more.",
        icons,
      },
    ),
  }),
);

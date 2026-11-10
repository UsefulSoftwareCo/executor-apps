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

const Me = object({ id: string(), name: string(), userPath: string() });

const hackmd = defineProvider({
  name: "HackMD",
  hosts: ["api.hackmd.io"],
  auth: {
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.hackmd.io/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, username: me.name, profileUrl: `https://hackmd.io/@${me.userPath}` } };
  },
});

export default defineApp(
  { user: { accounts: { hackmd: hackmd.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hackmd ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HackMD",
        description:
          "Notes, folders, teams, versions, comments, trash and webhooks in HackMD collaborative Markdown workspaces.",
        icons,
      },
    ),
  }),
);

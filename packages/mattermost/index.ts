import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Every Mattermost deployment has its own host (chat.example.com, or example.cloud.mattermost.com). Credentials only
// ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Mattermost server URL, for example chat.example.com.");
  }
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Mattermost server URL, with no path.");
  return url.origin;
}

const mattermost = defineProvider({
  name: "Mattermost",
  auth: {
    // A personal access token or bot account token. The server URL is part of the account, so the provider declares
    // no static `hosts`; the router below only sends the token to the account's own origin.
    apiKey: secrets({
      label: "Access token",
      fields: object({
        serverUrl: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.serverUrl);
    const response = await fetch(`${origin}/api/v4/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string(), username: string() }));
    return { accountInfo: { externalId: `${origin}:${me.id}`, displayName: `${me.username} @ ${new URL(origin).host}` } };
  },
});

export default defineApp(
  { user: { accounts: { mattermost: mattermost.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mattermost ?? [],
        (account) => {
          const origin = originOf(account.fields.serverUrl);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Mattermost",
        description:
          "Mattermost team messaging: users, teams, channels, posts, files, reactions, webhooks, bots, commands and server administration.",
        instructions:
          "Each account is one Mattermost server. Use the id `me` in place of a user id for the authenticated user. What a call may do depends on the permissions of the token's user or bot.",
        icons,
      },
    ),
  }),
);

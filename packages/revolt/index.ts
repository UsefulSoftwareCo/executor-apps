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

const revolt = defineProvider({
  name: "Revolt",
  hosts: ["api.stoat.chat"],
  auth: {
    botToken: secrets({
      label: "Bot token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    sessionToken: secrets({
      label: "User session token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const header = account.method === "botToken" ? "x-bot-token" : "x-session-token";
    const response = await fetch("https://api.stoat.chat/users/@me", {
      signal,
      headers: { [header]: account.fields.token },
    });
    await decodeJson(response, object({ _id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { revolt: revolt.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.revolt ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              // Bot tokens use a different header than session tokens.
              fetch:
                account.method === "botToken"
                  ? async (input, init) => {
                      const headers = new Headers(init?.headers);
                      const token = headers.get("x-session-token");
                      if (token !== null) {
                        headers.delete("x-session-token");
                        headers.set("x-bot-token", token);
                      }
                      return fetch(input, { ...init, headers });
                    }
                  : fetch,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Revolt (Stoat)",
        description:
          "Revolt (Stoat), formerly Revolt: open-source chat: servers, channels, messages, members, roles, emoji, bots, invites and relationships.",
        icons,
      },
    ),
  }),
);

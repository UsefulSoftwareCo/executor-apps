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
import { audienceOptions, insightOptions, liffOptions, messagingOptions } from "./openapi.js";

const BotInfo = object({ userId: string(), basicId: string(), displayName: string() });

const line = defineProvider({
  name: "LINE",
  hosts: ["api.line.me"],
  auth: {
    token: secrets({
      label: "Channel access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.line.me/v2/bot/info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const bot = await decodeJson(response, BotInfo);
    return { accountInfo: { externalId: bot.userId, username: bot.basicId, displayName: bot.displayName } };
  },
});

export default defineApp(
  { user: { accounts: { line: line.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.line ?? [],
        (account) => {
          const mount = (
            options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">,
          ) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              messaging: mount(messagingOptions),
              insight: mount(insightOptions),
              audience: mount(audienceOptions),
              liff: mount(liffOptions),
            },
            { title: "LINE", description: "LINE Official Account." },
          );
        },
        { signal },
      ),
      {
        title: "LINE",
        description:
          "LINE Official Account. messaging: push, reply, multicast and broadcast messages, rich menus, webhook, profiles, groups, coupons. insight: delivery, follower and demographic statistics. audience: audience groups for narrowcast. liff: LIFF apps.",
        icons,
      },
    ),
  }),
);

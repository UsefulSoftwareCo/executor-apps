import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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
import { siteUrl, zulipOptions } from "./openapi.js";

const Me = object({ user_id: number(), full_name: string() });

const zulip = defineProvider({
  name: "Zulip",
  hosts: ["*.zulipchat.com"],
  auth: {
    // Zulip authenticates with HTTP Basic: the account email (or bot email) and the API key.
    apiKey: secrets({
      label: "API key",
      fields: object({
        url: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${siteUrl(account.fields.url)}/api/v1/users/me`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(unescape(encodeURIComponent(`${account.fields.email}:${account.fields.apiKey}`)))}`,
        Accept: "application/json",
      },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: `${new URL(siteUrl(account.fields.url)).host}:${me.user_id}`,
        displayName: me.full_name,
        email: account.fields.email,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { zulip: zulip.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zulip ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...zulipOptions(account.fields.url), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Zulip",
        description:
          "Zulip messages, channels (streams), topics, users, user groups, reactions, drafts, scheduled messages, reminders and organization settings.",
        instructions:
          "Results depend on the permissions of the user or bot that owns the API key. Zulip calls channels 'streams' in the API.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const apiVersion = "2025-06-26";

const Me = object({ uuid: string(), handle: string(), displayName: string() });

const fanvue = defineProvider({
  name: "Fanvue",
  hosts: ["api.fanvue.com", "auth.fanvue.com"],
  auth: {
    // The OAuth app is created by the user in Fanvue's Developer Area. Every app is a confidential client.
    oauth: oauth2({
      discover: "https://auth.fanvue.com",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "offline_access",
        "read:self",
        "read:chat",
        "write:chat",
        "read:fan",
        "read:post",
        "write:post",
        "read:media",
        "write:media",
        "read:creator",
        "write:creator",
        "read:insights",
        "read:tracking_links",
        "write:tracking_links",
        "read:experience",
        "write:experience",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.fanvue.com/users/me", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        Accept: "application/json",
        "X-Fanvue-API-Version": apiVersion,
      },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: me.uuid,
        username: me.handle,
        displayName: me.displayName,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { fanvue: fanvue.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fanvue ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: {
                headers: { "X-Fanvue-API-Version": apiVersion },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Fanvue",
        description:
          "Fanvue creator platform: profile, chats and messages, posts, media vault, subscribers, insights, tracking links, webhooks and agency management.",
        icons,
      },
    ),
  }),
);

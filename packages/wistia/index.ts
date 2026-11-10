import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
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

const Account = object({ id: number(), name: string(), url: string() });

const wistia = defineProvider({
  name: "Wistia",
  hosts: ["api.wistia.com"],
  auth: {
    apiToken: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      discover: "https://api.wistia.com",
      scopes: ["all:all"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.wistia.com/modern/account", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: String(me.id), username: me.name, profileUrl: me.url } };
  },
});

export default defineApp(
  { user: { accounts: { wistia: wistia.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wistia ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Wistia",
        description:
          "Wistia video hosting: media, folders, channels, webinars, captions, tags, brands, stats and analytics.",
        icons,
      },
    ),
  }),
);

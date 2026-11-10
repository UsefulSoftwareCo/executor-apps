import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Only `user.id` is decoded; the vendor schema does not mark any other user field as required.
const Me = object({ user: object({ id: number() }) });

const clickup = defineProvider({
  name: "ClickUp",
  hosts: ["api.clickup.com"],
  auth: {
    token: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // ClickUp has no dynamic client registration or published metadata; its OAuth tokens do not expire.
    oauth: oauth2({
      authorizationUrl: "https://app.clickup.com/api",
      tokenUrl: "https://api.clickup.com/api/v2/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth" ? `Bearer ${account.fields.access_token}` : account.fields.token;
    const response = await fetch("https://api.clickup.com/api/v2/user", {
      signal,
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.user.id) } };
  },
});

export default defineApp(
  { user: { accounts: { clickup: clickup.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clickup ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ClickUp",
        description:
          "Tasks, lists, folders, spaces, comments, goals, time tracking, custom fields and the rest of the ClickUp API v2.",
        icons,
      },
    ),
  }),
);

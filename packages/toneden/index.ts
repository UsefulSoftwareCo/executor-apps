import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

const Me = object({ user: object({}) });

const toneden = defineProvider({
  name: "ToneDen",
  hosts: ["www.toneden.io"],
  auth: {
    token: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Create the OAuth app under Developer Settings; ToneDen reviews it before API use.
    oauth: oauth2({
      authorizationUrl: "https://www.toneden.io/auth/oauth2/authorize",
      tokenUrl: "https://www.toneden.io/auth/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://www.toneden.io/api/v1/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, Me);
    return { accountInfo: {} };
  },
});

export default defineApp(
  { user: { accounts: { toneden: toneden.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.toneden ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ToneDen",
        description:
          "Ad campaigns and insights, smart links, social unlocks, contests, playbook campaigns and user lists for music and event marketing.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Profile = object({ user_id: number(), email: string(), first_name: string(), last_name: string() });

const whoop = defineProvider({
  name: "WHOOP",
  hosts: ["api.prod.whoop.com"],
  auth: {
    // WHOOP has no API keys and no client registration: the connect page asks for a developer-app client.
    oauth: oauth2({
      authorizationUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
      tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline",
        "read:recovery",
        "read:cycles",
        "read:workout",
        "read:sleep",
        "read:profile",
        "read:body_measurement",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.prod.whoop.com/developer/v2/user/profile/basic", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Profile);
    return {
      accountInfo: {
        externalId: String(me.user_id),
        username: me.email,
        displayName: `${me.first_name} ${me.last_name}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { whoop: whoop.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.whoop ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WHOOP",
        description:
          "Recovery, sleep, physiological cycles, workouts, body measurements and profile from the WHOOP developer API.",
        icons,
      },
    ),
  }),
);

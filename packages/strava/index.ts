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

const Athlete = object({ id: number() });

const strava = defineProvider({
  name: "Strava",
  hosts: ["www.strava.com"],
  auth: {
    // The access token shown on https://www.strava.com/settings/api (expires after six hours).
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The user registers an API application at https://www.strava.com/settings/api.
    oauth: oauth2({
      authorizationUrl: "https://www.strava.com/oauth/authorize",
      tokenUrl: "https://www.strava.com/api/v3/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: [
        "read",
        "read_all",
        "profile:read_all",
        "profile:write",
        "activity:read_all",
        "activity:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://www.strava.com/api/v3/athlete", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Athlete);
    return {
      accountInfo: {
        externalId: String(me.id),
        profileUrl: `https://www.strava.com/athletes/${me.id}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { strava: strava.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.strava ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Strava",
        description:
          "Athlete profile and stats, activities, streams, clubs, gear, routes, segments and uploads from the Strava API v3.",
        icons,
      },
    ),
  }),
);

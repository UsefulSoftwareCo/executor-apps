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
import { sources } from "./openapi.js";

const Me = object({ id: string(), displayName: string() });

const webex = defineProvider({
  name: "Webex",
  hosts: ["webexapis.com"],
  auth: {
    token: secrets({
      label: "Personal access token or bot token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Webex has no client registration: the connect page asks for the client of an integration the user created.
    oauth: oauth2({
      authorizationUrl: "https://webexapis.com/v1/authorize",
      tokenUrl: "https://webexapis.com/v1/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "spark:kms",
        "spark:people_read",
        "spark:rooms_read",
        "spark:rooms_write",
        "spark:memberships_read",
        "spark:memberships_write",
        "spark:messages_read",
        "spark:messages_write",
        "spark:teams_read",
        "spark:teams_write",
        "spark:team_memberships_read",
        "spark:team_memberships_write",
        "meeting:schedules_read",
        "meeting:schedules_write",
        "meeting:participants_read",
        "meeting:recordings_read",
        "meeting:transcripts_read",
        "meeting:summaries_read",
        "meeting:preferences_read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://webexapis.com/v1/people/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, displayName: me.displayName } };
  },
});

export default defineApp(
  { user: { accounts: { webex: webex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webex ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(sources).map(([key, options]) => [
                key,
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "Webex",
        description:
          "Webex. messaging: spaces, messages, memberships, people, teams, webhooks. meetings: meetings, participants, recordings, transcripts, summaries, preferences. admin: organizations, licenses, groups, workspaces, recordings. devices: devices, workspaces, locations, xAPI. calling: Webex Calling users, locations and telephony settings.",
        icons,
      },
    ),
  }),
);

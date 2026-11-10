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
import { sources } from "./openapi.js";

const Me = object({ id: string(), email: string() });

const zoom = defineProvider({
  name: "Zoom",
  hosts: ["api.zoom.us", "zoom.us"],
  auth: {
    // Zoom has no client registration: the connect page asks for a user-managed OAuth app's client.
    // Scopes are fixed by the app's Scopes page, the host omits scope= from the
    // authorize URL when scopes is empty. No revocationUrl: Zoom documents revoke as POST ?token=,
    // while the host sends an RFC 7009 form body, which is unverified against Zoom.
    oauth: oauth2({
      authorizationUrl: "https://zoom.us/oauth/authorize",
      tokenUrl: "https://zoom.us/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.zoom.us/v2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, username: me.email } };
  },
});

export default defineApp(
  { user: { accounts: { zoom: zoom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zoom ?? [],
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
        title: "Zoom",
        description:
          "Zoom Meetings, Users, Phone, Team Chat, Rooms, Events, Contact Center, Calendar, Mail and the rest of the Zoom REST API.",
        icons,
      },
    ),
  }),
);

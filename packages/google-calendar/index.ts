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
import { addresses } from "./tools/shared.js";
import { calendar as calendarTools } from "./tools/calendar.js";
import { options } from "./openapi.js";

// The primary calendar's ID is the account's email address.
const Primary = object({ id: string() });

const googleCalendar = defineProvider({
  name: "Google Calendar",
  hosts: ["www.googleapis.com"],
  auth: {
    // Google offers no client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["https://www.googleapis.com/auth/calendar"],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary?fields=id",
      { signal, headers: { Authorization: `Bearer ${account.fields.access_token}` } },
    );
    const primary = await decodeJson(response, Primary);
    return { accountInfo: { externalId: primary.id, email: primary.id } };
  },
});

export default defineApp(
  { user: { accounts: { googleCalendar: googleCalendar.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const curated = calendarTools({ accounts: user?.accounts.googleCalendar ?? [], address: addresses.calendar, api: () => "api" });
    return {
      tools: router(
        {
          ...curated.tools,
          api: router(
            await accountRouter(
              user?.accounts.googleCalendar ?? [],
              (account) =>
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              { signal },
            ),
            {
              title: "Google Calendar API",
              description: "The complete Google Calendar API, per account: every tool takes accountId and the API's own input.",
            },
          ),
        },
        {
          instructions: curated.meta.instructions,
          title: "Google Calendar",
          description:
            "Calendars, events, attendees, free/busy availability, sharing and settings in Google Calendar.",
          icons,
        },
      ),
    };
  },
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.webinarjam.com/webinarjam";

const webinarjam = defineProvider({
  name: "WebinarJam",
  hosts: ["api.webinarjam.com"],
  auth: {
    apiKey: secrets({
      label: "API key (Webinars dashboard, Advanced, API custom integration)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing webinars is a read-only call that validates the account-wide key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/webinars`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_key: account.fields.token }),
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Params = Record<string, string | number | undefined>;

// WebinarJam takes every call as a POST with a form-encoded body that carries the API key.
async function call(fetcher: typeof fetch, signal: AbortSignal | undefined, token: string, path: string, params: Params) {
  const body = new URLSearchParams({ api_key: token });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body.set(key, String(value));
  }
  return fetcher(`${base}${path}`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
}

export default defineApp(
  { user: { accounts: { webinarjam: webinarjam.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webinarjam ?? [],
        (account) => {
          const post = async (path: string, params: Params) =>
            decodeJson(await call(fetch, signal, account.fields.token, path, params), json());
          return router({
            webinars: router({
              list: query(
                {
                  description:
                    "List every published webinar in the account with its id, hash, name, title, type, schedules and timezone.",
                  input: object({}),
                },
                async () => post("/webinars", {}),
              ),
              get: query(
                {
                  description:
                    "Details of one webinar: schedules (with the API schedule ids needed to register), presenters, registration URL, type and fee, and room URLs when enabled.",
                  input: object({ webinarId: number() }),
                },
                async (_ctx, { webinarId }) => post("/webinar", { webinar_id: webinarId }),
              ),
            }),
            registrants: router({
              list: query(
                {
                  description:
                    "List registrants and attendees of a webinar, paged. Filters: scheduleId; attendedLive and attendedReplay (0 all, 1 attended, 2 did not attend, 3 left before the timestamp, 4 left after it); purchased (0 all, 1 bought, 2 did not buy); dateRange (0 all time, 1 today, 2 yesterday, 3 this week, 4 last week, 5 last 7 days, 6 this month, 7 last month, 8 last 30 days); search; timestamps in seconds.",
                  input: object({
                    webinarId: number(),
                    scheduleId: number().optional(),
                    attendedLive: number().optional(),
                    attendedReplay: number().optional(),
                    attendedLiveTimestamp: number().optional(),
                    attendedReplayTimestamp: number().optional(),
                    purchased: number().optional(),
                    dateRange: number().optional(),
                    search: string().optional(),
                    page: number().optional(),
                  }),
                },
                async (_ctx, input) =>
                  post("/registrants", {
                    webinar_id: input.webinarId,
                    schedule_id: input.scheduleId,
                    attended_live: input.attendedLive,
                    attended_replay: input.attendedReplay,
                    attended_live_timestamp: input.attendedLiveTimestamp,
                    attended_replay_timestamp: input.attendedReplayTimestamp,
                    purchased: input.purchased,
                    date_range: input.dateRange,
                    search: input.search,
                    page: input.page,
                  }),
              ),
              register: mutation(
                {
                  description:
                    "Register a person for a webinar. scheduleId comes from webinars.get; for a series use the first schedule. lastName, phone and phoneCountryCode (with a leading +) are required only when the webinar's registration form asks for them; twilioConsent (1 or 0) is required when the phone field is enabled. timezoneId is mandatory for registrants in Texas (2 Mountain, 3 Central). Returns the attendee's unique live room, replay room and thank-you URLs.",
                  input: object({
                    webinarId: number(),
                    scheduleId: number(),
                    firstName: string({ minLength: 1 }),
                    email: string({ minLength: 1 }),
                    lastName: string().optional(),
                    country: string().optional(),
                    state: string().optional(),
                    timezoneId: number().optional(),
                    ipAddress: string().optional(),
                    phoneCountryCode: string().optional(),
                    phone: string().optional(),
                    twilioConsent: number().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) =>
                  post("/register", {
                    webinar_id: input.webinarId,
                    schedule: input.scheduleId,
                    first_name: input.firstName,
                    last_name: input.lastName,
                    email: input.email,
                    country: input.country,
                    state: input.state,
                    timezone_id: input.timezoneId,
                    ip_address: input.ipAddress,
                    phone_country_code: input.phoneCountryCode,
                    phone: input.phone,
                    twilio_consent: input.twilioConsent,
                  }),
              ),
              unsubscribe: mutation(
                {
                  description:
                    "Unsubscribe a lead from a webinar's notifications. leadId comes from registrants.list. Returns an empty object on success (HTTP 204).",
                  input: object({ webinarId: number(), leadId: number() }),
                  approval: always(),
                },
                async (_ctx, { webinarId, leadId }) => {
                  const response = await call(fetch, signal, account.fields.token, "/unsubscribe", {
                    webinar_id: webinarId,
                    lead_id: leadId,
                  });
                  if (response.status === 204) return {};
                  return decodeJson(response, json());
                },
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "WebinarJam",
        description:
          "WebinarJam live webinars: list webinars and their schedules, register attendees, list registrants and attendance, and unsubscribe leads.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.bart.gov/api";

const bart = defineProvider({
  name: "BART",
  hosts: ["api.bart.gov"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing stations is read-only and needs a valid registration key.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${base}/stn.aspx?cmd=stns&json=y&key=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const station = "Four-character station abbreviation such as EMBR, 12TH, MONT or SFIA (see stations).";
const dateNote = "date is mm/dd/yyyy, or today or now.";

const bartTools = (account: Account, signal: AbortSignal) => {
  const get = (fetch: typeof globalThis.fetch, endpoint: string, params: Record<string, string | number | undefined>) =>
    fetch(`${base}/${endpoint}.aspx?${search({ ...params, key: account.fields.token, json: "y" })}`, { signal }).then(
      async (response) => {
        const body = await decodeJson(response, json());
        // BART can report a bad station or date inside a 2xx body as root.message.error.
        const error = (body as { root?: { message?: { error?: unknown } } } | null)?.root?.message?.error;
        if (error !== undefined && error !== null && error !== "") {
          const detail = Array.isArray(error) ? error[0] : error;
          const { text, details } = (typeof detail === "object" && detail !== null ? detail : {}) as {
            text?: string;
            details?: string;
          };
          throw new Error(`BART API error: ${[text, details].filter(Boolean).join(": ") || JSON.stringify(error)}`);
        }
        return body;
      },
    );
  return router({
    stations: query(
      { description: "List every BART station with its abbreviation, name, coordinates and address.", input: object({}) },
      async ({ fetch }) => get(fetch, "stn", { cmd: "stns" }),
    ),
    stationInfo: query(
      {
        description: `Detailed information for one station: address, platforms, lines, and north and south routes and platforms. ${station}`,
        input: object({ orig: string() }),
      },
      async ({ fetch }, input) => get(fetch, "stn", { cmd: "stninfo", ...input }),
    ),
    stationAccess: query(
      {
        description: `Access and neighborhood information for a station: parking, bike, transit connections, and nearby attractions. ${station} Set legend to 1 to include the legend.`,
        input: object({ orig: string(), legend: number().optional() }),
      },
      async ({ fetch }, { legend, ...input }) => get(fetch, "stn", { cmd: "stnaccess", ...input, l: legend }),
    ),
    departures: query(
      {
        description: `Real-time estimated departures for a station. ${station} Use ALL for every station. Optionally limit by plat (platform 1-4) and dir (n for northbound, s for southbound).`,
        input: object({ orig: string(), plat: number().optional(), dir: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "etd", { cmd: "etd", ...input }),
    ),
    routes: query(
      {
        description: `List BART routes (lines) in effect, with number, color and abbreviation. ${dateNote} Optional; defaults to the current schedule.`,
        input: object({ date: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "route", { cmd: "routes", ...input }),
    ),
    routeInfo: query(
      {
        description: `Detailed information for a route including its station sequence. route is the route number (1-12) or all. ${dateNote}`,
        input: object({ route: string(), date: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "route", { cmd: "routeinfo", ...input }),
    ),
    planDeparture: query(
      {
        description: `Trip plan between two stations based on a departure time. ${station} time is h:mm am/pm or now (default now). ${dateNote} Dates range from 10 days in the past to 8 weeks ahead. before (0-3, default 2) and after (1-3, default 2) set how many trips around the time are returned. Set legend to 1 to include the legend.`,
        input: object({
          orig: string(),
          dest: string(),
          time: string().optional(),
          date: string().optional(),
          before: number().optional(),
          after: number().optional(),
          legend: number().optional(),
        }),
      },
      async ({ fetch }, { before, after, legend, ...input }) =>
        get(fetch, "sched", { cmd: "depart", ...input, b: before, a: after, l: legend }),
    ),
    planArrival: query(
      {
        description: `Trip plan between two stations based on an arrival time. ${station} time is h:mm am/pm or now (default now). ${dateNote} before (0-3, default 2) and after (1-3, default 2) set how many trips around the time are returned. Set legend to 1 to include the legend.`,
        input: object({
          orig: string(),
          dest: string(),
          time: string().optional(),
          date: string().optional(),
          before: number().optional(),
          after: number().optional(),
          legend: number().optional(),
        }),
      },
      async ({ fetch }, { before, after, legend, ...input }) =>
        get(fetch, "sched", { cmd: "arrive", ...input, b: before, a: after, l: legend }),
    ),
    fare: query(
      {
        description: `Fare between two stations, including clipper and cash fares. ${station} ${dateNote} sched optionally selects a specific schedule number.`,
        input: object({ orig: string(), dest: string(), date: string().optional(), sched: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "sched", { cmd: "fare", ...input }),
    ),
    routeSchedule: query(
      {
        description: `Full schedule for one route (1-12). date is mm/dd/yyyy, today, now, or a generic day type: wd (weekday), sa (Saturday) or su (Sunday). Set legend to 1 to include the legend.`,
        input: object({ route: string(), date: string().optional(), legend: number().optional() }),
      },
      async ({ fetch }, { legend, ...input }) => get(fetch, "sched", { cmd: "routesched", ...input, l: legend }),
    ),
    stationSchedule: query(
      {
        description: `Full daily schedule for one station. ${station} ${dateNote}`,
        input: object({ orig: string(), date: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "sched", { cmd: "stnsched", ...input }),
    ),
    schedules: query(
      { description: "List the BART schedules currently available, with their ids and effective dates.", input: object({}) },
      async ({ fetch }) => get(fetch, "sched", { cmd: "scheds" }),
    ),
    holidays: query(
      { description: "Upcoming BART holidays and the schedule type that runs on each.", input: object({}) },
      async ({ fetch }) => get(fetch, "sched", { cmd: "holiday" }),
    ),
    specialSchedules: query(
      { description: "Special schedule notices currently in effect.", input: object({}) },
      async ({ fetch }) => get(fetch, "sched", { cmd: "special" }),
    ),
    advisories: query(
      {
        description: "Current BART service advisories (delays and disruptions). Advisories are system-wide; orig is only accepted as all.",
        input: object({ orig: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "bsa", { cmd: "bsa", ...input }),
    ),
    elevatorStatus: query(
      { description: "Current elevator status and outages across BART stations.", input: object({}) },
      async ({ fetch }) => get(fetch, "bsa", { cmd: "elev" }),
    ),
    trainCount: query(
      { description: "Number of trains currently active in the system.", input: object({}) },
      async ({ fetch }) => get(fetch, "bsa", { cmd: "count" }),
    ),
    apiVersion: query(
      { description: "Current BART API version and copyright information.", input: object({}) },
      async ({ fetch }) => get(fetch, "version", {}),
    ),
  });
};

export default defineApp({ user: { accounts: { bart: bart.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.bart ?? [], (account) => bartTools(account, signal), { signal }), {
    title: "BART",
    description:
      "Bay Area Rapid Transit: real-time departures, trip planning, fares, schedules, stations, routes, service advisories and elevator status.",
    icons,
  }),
}));

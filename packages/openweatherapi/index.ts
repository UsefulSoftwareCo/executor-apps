import { accountRouter, decodeJson, defineApp, defineProvider, json, number, object, query, router, secrets, string } from "apps";
import { icons } from "./icon.js";

const base = "https://api.openweathermap.org";

const openweather = defineProvider({
  name: "OpenWeather",
  hosts: ["api.openweathermap.org"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Cheap geocoding lookup; checks only that the key is accepted (2xx).
    const url = new URL(`${base}/geo/1.0/direct`);
    url.searchParams.set("q", "London");
    url.searchParams.set("limit", "1");
    url.searchParams.set("appid", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// OpenWeather authenticates with an `appid` query parameter. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    url.searchParams.set("appid", token);
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const req = () => string({ minLength: 1 });
const units = optStr(); // standard | metric | imperial
const lang = optStr();

const point = { lat: number(), lon: number() };

function build(call: ReturnType<typeof client>) {
  const weather = router(
    {
      current: query(
        {
          description:
            "Current weather. Preferred: lat and lon (get them from the geocoding tools). Deprecated by OpenWeather and no longer fixed, but still working: exactly one of q (city name, 'city,state,country'), id (city id) or zip ('zip,country'). units is standard, metric or imperial.",
          input: object({ q: optStr(), id: optStr(), zip: optStr(), lat: optNum(), lon: optNum(), units, lang }),
        },
        (_c, p) => call("/data/2.5/weather", p),
      ),
      forecast5Day: query(
        {
          description:
            "5 day forecast in 3-hour steps. Preferred: lat and lon (get them from the geocoding tools). Deprecated by OpenWeather and no longer fixed: q, id or zip. cnt limits the number of timestamps.",
          input: object({ q: optStr(), id: optStr(), zip: optStr(), lat: optNum(), lon: optNum(), cnt: optNum(), units, lang }),
        },
        (_c, p) => call("/data/2.5/forecast", p),
      ),
      forecast16Day: query(
        {
          description: "Daily forecast for up to 16 days (cnt, 1-16). Not in the free plan; needs the Startup plan or above (or the student plan). Preferred: lat and lon. Deprecated by OpenWeather and no longer fixed: q, id or zip.",
          input: object({ q: optStr(), id: optStr(), zip: optStr(), lat: optNum(), lon: optNum(), cnt: optNum(), units, lang }),
        },
        (_c, p) => call("/data/2.5/forecast/daily", p),
      ),
      group: query(
        {
          description: "Current weather for several cities at once. id is a comma-separated list of city ids (up to 20). units is standard, metric or imperial. City id lookup is deprecated by OpenWeather but still works.",
          input: object({ id: req(), units, lang }),
        },
        (_c, p) => call("/data/2.5/group", p),
      ),
      findNearby: query(
        {
          description: "Current weather for cities around lat and lon (cnt, up to 50 cities).",
          input: object({ ...point, cnt: optNum(), units, lang }),
        },
        (_c, p) => call("/data/2.5/find", p),
      ),
    },
    { title: "Weather", description: "Current conditions and forecasts by coordinates (preferred) or deprecated city name, id and zip." },
  );

  const oneCall = router(
    {
      get: query(
        {
          description:
            "One Call 3.0: current, minute (1h), hourly (48h), daily (8d) and alerts for coordinates. exclude is a comma-separated list of current,minutely,hourly,daily,alerts. Requires the One Call by Call subscription.",
          input: object({ ...point, exclude: optStr(), units, lang }),
        },
        (_c, p) => call("/data/3.0/onecall", p),
      ),
      timestamp: query(
        {
          description: "One Call 3.0 weather for a Unix timestamp dt (UTC), historical back to 1979 or forecast up to 4 days ahead.",
          input: object({ ...point, dt: number(), units, lang }),
        },
        (_c, p) => call("/data/3.0/onecall/timemachine", p),
      ),
      daySummary: query(
        {
          description: "One Call 3.0 aggregated weather for a date (YYYY-MM-DD). tz is an optional UTC offset like +03:00.",
          input: object({ ...point, date: req(), tz: optStr(), units, lang }),
        },
        (_c, p) => call("/data/3.0/onecall/day_summary", p),
      ),
      overview: query(
        {
          description: "One Call 3.0 human-readable weather summary for today or tomorrow (date: YYYY-MM-DD).",
          input: object({ ...point, date: optStr(), units }),
        },
        (_c, p) => call("/data/3.0/onecall/overview", p),
      ),
    },
    { title: "One Call 3.0", description: "Aggregated current, forecast, historical and summary weather for coordinates." },
  );

  const airPollution = router(
    {
      current: query(
        { description: "Current air quality index and pollutant concentrations for coordinates.", input: object(point) },
        (_c, p) => call("/data/2.5/air_pollution", p),
      ),
      forecast: query(
        { description: "Hourly air pollution forecast for coordinates.", input: object(point) },
        (_c, p) => call("/data/2.5/air_pollution/forecast", p),
      ),
      history: query(
        { description: "Historical air pollution for coordinates between start and end (Unix timestamps, UTC), from 27 Nov 2020.", input: object({ ...point, start: number(), end: number() }) },
        (_c, p) => call("/data/2.5/air_pollution/history", p),
      ),
    },
    { title: "Air pollution", description: "Air quality index and pollutant concentrations." },
  );

  const geocoding = router(
    {
      direct: query(
        { description: "Find coordinates for a place name ('city,state,country').", input: object({ q: req(), limit: optNum() }) },
        (_c, p) => call("/geo/1.0/direct", p),
      ),
      zip: query(
        { description: "Find coordinates for a zip or postal code ('zip,country').", input: object({ zip: req() }) },
        (_c, p) => call("/geo/1.0/zip", p),
      ),
      reverse: query(
        { description: "Find place names for coordinates.", input: object({ ...point, limit: optNum() }) },
        (_c, p) => call("/geo/1.0/reverse", p),
      ),
    },
    { title: "Geocoding", description: "Convert place names and zip codes to coordinates and back." },
  );

  return router({ weather, oneCall, airPollution, geocoding });
}

export default defineApp({ user: { accounts: { openweather: openweather.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.openweather ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
    {
      title: "OpenWeather",
      description: "Current weather, forecasts, One Call 3.0, air pollution and geocoding from OpenWeather.",
      icons,
    },
  ),
}));

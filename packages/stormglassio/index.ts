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

const base = "https://api.stormglass.io/v2";

const stormglass = defineProvider({
  name: "Stormglass",
  hosts: ["api.stormglass.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The tide station list is the one request that needs no coordinates or parameters.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/tide/stations`, {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Stormglass takes the raw API key in the Authorization header. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { headers: { Authorization: token }, signal });
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();

const point = { lat: number(), lng: number() };
const range = { start: optStr(), end: optStr() };
const series = { ...point, params: string({ minLength: 1 }), ...range, source: optStr() };

function build(call: ReturnType<typeof client>) {
  return router({
    weather: query(
      {
        description:
          "Weather forecast for a coordinate (marine data when the point is at sea). params is a comma-separated list such as swellHeight,waveHeight,windSpeed,airTemperature. start and end are UNIX or ISO UTC timestamps; source is a comma-separated list such as sg,noaa.",
        input: object(series),
      },
      (_c, p) => call("/weather/point", p),
    ),
    historical: query(
      {
        description:
          "Historical weather since 2014 for a coordinate. Needs start or end (at most 240 hours per request). params is a comma-separated list such as airTemperature,waveHeight; source defaults to sg.",
        input: object({ ...series, start: optStr(), end: optStr() }),
      },
      (_c, p) => call("/historical/point", p),
    ),
    bio: query(
      {
        description:
          "Bio data for a coordinate: ocean chlorophyll, nitrate, oxygen, ph, salinity and land soilMoisture and soilTemperature. params is a comma-separated list.",
        input: object(series),
      },
      (_c, p) => call("/bio/point", p),
    ),
    solar: query(
      {
        description:
          "Solar data for a coordinate. params is a comma-separated list such as uvIndex,solarDownwardRadiationFlux,surfaceNetShortwaveRadiationDownwardsFlux.",
        input: object(series),
      },
      (_c, p) => call("/solar/point", p),
    ),
    astronomy: query(
      {
        description: "Sunrise, sunset, dawn, dusk, moonrise, moonset and moon phase per day for a coordinate (up to 10 days).",
        input: object({ ...point, ...range }),
      },
      (_c, p) => call("/astronomy/point", p),
    ),
    elevation: query(
      { description: "Elevation in meters relative to sea level (bathymetry at sea, topography on land) for a coordinate.", input: object(point) },
      (_c, p) => call("/elevation/point", p),
    ),
    tide: router(
      {
        extremes: query(
          {
            description:
              "High and low tide times and heights for the nearest station. datum is one of LAT, MLLW, MLW, MSL, MHW, MHHW or HAT (default MSL).",
            input: object({ ...point, ...range, datum: optStr() }),
          },
          (_c, p) => call("/tide/extremes/point", p),
        ),
        seaLevel: query(
          {
            description: "Hourly sea level in meters for the nearest station. datum is one of LAT, MLLW, MLW, MSL, MHW, MHHW or HAT (default MSL).",
            input: object({ ...point, ...range, datum: optStr() }),
          },
          (_c, p) => call("/tide/sea-level/point", p),
        ),
        stations: query(
          { description: "List every available tide station with name, coordinates and source.", input: object({}) },
          () => call("/tide/stations"),
        ),
        stationsInArea: query(
          {
            description: "List tide stations within a bounding box. box is 'lat,lng:lat,lng' (top right then bottom left), for example 60.1,2:0,-16.",
            input: object({ box: string({ minLength: 1 }) }),
          },
          (_c, p) => call("/tide/stations/area", p),
        ),
      },
      { title: "Tide", description: "Tide extremes, hourly sea level and tide stations." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { stormglass: stormglass.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.stormglass ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Stormglass",
        description: "Global weather and marine data: forecasts, historical weather, bio, tides, astronomy, solar and elevation.",
        icons,
        instructions:
          "Every tool takes lat and lng. Forecast, historical, bio and solar calls also need params, a comma-separated list of variable names. Each request spends daily quota; the response meta shows cost and requestCount.",
      },
    ),
  }),
);

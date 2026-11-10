import {
  accountRouter,
  boolean,
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

const base = "https://api.ambeedata.com";

const ambee = defineProvider({
  name: "Ambee",
  hosts: ["api.ambeedata.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Ambee has no account endpoint, so check the key against a documented read: v3 air quality latest.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v3/aq/latest?lat=0&lng=0`, {
      headers: { "x-api-key": account.fields.token },
      signal,
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

// Every Ambee endpoint is a GET with the key in the x-api-key header.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { headers: { "x-api-key": token }, signal });
    return decodeJson(response, json());
  };
}

// Ambee wants "YYYY-MM-DD hh:mm:ss" (UTC); accept ISO 8601 too.
function timestamp(value: string): string {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid timestamp "${value}". Use "YYYY-MM-DD hh:mm:ss" or ISO 8601.`);
  return parsed.toISOString().replace("T", " ").slice(0, 19);
}

const coords = { lat: number(), lng: number() };
const range = { from: string({ minLength: 1 }), to: string({ minLength: 1 }) };
const units = string().optional();
const locale = boolean().optional();
const aqExtras = { aqiStandard: string().optional(), locale };
const where = { lat: number().optional(), lng: number().optional(), place: string().optional() };
const pollenWhere = { lat: number().optional(), lng: number().optional(), place: string().optional() };
const paging = { eventType: string().optional(), limit: number().optional(), page: number().optional() };
const continent = string({ minLength: 1 });

function build(call: ReturnType<typeof client>) {
  const get = <S extends Record<string, any>>(
    description: string,
    shape: S,
    path: string | ((input: any) => string),
    map: (input: any) => Params = (input) => input,
  ) =>
    query({ description, input: object(shape as never) }, async (_ctx, input: any) =>
      call(typeof path === "string" ? path : path(input), map(input)),
    );
  const withRange = (input: any): Params => ({ ...input, from: timestamp(input.from), to: timestamp(input.to) });
  const located = (input: any): Params => {
    if (input.place === undefined && (input.lat === undefined || input.lng === undefined)) {
      throw new Error("Provide either place, or both lat and lng.");
    }
    const { hours: _hours, ...rest } = input;
    return rest;
  };
  const pollen = located;
  const locatedRange = (input: any): Params => ({ ...located(input), from: timestamp(input.from), to: timestamp(input.to) });

  return router({
    airQuality: router(
      {
        latest: get(
          "Latest air quality (AQI and pollutant concentrations). Pass place, or lat and lng. aqiStandard is EPA (default), IN, UK, CN or CA.",
          { ...where, ...aqExtras },
          "v3/aq/latest",
          located,
        ),
        history: get(
          "Hourly historical air quality (48-hour window). Pass place, or lat and lng. from/to are ISO 8601 or YYYY-MM-DD hh:mm:ss (UTC).",
          { ...where, ...range, ...aqExtras },
          "v3/aq/history",
          locatedRange,
        ),
        forecast: get(
          "Hourly air quality forecast for the next 48 hours. Pass place, or lat and lng.",
          { ...where, ...aqExtras },
          "v3/aq/forecast/48hrs",
          located,
        ),
      },
      { title: "Air quality", description: "AQI and pollutant concentrations: latest, history and forecast." },
    ),
    pollen: router(
      {
        latest: get(
          "Latest pollen counts and risk levels. Pass place, or lat and lng. Set speciesRisk to include per-species risk.",
          { ...pollenWhere, speciesRisk: boolean().optional() },
          "v3/pollen/latest",
          pollen,
        ),
        history: get(
          "Historical pollen counts. Pass place, or lat and lng. from/to are ISO 8601 or YYYY-MM-DD hh:mm:ss (UTC).",
          { ...pollenWhere, ...range, speciesRisk: boolean().optional() },
          "v3/pollen/history",
          (input) => ({ ...pollen(input), from: timestamp(input.from), to: timestamp(input.to) }),
        ),
        forecast: get(
          "Pollen forecast: 48 hours hourly (default) or 120 hours every 3 hours (hours: 120). Pass place, or lat and lng.",
          { ...pollenWhere, hours: number().optional(), speciesRisk: boolean().optional() },
          (input) => `v3/pollen/forecast/${input.hours === 120 ? 120 : 48}hrs`,
          pollen,
        ),
      },
      { title: "Pollen", description: "Tree, grass and weed pollen counts and risk." },
    ),
    weather: router(
      {
        latest: get(
          "Latest weather. Pass place, or lat and lng. Set units to \"si\" for SI units.",
          { ...where, units, locale },
          "v3/weather/latest",
          located,
        ),
        history: get(
          "Historical weather (48-hour window, hourly). Pass place, or lat and lng. from/to are ISO 8601 or YYYY-MM-DD hh:mm:ss (UTC).",
          { ...where, ...range, units, locale },
          "v3/weather/history",
          locatedRange,
        ),
        forecast: get(
          "Weather forecast: 48 hours hourly (default) or 120 hours every 3 hours (hours: 120). Pass place, or lat and lng.",
          { ...where, hours: number().optional(), units, locale },
          (input) => `v3/weather/forecast/${input.hours === 120 ? 120 : 48}hrs`,
          located,
        ),
      },
      { title: "Weather", description: "Hyperlocal weather: latest, history and forecast." },
    ),
    fire: router(
      {
        riskByLatLng: get("Fire risk (fire weather index) for a coordinate.", coords, "fire/risk/by-lat-lng"),
        riskByPlace: get("Fire risk (fire weather index) for a named place.", { place: string({ minLength: 1 }) }, "fire/risk/by-place"),
      },
      { title: "Fire", description: "Fire risk. Real-time wildfire events are in the disasters tools (eventType WF)." },
    ),
    disasters: router(
      {
        latestByLatLng: get(
          "Latest natural disasters (last month) near a coordinate. eventType: TN, EQ, TC, WF, FL, ET, DR, SW, SI, VO, LS or Misc. limit defaults to 1.",
          { ...coords, ...paging },
          "disasters/processed/latest/by-lat-lng",
        ),
        latestByCountryCode: get(
          "Latest natural disasters in a country (3-letter ISO code, e.g. USA). eventType as for latestByLatLng.",
          { countryCode: string({ minLength: 1 }), ...paging },
          "disasters/processed/latest/by-country-code",
        ),
        latestByContinent: get(
          "Latest natural disasters on a continent (AFR, ANT, ASIA, AUS, EUR, NAR, SAR or Ocean). eventType as for latestByLatLng.",
          { continent, ...paging },
          "disasters/processed/latest/by-continent",
        ),
        eventPolygon: get("Polygon footprint for one disaster event, by eventId.", { eventId: string({ minLength: 1 }) }, "disasters/processed/polygon"),
      },
      { title: "Natural disasters", description: "Latest natural disaster events." },
    ),
    ili: router(
      {
        forecastByLatLng: get("Influenza-like illness forecast for a coordinate.", coords, "ili/forecast/by-lat-lng"),
      },
      { title: "Influenza-like illness", description: "ILI forecasts." },
    ),
    geocode: router(
      {
        byPlace: get("Geocode a place name to coordinates.", { place: string({ minLength: 1 }) }, "geocode/by-place"),
        reverse: get("Reverse geocode a coordinate to a place.", coords, "geocode/reverse/by-lat-lng"),
      },
      { title: "Geocoding", description: "Forward and reverse geocoding." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { ambee: ambee.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.ambee ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Ambee",
        description:
          "Hyperlocal environmental data: air quality, pollen, weather, wildfires and fire risk, natural disasters, influenza-like illness forecasts and geocoding.",
        icons,
      },
    ),
  }),
);

import { accountRouter, decodeJson, defineApp, defineProvider, json, literal, number, object, query, router, secrets, string } from "apps";
import { icons } from "./icon.js";

const base = "https://api.airvisual.com/v2";

const iqair = defineProvider({
  name: "IQAir AirVisual",
  hosts: ["api.airvisual.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/countries`);
    url.searchParams.set("key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    // AirVisual reports failures in the body (incorrect_api_key, api_key_expired, call_limit_reached ...), often with HTTP 200.
    await decodeJson(response, object({ status: literal("success") }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// AirVisual authenticates with a `key` query parameter. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    url.searchParams.set("key", token);
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

const req = () => string({ minLength: 1 });
const place = { city: req(), state: req(), country: req() };
const coords = { lat: number(), lon: number() };

function build(call: ReturnType<typeof client>) {
  const locations = router(
    {
      countries: query(
        { description: "List supported countries (those with active stations). Each entry's English name is used by the other tools.", input: object({}) },
        () => call("/countries"),
      ),
      states: query(
        { description: "List supported states in a country (English name from the countries tool).", input: object({ country: req() }) },
        (_c, p) => call("/states", p),
      ),
      cities: query(
        { description: "List supported cities in a state of a country.", input: object({ state: req(), country: req() }) },
        (_c, p) => call("/cities", p),
      ),
      stations: query(
        { description: "List active stations in a city.", input: object(place) },
        (_c, p) => call("/stations", p),
      ),
    },
    { title: "Locations", description: "Browse the countries, states, cities and stations AirVisual supports." },
  );

  const cities = router(
    {
      get: query(
        { description: "Air quality and weather for a specific city. Detail returned depends on the API plan.", input: object(place) },
        (_c, p) => call("/city", p),
      ),
      nearestByIp: query(
        { description: "Air quality and weather for the nearest city to the caller's IP address.", input: object({}) },
        () => call("/nearest_city"),
      ),
      nearestByCoordinates: query(
        { description: "Air quality and weather for the nearest city to lat (-90..90) and lon (-180..180).", input: object(coords) },
        (_c, p) => call("/nearest_city", p),
      ),
      ranking: query(
        { description: "Global city ranking by air quality. Optionally narrow with country and sort (plan dependent).", input: object({ country: string().optional(), sort: string().optional() }) },
        (_c, p) => call("/city_ranking", p),
      ),
    },
    { title: "Cities", description: "City-level air quality and weather." },
  );

  const stations = router(
    {
      get: query(
        { description: "Air quality and weather for a specific station in a city.", input: object({ station: req(), ...place }) },
        (_c, p) => call("/station", p),
      ),
      nearestByIp: query(
        { description: "Data for the nearest station to the caller's IP address.", input: object({}) },
        () => call("/nearest_station"),
      ),
      nearestByCoordinates: query(
        { description: "Data for the nearest station to lat (-90..90) and lon (-180..180).", input: object(coords) },
        (_c, p) => call("/nearest_station", p),
      ),
    },
    { title: "Stations", description: "Station-level air quality and weather." },
  );

  return router({ locations, cities, stations });
}

export default defineApp({ user: { accounts: { iqair: iqair.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.iqair ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
    {
      title: "IQAir AirVisual",
      description: "Real-time air quality index, pollutants and weather for cities and stations worldwide, plus global city rankings.",
      icons,
    },
  ),
}));

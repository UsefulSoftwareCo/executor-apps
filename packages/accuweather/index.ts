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

const base = "https://dataservice.accuweather.com";

const accuweather = defineProvider({
  name: "AccuWeather",
  hosts: ["dataservice.accuweather.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Checks only that the key is accepted (2xx); the regions payload is not decoded.
    const response = await fetch(`${base}/locations/v1/regions`, {
      headers: { Authorization: `Bearer ${account.fields.token}` },
      signal,
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// AccuWeather authenticates with an Authorization: Bearer header. Every call here is a read.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal });
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const key = () => string({ minLength: 1 });
const seg = encodeURIComponent;

const common = {
  language: optStr(),
  details: optBool(),
  metric: optBool(),
};

function build(call: ReturnType<typeof client>) {
  const locationTools = router(
    {
      autocomplete: query(
        { description: "Autocomplete city names from a partial query. Returns location keys.", input: object({ q: key(), language: optStr(), countryCode: optStr() }) },
        (_c, { q, language, countryCode }) => call("/locations/v1/cities/autocomplete", { q, language, countryCode }),
      ),
      searchCities: query(
        { description: "Search cities by name.", input: object({ q: key(), language: optStr(), details: optBool(), offset: optNum(), alias: optStr() }) },
        (_c, p) => call("/locations/v1/cities/search", p),
      ),
      searchCitiesInCountry: query(
        { description: "Search cities by name within a country (ISO 3166 code).", input: object({ countryCode: key(), q: key(), language: optStr(), details: optBool(), offset: optNum() }) },
        (_c, { countryCode, ...p }) => call(`/locations/v1/cities/${seg(countryCode)}/search`, p),
      ),
      search: query(
        { description: "Text search across cities, postal codes and points of interest.", input: object({ q: key(), language: optStr(), details: optBool(), offset: optNum() }) },
        (_c, p) => call("/locations/v1/search", p),
      ),
      byGeoposition: query(
        { description: "Find the location for a latitude and longitude. q is 'lat,lon'.", input: object({ q: key(), language: optStr(), details: optBool(), toplevel: optBool() }) },
        (_c, p) => call("/locations/v1/cities/geoposition/search", p),
      ),
      byPostalCode: query(
        { description: "Search locations by postal code.", input: object({ q: key(), language: optStr(), details: optBool(), offset: optNum() }) },
        (_c, p) => call("/locations/v1/postalcodes/search", p),
      ),
      byPostalCodeInCountry: query(
        { description: "Search locations by postal code within a country.", input: object({ countryCode: key(), q: key(), language: optStr(), details: optBool() }) },
        (_c, { countryCode, ...p }) => call(`/locations/v1/postalcodes/${seg(countryCode)}/search`, p),
      ),
      byIpAddress: query(
        { description: "Find the location for an IP address.", input: object({ q: key(), language: optStr(), details: optBool() }) },
        (_c, p) => call("/locations/v1/cities/ipaddress", p),
      ),
      get: query(
        { description: "Get a location by its location key.", input: object({ locationKey: key(), language: optStr(), details: optBool() }) },
        (_c, { locationKey, ...p }) => call(`/locations/v1/${seg(locationKey)}`, p),
      ),
      topCities: query(
        { description: "Top cities worldwide. group is 50, 100 or 150.", input: object({ group: key(), language: optStr(), details: optBool() }) },
        (_c, { group, ...p }) => call(`/locations/v1/topcities/${seg(group)}`, p),
      ),
      regions: query({ description: "List world regions.", input: object({ language: optStr() }) }, (_c, p) => call("/locations/v1/regions", p)),
      countries: query(
        { description: "List countries, optionally within a region code (such as EUR).", input: object({ regionCode: optStr(), language: optStr() }) },
        (_c, { regionCode, ...p }) => call(regionCode === undefined ? "/locations/v1/countries" : `/locations/v1/countries/${seg(regionCode)}`, p),
      ),
      adminAreas: query(
        { description: "List administrative areas (states, provinces) of a country.", input: object({ countryCode: key(), language: optStr() }) },
        (_c, { countryCode, ...p }) => call(`/locations/v1/adminareas/${seg(countryCode)}`, p),
      ),
    },
    { title: "Locations", description: "Find location keys by name, postal code, coordinates or IP address." },
  );

  const current = router(
    {
      get: query(
        { description: "Current conditions for a location key.", input: object({ locationKey: key(), ...common }) },
        (_c, { locationKey, ...p }) => call(`/currentconditions/v1/${seg(locationKey)}`, p),
      ),
      past6Hours: query(
        { description: "Conditions observed over the past 6 hours.", input: object({ locationKey: key(), ...common }) },
        (_c, { locationKey, ...p }) => call(`/currentconditions/v1/${seg(locationKey)}/historical`, p),
      ),
      past24Hours: query(
        { description: "Conditions observed over the past 24 hours.", input: object({ locationKey: key(), ...common }) },
        (_c, { locationKey, ...p }) => call(`/currentconditions/v1/${seg(locationKey)}/historical/24`, p),
      ),
      topCities: query(
        { description: "Current conditions for the top cities. group is 50, 100 or 150.", input: object({ group: key(), ...common }) },
        (_c, { group, ...p }) => call(`/currentconditions/v1/topcities/${seg(group)}`, p),
      ),
    },
    { title: "Current conditions", description: "Observations for a location." },
  );

  const forecasts = router(
    {
      daily: query(
        {
          description: "Daily forecast for a location key. days is 1, 5, 10 or 15 (availability depends on plan).",
          input: object({ locationKey: key(), days: key(), ...common }),
        },
        (_c, { locationKey, days, ...p }) => call(`/forecasts/v1/daily/${seg(days)}day/${seg(locationKey)}`, p),
      ),
      hourly: query(
        {
          description: "Hourly forecast for a location key. hours is 1, 12, 24, 72 or 120 (availability depends on plan).",
          input: object({ locationKey: key(), hours: key(), ...common }),
        },
        (_c, { locationKey, hours, ...p }) => call(`/forecasts/v1/hourly/${seg(hours)}hour/${seg(locationKey)}`, p),
      ),
      minuteCast: query(
        { description: "MinuteCast minute-by-minute precipitation forecast for the next 120 minutes. q is 'lat,lon'.", input: object({ q: key(), language: optStr(), basic: optBool() }) },
        (_c, p) => call("/forecasts/v1/minute", p),
      ),
    },
    { title: "Forecasts", description: "Daily, hourly and MinuteCast forecasts." },
  );

  const indices = router(
    {
      list: query({ description: "List available index types (such as running, golf, flu) with their ids.", input: object({ language: optStr() }) }, (_c, p) => call("/indices/v1/daily", p)),
      daily: query(
        { description: "Daily lifestyle indices for a location key. days is 1, 5, 10 or 15. Optionally restrict to one indexId.", input: object({ locationKey: key(), days: key(), indexId: optStr(), language: optStr(), details: optBool() }) },
        (_c, { locationKey, days, indexId, ...p }) =>
          call(`/indices/v1/daily/${seg(days)}day/${seg(locationKey)}${indexId === undefined ? "" : `/${seg(indexId)}`}`, p),
      ),
    },
    { title: "Indices", description: "Lifestyle and health indices such as running, flu and mosquito activity." },
  );

  const tropical = router(
    {
      storms: query(
        { description: "Tropical storms for a year and basin (AL, CP, EP, NI, NP, SI, SP). Requires a plan that includes Tropical (Prime or higher).", input: object({ year: key(), basinId: key(), language: optStr(), details: optBool() }) },
        (_c, { year, basinId, ...p }) => call(`/tropical/v1/gov/storms/${seg(year)}/${seg(basinId)}`, p),
      ),
      activeStorms: query(
        { description: "Currently active tropical storms. Requires a plan that includes Tropical (Prime or higher).", input: object({ language: optStr(), details: optBool() }) },
        (_c, p) => call("/tropical/v1/gov/storms/active", p),
      ),
      stormForecast: query(
        { description: "Forecast track for a storm. Requires a plan that includes Tropical (Prime or higher).", input: object({ year: key(), basinId: key(), govId: key(), language: optStr(), details: optBool() }) },
        (_c, { year, basinId, govId, ...p }) => call(`/tropical/v1/gov/storms/${seg(year)}/${seg(basinId)}/${seg(govId)}/forecasts`, p),
      ),
    },
    { title: "Tropical storms", description: "Active and historical tropical storms and tracks." },
  );

  return router({
    locations: locationTools,
    currentConditions: current,
    forecasts,
    alerts: query(
      { description: "Weather alerts for a location key.", input: object({ locationKey: key(), language: optStr(), details: optBool() }) },
      (_c, { locationKey, ...p }) => call(`/alerts/v1/${seg(locationKey)}`, p),
    ),
    indices,
    tropical,
  });
}

export default defineApp(
  { user: { accounts: { accuweather: accuweather.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.accuweather ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "AccuWeather",
        description:
          "Global weather data: location search, current conditions, daily and hourly forecasts, MinuteCast, alerts, lifestyle indices and tropical storms.",
        icons,
        instructions:
          "Most tools take a locationKey. Get one from locations.autocomplete, locations.search or locations.byGeoposition. Pass metric: true for metric units and details: true for full fields.",
      },
    ),
  }),
);

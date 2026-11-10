import {
  accountRouter,
  array,
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

const base = "https://rt.ambientweather.net/v1";

const ambientweather = defineProvider({
  name: "Ambient Weather",
  hosts: ["rt.ambientweather.net"],
  auth: {
    apiKey: secrets({
      label: "API key and application key",
      fields: object({
        apiKey: string({ minLength: 1 }),
        applicationKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/devices`);
    url.searchParams.set("apiKey", account.fields.apiKey);
    url.searchParams.set("applicationKey", account.fields.applicationKey);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, array(object({ macAddress: string() })));
  },
});

type Fetch = typeof fetch;

// Both keys travel as query parameters. Every call here is a read.
function client(keys: { apiKey: string; applicationKey: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Record<string, string | number | undefined> = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    url.searchParams.set("apiKey", keys.apiKey);
    url.searchParams.set("applicationKey", keys.applicationKey);
    const response = await fetcher(url.toString(), { signal });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    listDevices: query(
      {
        description:
          "List the user's weather stations with name, location, MAC address and each station's most recent readings (lastData: temperature, humidity, wind, rain, pressure, UV, solar, air quality and more, depending on the sensors).",
        input: object({}),
      },
      async () => call("/devices"),
    ),
    getDeviceData: query(
      {
        description:
          "Historical readings for one station, newest first, in 5 or 30 minute steps. Pass endDate to page backwards (a string: epoch milliseconds such as \"1760000000000\", or a date string; stored datetimes are UTC); omit it for the latest readings. limit is the number of records, default and maximum 288. Rate limit is 1 request per second per API key.",
        input: object({
          macAddress: string({ minLength: 1 }),
          endDate: string().optional(),
          limit: number().optional(),
        }),
      },
      async (_ctx, { macAddress, endDate, limit }) =>
        call(`/devices/${encodeURIComponent(macAddress)}`, { endDate, limit }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { ambientweather: ambientweather.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.ambientweather ?? [], (account) => build(client(account.fields, fetch, signal)), { signal }),
      {
        title: "Ambient Weather",
        description: "Read personal weather station data from AmbientWeather.net: current readings and history for each station.",
        icons,
      },
    ),
  }),
);

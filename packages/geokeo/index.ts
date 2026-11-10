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

const base = "https://geokeo.com/geocode/v1";

const geokeo = defineProvider({
  name: "Geokeo",
  hosts: ["geokeo.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Geokeo has no account endpoint, and every geocode request counts against the daily quota.
  // A cheap reverse lookup is the only way to validate the key; ACCESS_DENIED is reported
  // in the body, so the status field is checked below.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/reverse.php`);
    url.searchParams.set("lat", "40.74842");
    url.searchParams.set("lng", "-73.9856");
    url.searchParams.set("api", account.fields.token);
    const body = await decodeJson(await fetch(url.toString(), { signal }), object({ status: string() }));
    if (body.status.toUpperCase() === "ACCESS_DENIED") throw new Error("Geokeo rejected the API key (ACCESS_DENIED)");
  },
});

export default defineApp(
  { user: { accounts: { geokeo: geokeo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.geokeo ?? [],
        (account) => {
          const get = async (path: string, params: Record<string, string | number | undefined>) => {
            const url = new URL(`${base}/${path}`);
            for (const [key, value] of Object.entries(params)) {
              if (value !== undefined) url.searchParams.set(key, String(value));
            }
            url.searchParams.set("api", account.fields.token);
            url.searchParams.set("format", "json");
            // Errors carry only the status, never the request URL (it holds the key).
            return decodeJson(await fetch(url.toString(), { signal }), json());
          };
          return router({
            geocode: query(
              {
                description:
                  "Forward geocode: convert an address or place name (max 50 characters) to coordinates and structured address components. Optionally restrict to a country with an ISO 3166-1 alpha-2 code. Each call counts against the daily quota.",
                input: object({ q: string({ minLength: 1 }), country: string().optional() }),
              },
              async (_ctx, { q, country }) => get("search.php", { q, country }),
            ),
            reverseGeocode: query(
              {
                description:
                  "Reverse geocode: convert latitude and longitude (WGS 84 decimal degrees) to the nearest address or place. Results include the distance from the input point.",
                input: object({ lat: number(), lng: number() }),
              },
              async (_ctx, { lat, lng }) => get("reverse.php", { lat, lng }),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Geokeo",
        description: "Forward and reverse geocoding with the Geokeo API.",
        icons,
      },
    ),
  }),
);

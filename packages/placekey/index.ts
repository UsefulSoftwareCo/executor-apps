import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.placekey.io";

const placekey = defineProvider({
  name: "Placekey",
  hosts: ["api.placekey.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Placekey has no account endpoint. A coordinates-only lookup is the cheapest call (one lookup);
  // a bad key answers 401, which decodeJson turns into an error. Only `query_id` is always present.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/placekey`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", apikey: account.fields.token },
      body: JSON.stringify({ query: { latitude: 37.7371, longitude: -122.44283 } }),
    });
    await decodeJson(response, object({ query_id: string() }));
  },
});

const lookupFields =
  "Optional extra response fields: address_placekey, building_placekey, confidence_score, normalized_address, geocode (counts as an extra lookup), upi, parcel, geoid, gers.";
const queryDescription =
  "Place query with snake_case fields: latitude, longitude, location_name, street_address, city, region, postal_code, iso_country_code, query_id, and place_metadata { phone_number, naics_code, website, mcc_code, store_id }. Minimum inputs: street_address + city + region + postal_code + iso_country_code; or street_address + region + postal_code + iso_country_code; or street_address + city + region + iso_country_code; or latitude + longitude (returns only the Where part). location_name needs US, Canada or UK.";

export default defineApp(
  { user: { accounts: { placekey: placekey.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.placekey ?? [],
        (account) => {
          const post = async (path: string, body: unknown) =>
            decodeJson(
              await fetch(`${base}${path}`, {
                method: "POST",
                signal,
                headers: { "content-type": "application/json", apikey: account.fields.token },
                body: JSON.stringify(body),
              }),
              json(),
            );
          // Both calls are POST only because the vendor takes a JSON body; they compute an identifier
          // and change nothing, so they are queries and need no approval. Each spends plan lookups.
          return router({
            lookup: query(
              {
                description: `Get the Placekey for one address, coordinate pair or point of interest. Returns { query_id, placekey } plus requested fields, or { query_id, error } with HTTP 200 when the query cannot be matched. Consumes one lookup. ${lookupFields}`,
                input: object({
                  query: record(json()),
                  fields: array(string()).optional(),
                }),
              },
              async (_ctx, input) =>
                post("/v1/placekey", {
                  query: input.query,
                  ...(input.fields ? { options: { fields: input.fields } } : {}),
                }),
            ),
            lookupBulk: query(
              {
                description: `Get Placekeys for up to 100 places in one request. Every query must share the same iso_country_code. Set query_id on each to correlate results. Consumes one lookup per query. ${lookupFields}`,
                input: object({
                  queries: array(record(json())),
                  fields: array(string()).optional(),
                }),
              },
              async (_ctx, input) => {
                if (input.queries.length === 0 || input.queries.length > 100) {
                  throw new Error("queries must contain between 1 and 100 entries");
                }
                return post("/v1/placekeys", {
                  queries: input.queries,
                  ...(input.fields ? { options: { fields: input.fields } } : {}),
                });
              },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Placekey",
        description:
          "Placekey location identifiers: look up the Placekey for an address, coordinates or point of interest, singly or in bulk of up to 100.",
        instructions: queryDescription,
        icons,
      },
    ),
  }),
);

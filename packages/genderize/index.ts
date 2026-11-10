import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const genderize = defineProvider({
  name: "Genderize",
  hosts: ["api.genderize.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Genderize has no account endpoint. A one-name lookup is the only way to validate the key
  // (a bad key answers 401) and costs one name of quota.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.genderize.io");
    url.searchParams.set("name", "peter");
    url.searchParams.set("apikey", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { genderize: genderize.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.genderize ?? [],
        (account) => {
          const call = async (names: readonly string[], countryId: string | undefined) => {
            const url = new URL("https://api.genderize.io");
            // The key is sent as a query parameter, the only method Genderize documents.
            url.searchParams.set("apikey", account.fields.token);
            for (const name of names) url.searchParams.append(names.length === 1 ? "name" : "name[]", name);
            if (countryId !== undefined) url.searchParams.set("country_id", countryId);
            return decodeJson(await fetch(url.toString(), { signal }), json());
          };
          return router({
            predict: query(
              {
                description:
                  "Predict the gender of one first name (a full name also works). Returns name, gender (male, female or null), probability (0-1) and count of data points. Spends one name of quota.",
                input: object({
                  name: string({ minLength: 1 }),
                  countryId: string({ minLength: 2 }).optional(),
                }),
              },
              async (_ctx, { name, countryId }) => call([name], countryId),
            ),
            predictBatch: query(
              {
                description:
                  "Predict the gender of up to 100 names in one request. Results come back as an array in input order. Each name counts against the monthly quota. countryId (ISO 3166-1 alpha-2) applies to every name.",
                input: object({
                  names: array(string({ minLength: 1 })),
                  countryId: string({ minLength: 2 }).optional(),
                }),
              },
              async (_ctx, { names, countryId }) => {
                // A single name[] entry is answered as one object, not an array, so normalise.
                if (names.length === 0 || names.length > 100) throw new Error("Provide between 1 and 100 names");
                const result = await call(names, countryId);
                return Array.isArray(result) ? result : [result];
              },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Genderize",
        description:
          "Predict the gender of first names with Genderize.io, one at a time or in batches of up to 100, optionally localized by country.",
        icons,
      },
    ),
  }),
);

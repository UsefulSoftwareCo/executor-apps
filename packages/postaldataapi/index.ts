import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://postaldatapi.com/api";

const postaldataapi = defineProvider({
  name: "Postal Data API",
  hosts: ["postaldatapi.com"],
  auth: {
    // Created in the PostalDataPI dashboard; the API takes it in the JSON body, not a header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /api/aboutapi only reads version and coverage text, and rejects a bad key with 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/aboutapi`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: account.fields.token }),
    });
    await decodeJson(response, object({ version: string() }));
  },
});

const Code = object({
  zipcode: string({ minLength: 1 }),
  country: string().optional(),
});

const City = object({
  city: string({ minLength: 1 }),
  state: string().optional(),
  ST: string().optional(),
  country: string().optional(),
});

const Bulk = object({
  records: array(object({ postalCode: string({ minLength: 1 }), countryCode: string({ minLength: 1 }) })),
});

function client(apiKey: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const post = async (path: string, body: object) => {
    // Optional fields that were not supplied arrive as undefined; JSON.stringify drops them.
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, apiKey }),
    });
    return decodeJson(response, json());
  };
  return router({
    lookup: query(
      {
        description:
          "Look up the city, region (state and abbreviation ST) and coordinates of a postal code. country is an ISO 3166-1 alpha-2 code and defaults to US. Costs one query; 404 means the code does not exist.",
        input: Code,
      },
      async (_ctx, input) => post("/lookup", input),
    ),
    metadata: query(
      {
        description:
          "Get every available detail for a postal code (coordinates, timezone, county, elevation, administrative levels), returned in a meta object. Fields vary by country. country defaults to US.",
        input: Code,
      },
      async (_ctx, input) => post("/metacode", input),
    ),
    searchByCity: query(
      {
        description:
          "List the postal codes of a city. US searches require state (full name) or ST (abbreviation). country defaults to US.",
        input: City,
      },
      async (_ctx, input) => post("/city", input),
    ),
    validate: query(
      {
        description:
          "Check whether a postal code exists. Returns { valid: boolean, zipcode }; an unknown code is valid:false, not an error. country defaults to US.",
        input: Code,
      },
      async (_ctx, input) => post("/validate", input),
    ),
    validateBulk: mutation(
      {
        description:
          "Validate 1 to 1000 postal codes in one request, mixing countries. Each record is { postalCode, countryCode } and is billed like a single validation. Results keep input order with valid, normalized and reason per record. The whole batch is rejected with 402 if the balance is too low.",
        input: Bulk,
      },
      async (_ctx, input) => post("/validate-bulk", input),
    ),
    about: query(
      {
        description: "Return the API version, coverage and usage notes. Useful as a connectivity check.",
        input: object({}),
      },
      async () => post("/aboutapi", {}),
    ),
  });
}

export default defineApp(
  { user: { accounts: { postaldataapi: postaldataapi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postaldataapi ?? [],
        (account) =>
          withApprovals(client(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Postal Data API",
        description:
          "Validate and look up postal codes, cities, coordinates and regional metadata for 240+ countries with PostalDataPI.",
        icons,
      },
    ),
  }),
);

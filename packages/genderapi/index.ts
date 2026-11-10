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

const base = "https://gender-api.com/v2";

const genderapi = defineProvider({
  name: "Gender API",
  hosts: ["gender-api.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The docs example for /statistic reports credits_used: 0. An exhausted account gets HTTP 401 (limit exceeded), so a failing health check can mean no credits left rather than a bad token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/statistic`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ remaining_credits: json() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const post = (account: Account, signal: AbortSignal, path: string, body: unknown) => ({
  method: "POST",
  signal,
  headers: headers(account),
  body: JSON.stringify(body),
  path,
});

const optionalContext = {
  country: string().optional(),
  locale: string().optional(),
  ip: string().optional(),
  id: string().optional(),
};

const contextNote =
  "Optional: country (ISO 3166 alpha-2, improves accuracy), locale (browser locale such as en_US), ip (IPv4 or IPv6, used to infer the country) and id (up to 50 characters, echoed back to match responses).";

const genderapiTools = (account: Account, signal: AbortSignal) => {
  const call = async (fetch: typeof globalThis.fetch, path: string, body: unknown) => {
    const { path: _path, ...init } = post(account, signal, path, body);
    return decodeJson(await fetch(`${base}${path}`, init), json());
  };
  return router({
    genderByFirstName: query(
      {
        description: `Determine the gender of a first name. Returns gender (male, female or unknown), probability, sample count and credits used (1 credit). ${contextNote}`,
        input: object({ first_name: string(), ...optionalContext }),
      },
      async ({ fetch }, input) => call(fetch, "/gender", input),
    ),
    genderByFullName: query(
      {
        description: `Determine the gender from a full name; the API splits it into first and last name. Returns gender, probability and the split name (1 credit). ${contextNote}`,
        input: object({ full_name: string(), ...optionalContext }),
      },
      async ({ fetch }, input) => call(fetch, "/gender", input),
    ),
    genderByEmail: query(
      {
        description: `Determine the gender from an email address by extracting the name from it (1 credit). ${contextNote}`,
        input: object({ email: string(), ...optionalContext }),
      },
      async ({ fetch }, input) => call(fetch, "/gender", input),
    ),
    genderBatch: query(
      {
        description:
          "Look up many names in one request. Each item must set exactly one of first_name, full_name or email, plus the optional country, locale, ip and id fields. Some plans limit the number of lookups per request (a 'too many queries' error). Costs 1 credit per item.",
        input: object({
          queries: array(
            object({
              first_name: string().optional(),
              full_name: string().optional(),
              email: string().optional(),
              ...optionalContext,
            }),
          ),
        }),
      },
      async ({ fetch }, { queries }) => call(fetch, "/gender", queries),
    ),
    countryOfOrigin: query(
      {
        description:
          "Determine the likely countries of origin, language of origin, name meaning and ethnicity distribution for a name (2 credits). Set exactly one of first_name, full_name or email; id is echoed back.",
        input: object({
          first_name: string().optional(),
          full_name: string().optional(),
          email: string().optional(),
          id: string().optional(),
        }),
      },
      async ({ fetch }, input) => call(fetch, "/country-of-origin", input),
    ),
    statistic: query(
      {
        description: "Get the account's remaining credits, whether the limit is reached and last month's usage. The docs example shows 0 credits used for this call.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/statistic`, { signal, headers: headers(account) }), json()),
    ),
  });
};

export default defineApp({ user: { accounts: { genderapi: genderapi.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.genderapi ?? [], (account) => genderapiTools(account, signal), { signal }), {
    title: "Gender API",
    description:
      "Determine gender and country of origin from first names, full names and email addresses, and check credit usage. Account creation (POST /v2/sign-up) is not exposed: it needs no token but tools here only run once a token is connected.",
    icons,
  }),
}));

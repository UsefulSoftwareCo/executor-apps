import {
  accountRouter,
  boolean,
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

// Fixer is served from two hosts. A key from the APILayer marketplace works only at the gateway
// (`apikey` header); a key from a fixer.io signup works only at data.fixer.io (`access_key` query parameter).
const apilayerBase = "https://api.apilayer.com/fixer";
const legacyBase = "https://data.fixer.io/api";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "accessKey"; fields: { accessKey: string } };

const fixer = defineProvider({
  name: "Fixer",
  hosts: ["api.apilayer.com", "data.fixer.io"],
  auth: {
    apiKey: secrets({
      label: "APILayer API key (sent to api.apilayer.com/fixer)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    accessKey: secrets({
      label: "fixer.io access key (sent to data.fixer.io)",
      fields: object({ accessKey: string({ minLength: 1 }) }),
    }),
  },
  // /symbols is read-only and lists the supported currency codes. data.fixer.io reports bad keys
  // with HTTP 200 and success:false, so the flag is checked on both hosts.
  async health({ account, fetch, signal }) {
    const body = await decodeJson(await send(fetch, account as Account, signal, "/symbols", {}), object({ success: boolean() }));
    if (!body.success) throw new Error("Fixer rejected the key");
  },
});

const send = (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, string | number | undefined>,
) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  if (account.method === "accessKey") {
    out.set("access_key", account.fields.accessKey);
    return fetch(`${legacyBase}${path}?${out}`, { signal, headers: { Accept: "application/json" } });
  }
  const text = out.toString();
  return fetch(`${apilayerBase}${path}${text === "" ? "" : `?${text}`}`, {
    signal,
    headers: { Accept: "application/json", apikey: account.fields.token },
  });
};

const fixerTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | undefined> = {}) =>
    decodeJson(await send(fetch, account, signal, path, params), json());
  return router({
    symbols: query(
      {
        description: "List every supported currency code with its name, for example { USD: \"United States Dollar\" }.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/symbols"),
    ),
    latest: query(
      {
        description:
          "Get the latest exchange rates. base is the source currency code (default EUR; changing it needs a paid plan on some tiers). symbols is an optional comma-separated list of target currency codes such as USD,GBP,JPY; omit for all.",
        input: object({ base: string().optional(), symbols: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/latest", input),
    ),
    historical: query(
      {
        description:
          "Get the exchange rates for one past date (YYYY-MM-DD, data back to 1999). base and symbols behave as in latest.",
        input: object({ date: string(), base: string().optional(), symbols: string().optional() }),
      },
      async ({ fetch }, { date, ...input }) => get(fetch, `/${encodeURIComponent(date)}`, input),
    ),
    convert: query(
      {
        description:
          "Convert an amount from one currency to another. from and to are currency codes, amount is the numeric amount as a string (for example 25). date (YYYY-MM-DD) converts at a historical rate.",
        input: object({ from: string(), to: string(), amount: string(), date: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/convert", input),
    ),
    timeseries: query(
      {
        description:
          "Get daily exchange rates between start_date and end_date (YYYY-MM-DD). The maximum range is 365 days. base and symbols behave as in latest.",
        input: object({
          start_date: string(),
          end_date: string(),
          base: string().optional(),
          symbols: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/timeseries", input),
    ),
    fluctuation: query(
      {
        description:
          "Get how rates changed between start_date and end_date (YYYY-MM-DD): start and end rate, absolute change and percentage change per currency. The maximum range is 365 days. base and symbols behave as in latest.",
        input: object({
          start_date: string(),
          end_date: string(),
          base: string().optional(),
          symbols: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/fluctuation", input),
    ),
  });
};

export default defineApp({ user: { accounts: { fixer: fixer.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.fixer ?? [], (account) => fixerTools(account, signal), { signal }), {
    title: "Fixer",
    description: "Real-time and historical foreign exchange rates, currency conversion, time series and fluctuation for 170 currencies.",
    icons,
  }),
}));

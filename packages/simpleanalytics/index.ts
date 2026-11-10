import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://simpleanalytics.com";

const simpleanalytics = defineProvider({
  name: "Simple Analytics",
  hosts: ["simpleanalytics.com"],
  auth: {
    apiKey: secrets({
      label: "API key and user ID",
      fields: object({ token: string({ minLength: 1 }), userId: string({ minLength: 1 }) }),
    }),
  },
  // Listing websites is the one Admin endpoint open to every plan and it needs both credentials.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/websites`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string; userId: string } };

const headers = (account: Account) => ({
  "Api-Key": account.fields.token,
  "User-Id": account.fields.userId,
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, value);
  return out.toString();
};

const tools = (account: Account, signal: AbortSignal) =>
  router({
    stats: query(
      {
        description:
          "Aggregated stats for a website (and optionally one path) from the Stats API. Choose what to return with fields, a comma-separated list such as pageviews,visitors,histogram,pages,countries,referrers,utm_sources,browser_names,os_names,device_types,seconds_on_page. Use start and end (YYYY-MM-DD, today, yesterday, or relative like today-7d), plus options such as timezone, limit, interval, events, info=false or filters like pages=/pricing in params. version defaults to 6.",
        input: object({
          hostname: string(),
          path: string().optional(),
          fields: string().optional(),
          start: string().optional(),
          end: string().optional(),
          params: record(string()).optional(),
        }),
      },
      async ({ fetch }, { hostname, path, params, ...input }) => {
        const suffix = path === undefined ? "" : `/${path.replace(/^\/+/, "")}`;
        return decodeJson(
          await fetch(`${origin}/${hostname}${suffix}.json?${search({ version: "6", ...params, ...input })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        );
      },
    ),
    websites: router({
      list: query(
        { description: "List every website in the account, including teams the user belongs to.", input: object({}) },
        async ({ fetch }) =>
          decodeJson(await fetch(`${origin}/api/websites`, { signal, headers: headers(account) }), json()),
      ),
      add: mutation(
        {
          description:
            "Add a website by hostname. Optionally make its stats public, set an IANA timezone (default UTC) and a label. Requires a Business or Enterprise plan and upgrades the account automatically.",
          input: object({
            hostname: string(),
            public: boolean().optional(),
            timezone: string().optional(),
            label: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${origin}/api/websites/add`, {
              method: "POST",
              signal,
              headers: headers(account),
              body: JSON.stringify(input),
            }),
            json(),
          ),
      ),
    }),
    exportDatapoints: query(
      {
        description:
          "Export raw, unsampled pageviews and events as CSV text from the Export API. type is pageviews or events; fields is a comma-separated list such as added_iso,path,country_code,datapoint (metadata needs a type suffix, e.g. metadata.dark_mode_bool). start and end are YYYY-MM-DD, or YYYY-MM-DDTHH for hourly exports within one day. Select few fields and short ranges: the whole file is returned.",
        input: object({
          hostname: string(),
          start: string(),
          end: string(),
          fields: string(),
          type: string().optional(),
          timezone: string().optional(),
          robots: boolean().optional(),
        }),
      },
      async ({ fetch }, { robots, ...input }) => {
        const response = await fetch(
          `${origin}/api/export/datapoints?${search({
            version: "6",
            format: "csv",
            ...input,
            robots: robots === undefined ? undefined : String(robots),
          })}`,
          { signal, headers: headers(account) },
        );
        if (!response.ok) throw new Error(`Simple Analytics export failed with HTTP ${response.status}`);
        return { csv: await response.text() };
      },
    ),
  });

export default defineApp({ user: { accounts: { simpleanalytics: simpleanalytics.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.simpleanalytics ?? [], (account) => tools(account, signal), { signal }), {
    title: "Simple Analytics",
    description: "Privacy-friendly web analytics: query stats, list and add websites, and export raw pageviews and events.",
    icons,
  }),
}));

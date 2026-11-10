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

const base = "https://api.similarweb.com";

const similarweb = defineProvider({
  name: "Similarweb Digital Rank",
  hosts: ["api.similarweb.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The capabilities endpoint is read-only and does not consume hits or data credits.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user-capabilities?${search({ api_key: account.fields.token })}`, { signal });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const similarwebTools = (account: Account, signal: AbortSignal) =>
  router({
    topSites: query(
      {
        description:
          "List the top-ranked websites worldwide (desktop and mobile web combined) by Similarweb rank, based on unique visitors and page views. Returns { meta, top_sites: [{ domain, rank }] }. limit defaults to 10 and is at most 5000. Costs 1 hit per request or 1 data credit per result.",
        input: object({ limit: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/similar-rank/top-sites/?${search({ api_key: account.fields.token, ...input })}`, {
            signal,
          }),
          json(),
        ),
    ),
    globalRank: query(
      {
        description:
          "Get the Similarweb global rank of one domain, monthly or for the last 28 days (omit startDate and endDate). domain has no www. prefix (for example amazon.com). startDate and endDate are YYYY-MM. Set mainDomainOnly to true to exclude subdomains. Returns { meta, global_rank: [{ date, global_rank }] }. Costs 1 hit per request or 1 data credit per result.",
        input: object({
          domain: string({ minLength: 1 }),
          startDate: string().optional(),
          endDate: string().optional(),
          mainDomainOnly: string().optional(),
        }),
      },
      async ({ fetch }, { domain, startDate, endDate, mainDomainOnly }) =>
        decodeJson(
          await fetch(
            `${base}/v1/website/${encodeURIComponent(domain)}/global-rank/global-rank?${search({
              api_key: account.fields.token,
              start_date: startDate,
              end_date: endDate,
              main_domain_only: mainDomainOnly,
              format: "json",
            })}`,
            { signal },
          ),
          json(),
        ),
    ),
    capabilities: query(
      {
        description:
          "Check the API key's capabilities and remaining usage: which countries and data the subscription can access and how many hits or data credits are left. Does not consume hits.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/user-capabilities?${search({ api_key: account.fields.token })}`, { signal }), json()),
    ),
  });

export default defineApp({ user: { accounts: { similarweb: similarweb.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.similarweb ?? [], (account) => similarwebTools(account, signal), { signal }), {
    title: "Similarweb Digital Rank",
    description: "Look up Similarweb global website ranks and the top-ranked sites worldwide.",
    icons,
  }),
}));

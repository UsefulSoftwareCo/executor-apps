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

const base = "https://web3.career/api/v1";

type Fetch = typeof fetch;

const web3career = defineProvider({
  name: "Web3 Career",
  hosts: ["web3.career"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The token travels as a query parameter. A bad token is rejected with a non-2xx status.
  async health({ account, fetch, signal }) {
    const url = new URL(base);
    url.searchParams.set("token", account.fields.token);
    url.searchParams.set("limit", "1");
    url.searchParams.set("show_description", "false");
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Web3 Career rejected the API token (${response.status})`);
  },
});

// The API answers with a mixed array such as ["status", "text", [job, ...]]; the jobs are the nested array.
function extractJobs(data: unknown): unknown[] {
  if (!Array.isArray(data)) throw new Error("Unexpected Web3 Career response format");
  const nested = data.find((item) => Array.isArray(item));
  if (nested !== undefined) return nested;
  if (data.length === 0 || (typeof data[0] === "object" && data[0] !== null)) return data;
  throw new Error("Could not locate the jobs array in the Web3 Career response");
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    searchJobs: query(
      {
        description:
          "Search Web3 Career job listings. All filters are optional and combine. tag is one exact lowercase slug (solidity, rust, smart-contract, front-end, marketing, defi, solana, ethereum, design, product-manager...); only one tag per call. country is a lowercase hyphenated slug (united-states, united-kingdom, germany, singapore...), not an ISO code. remote=true keeps only fully remote roles. limit is 1-100. includeDescription adds each job's full description, which is HTML and long. Unknown tag or country values return zero jobs rather than an error. Always link to a job with its apply_url exactly as returned: do not modify it or add tracking parameters, and never mark the link nofollow.",
        input: object({
          tag: string().optional(),
          country: string().optional(),
          remote: boolean().optional(),
          limit: number().optional(),
          includeDescription: boolean().optional(),
        }),
      },
      async (_ctx, { tag, country, remote, limit, includeDescription }) => {
        const url = new URL(base);
        url.searchParams.set("token", token);
        if (tag !== undefined) url.searchParams.set("tag", tag);
        if (country !== undefined) url.searchParams.set("country", country);
        if (remote === true) url.searchParams.set("remote", "true");
        if (limit !== undefined) url.searchParams.set("limit", String(limit));
        url.searchParams.set("show_description", includeDescription === true ? "true" : "false");
        const response = await fetcher(url, { signal });
        const data = await decodeJson(response, json());
        return extractJobs(data);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { web3career: web3career.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.web3career ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Web3 Career",
        description: "Search Web3 Career job listings by technology, role, country and remote status.",
        icons,
      },
    ),
  }),
);

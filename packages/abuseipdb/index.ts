import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.abuseipdb.com/api/v2";

const abuseipdb = defineProvider({
  name: "AbuseIPDB",
  hosts: ["api.abuseipdb.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Checking a reserved address is read-only and counts only against the check quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/check?ipAddress=127.0.0.1`, {
      signal,
      headers: { Key: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: object({ ipAddress: string() }) }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Key: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const abuseipdbTools = (account: Account, signal: AbortSignal) =>
  router({
    check: query(
      {
        description:
          "Check one IPv4 or IPv6 address: abuse confidence score (0-100), country, ISP, usage type, domain, hostnames, Tor flag and report totals. Set verbose to also include the individual reports and country name. maxAgeInDays is 1-365 (default 30).",
        input: object({
          ipAddress: string(),
          maxAgeInDays: number().optional(),
          verbose: boolean().optional(),
        }),
      },
      async ({ fetch }, { verbose, ...input }) =>
        decodeJson(
          await fetch(
            `${base}/check?${search(input)}${verbose === true ? "&verbose" : ""}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
    reports: query(
      {
        description:
          "List the individual reports filed against one IP address, newest first, with pagination (page from 1, perPage 1-100, default 25). maxAgeInDays is 1-365 (default 30). The endpoint is in open beta.",
        input: object({
          ipAddress: string(),
          maxAgeInDays: number().optional(),
          page: number().optional(),
          perPage: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/reports?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    checkBlock: query(
      {
        description:
          "Check a CIDR network block (for example 203.0.113.0/24) and list the reported addresses inside it. Maximum block size and maxAgeInDays depend on the plan: Standard /24 and 30 days, Basic /20 and 60, Premium /16 and 365. Exceeding the plan returns 402.",
        input: object({ network: string(), maxAgeInDays: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/check-block?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    blacklist: query(
      {
        description:
          "Get the blacklist of the most reported IPs, ordered by confidence score. limit defaults to 10000 and is capped by plan. confidenceMinimum (25-100), onlyCountries and exceptCountries (comma-separated ISO 3166 alpha-2 codes) need a subscription; without one the plain list is returned. ipVersion is 4 or 6. This endpoint has a very low daily quota (5 on the free plan).",
        input: object({
          confidenceMinimum: number().optional(),
          limit: number().optional(),
          onlyCountries: string().optional(),
          exceptCountries: string().optional(),
          ipVersion: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/blacklist?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    report: mutation(
      {
        description:
          "Report an abusive IP address. categories are AbuseIPDB category ids (for example 18 brute-force, 22 SSH, 14 port scan, 21 web app attack). comment must not contain personal information. timestamp is an ISO 8601 time of the attack. The same IP can be reported once per 15 minutes.",
        input: object({
          ip: string(),
          categories: array(number()),
          comment: string().optional(),
          timestamp: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { categories, ...input }) =>
        decodeJson(
          await fetch(`${base}/report`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
            body: search({ ...input, categories: categories.join(",") }),
          }),
          json(),
        ),
    ),
    bulkReport: mutation(
      {
        description:
          "Report many IPs at once by uploading CSV text. The CSV needs the header row IP,Categories,ReportDate,Comment, with categories separated by commas inside quotes. Returns the number of saved reports and the invalid rows. Very low daily quota.",
        input: object({ csv: string() }),
        approval: always(),
      },
      async ({ fetch }, { csv }) => {
        const form = new FormData();
        form.set("csv", new Blob([csv], { type: "text/csv" }), "reports.csv");
        return decodeJson(
          await fetch(`${base}/bulk-report`, { method: "POST", signal, headers: headers(account), body: form }),
          json(),
        );
      },
    ),
    clearAddress: mutation(
      {
        description:
          "Delete all reports your own account filed for one IP address. Reports from other users are untouched. Returns numReportsDeleted.",
        input: object({ ipAddress: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/clear-address?${search(input)}`, { method: "DELETE", signal, headers: headers(account) }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { abuseipdb: abuseipdb.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.abuseipdb ?? [], (account) => abuseipdbTools(account, signal), { signal }), {
    title: "AbuseIPDB",
    description: "Check, report and look up abusive IP addresses and CIDR blocks, and fetch the AbuseIPDB blacklist.",
    icons,
  }),
}));

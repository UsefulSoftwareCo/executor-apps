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

const whoisBase = "https://api.ip2whois.com/v2";
const domainsBase = "https://domains.ip2whois.com/domains";

const ip2whois = defineProvider({
  name: "IP2WHOIS",
  hosts: ["api.ip2whois.com", "domains.ip2whois.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Looking up a reserved domain returns a WHOIS record or an error body; either way
  // `domain` is not guaranteed, so only the response being JSON is checked.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${whoisBase}?domain=example.com`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ domain: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const ip2whoisTools = (account: Account, signal: AbortSignal) =>
  router({
    lookup: query(
      {
        description:
          "WHOIS lookup for one domain name (for example example.com): domain id, status, create/update/expire dates, domain age in days, WHOIS server, nameservers, registrar, and the registrant, admin, tech and billing contacts. Contact fields are empty strings when unavailable and privacy-protected domains show placeholders. Errors come back as an error object with error_code (10001 key not found, 10004 insufficient queries, 10006 no data, 10007 invalid domain).",
        input: object({ domain: string({ minLength: 1 }) }),
      },
      async ({ fetch }, { domain }) =>
        decodeJson(
          await fetch(`${whoisBase}?${new URLSearchParams({ domain, format: "json" })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    hostedDomains: query(
      {
        description:
          "List the domains hosted on an IPv4 or IPv6 address (reverse IP lookup). Returns ip, total_domains, page, per_page, total_pages and domains. Page size depends on the plan (free 1, starter 5, plus 20, security 100); request page 2, 3... up to total_pages for more. page defaults to 1.",
        input: object({ ip: string({ minLength: 1 }), page: number().optional() }),
      },
      async ({ fetch }, { ip, page }) =>
        decodeJson(
          await fetch(
            `${domainsBase}?${new URLSearchParams({ ip, format: "json", ...(page === undefined ? {} : { page: String(page) }) })}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { ip2whois: ip2whois.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ip2whois ?? [], (account) => ip2whoisTools(account, signal), { signal }), {
    title: "IP2WHOIS",
    description: "WHOIS lookups for domains and reverse-IP lookups of the domains hosted on an address.",
    icons,
  }),
}));

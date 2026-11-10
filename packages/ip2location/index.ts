import {
  accountRouter,
  array,
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

const geoBase = "https://api.ip2location.io/";
const bulkBase = "https://bulk.ip2location.io/";
const whoisBase = "https://api.ip2whois.com/v2/";
const hostedBase = "https://domains.ip2whois.com/domains";

const ip2location = defineProvider({
  name: "IP2Location",
  hosts: ["api.ip2location.io", "bulk.ip2location.io", "api.ip2whois.com", "domains.ip2whois.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A keyed lookup of a public address; it fails with error 10000 for an invalid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${geoBase}?ip=8.8.8.8`, { signal, headers: headers(account) });
    await decodeJson(response, object({ ip: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const ip2locationTools = (account: Account, signal: AbortSignal) =>
  router({
    lookup: query(
      {
        description:
          "Geolocate one IPv4 or IPv6 address. Omit ip to look up the requesting server's own address (the Executor host's egress address). Returns country, region, city, coordinates, zip code, time zone, ASN and proxy flag; higher plans add ISP, domain, usage type, fraud score and detailed proxy and AS data. lang (Plus and Security plans only) is one language code from ar, cs, da, de, en, es, et, fi, fr, ga, it, ja, ko, ms, nl, pt, ru, sv, tr, vi, zh-cn, zh-tw and translates continent, country, region and city names.",
        input: object({ ip: string().optional(), lang: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${geoBase}?${search({ ...input, format: "json" })}`, { signal, headers: headers(account) }), json()),
    ),
    bulkLookup: query(
      {
        description:
          "Geolocate up to 1000 IPv4 or IPv6 addresses in one request (paid plans only). Returns an object keyed by IP address. fields optionally limits the output to a comma-separated list of fields such as country_code,city_name,as_info.as_cidr,proxy.is_vpn.",
        input: object({ ips: array(string()), fields: string().optional() }),
      },
      async ({ fetch }, { ips, fields }) =>
        decodeJson(
          await fetch(`${bulkBase}?${search({ format: "json", fields })}`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(ips),
          }),
          json(),
        ),
    ),
    whois: query(
      {
        description:
          "Look up the WHOIS record of a domain name (IP2WHOIS): registrar, creation, update and expiry dates, domain age in days, name servers, status and registrant, admin, tech and billing contacts.",
        input: object({ domain: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${whoisBase}?${search({ ...input, format: "json" })}`, { signal, headers: headers(account) }), json()),
    ),
    hostedDomains: query(
      {
        description:
          "List the domain names hosted on an IPv4 or IPv6 address (IP2WHOIS reverse IP lookup). Paginated: page starts at 1; the response gives total_pages. Domains per page depend on the plan (Free 1, Starter 5, Plus 20, Security 100).",
        input: object({ ip: string(), page: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${hostedBase}?${search({ ...input, format: "json" })}`, { signal, headers: headers(account) }), json()),
    ),
  });

export default defineApp({ user: { accounts: { ip2location: ip2location.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ip2location ?? [], (account) => ip2locationTools(account, signal), { signal }), {
    title: "IP2Location",
    description: "IP geolocation, proxy and VPN detection, bulk IP lookups, domain WHOIS and reverse-IP hosted domains from IP2Location.io and IP2WHOIS.",
    icons,
  }),
}));

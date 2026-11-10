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

const base = "https://api.ipdata.co";

type Account = { fields: { token: string } };

// ipdata documents the key as the `api-key` query parameter on every request.
const url = (account: Account, path: string, params: Record<string, string | undefined> = {}) => {
  const qs = new URLSearchParams({ "api-key": account.fields.token });
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, v);
  return `${base}/${path}?${qs}`;
};

const ipdata = defineProvider({
  name: "Ipdata.co",
  hosts: ["api.ipdata.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // One filtered lookup of a public address; it counts against the request quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(url(account, "8.8.8.8", { fields: "ip" }), {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ ip: string() }));
  },
});

const headers = { Accept: "application/json" };

const fieldsHelp =
  "fields is an optional comma-separated list of response fields to return: ip, is_eu, city, region, region_code, country_name, country_code, continent_name, continent_code, latitude, longitude, asn, postal, calling_code, flag, emoji_flag, emoji_unicode, carrier, languages, currency, time_zone, threat, count, company.";

const ipdataTools = (account: Account, signal: AbortSignal) => {
  const sub = (what: string, path: string, extra: string) =>
    query(
      {
        description: `Get the ${what} of an IP address. ${extra}`,
        input: object({ ip: string() }),
      },
      async ({ fetch }, { ip }) =>
        decodeJson(await fetch(url(account, `${encodeURIComponent(ip)}/${path}`), { signal, headers }), json()),
    );
  return router({
    lookup: query(
      {
        description: `Look up an IPv4 or IPv6 address: location, ASN, company, carrier, languages, currency, time zone and threat data; some fields may require a plan (unverified). Omit ip to look up the caller's own address. ${fieldsHelp}`,
        input: object({ ip: string().optional(), fields: string().optional() }),
      },
      async ({ fetch }, { ip, fields }) => {
        return decodeJson(
          await fetch(url(account, ip === undefined ? "" : encodeURIComponent(ip), { fields }), { signal, headers }),
          json(),
        );
      },
    ),
    bulk: query(
      {
        description: `Look up up to 100 IP addresses (or ASNs such as AS15169) in one request; this only reads data, it is a POST because of the request body. May require a plan (unverified). Returns one result per resource. ${fieldsHelp}`,
        input: object({ resources: array(string()), fields: string().optional() }),
      },
      async ({ fetch }, { resources, fields }) => {
        return decodeJson(
          await fetch(url(account, "bulk", { fields }), {
            method: "POST",
            signal,
            headers: { ...headers, "content-type": "application/json" },
            body: JSON.stringify(resources),
          }),
          json(),
        );
      },
    ),
    asn: sub("ASN data (asn, name, domain, route, usage type)", "asn", "Basic ASN data is documented at https://docs.ipdata.co/docs/asn-data.md."),
    company: sub("owning company (name, domain, network, type)", "company", "May require a plan that includes company data (unverified)."),
    carrier: sub("mobile carrier (name, MCC, MNC)", "carrier", "Empty for IPs that are not on a mobile network. May require a plan that includes carrier data (unverified)."),
    timeZone: sub("time zone (name, abbreviation, offset, current time, DST)", "time_zone", "May require a plan that includes time zone data (unverified)."),
    currency: sub("currency of the IP's country (name, code, symbol)", "currency", "May require a plan that includes currency data (unverified)."),
    threat: sub("threat profile (Tor, proxy, anonymous, known attacker/abuser, VPN, blocklists, scores)", "threat", "May require a plan that includes threat data (unverified)."),
    field: query(
      {
        description:
          "Get a single field of an IP address as returned by ipdata, for example country_name, city, is_eu, emoji_flag or latitude. Use lookup with fields to get several fields at once.",
        input: object({ ip: string(), field: string() }),
      },
      async ({ fetch }, { ip, field }) =>
        decodeJson(
          await fetch(url(account, `${encodeURIComponent(ip)}/${encodeURIComponent(field)}`), { signal, headers }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { ipdata: ipdata.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ipdata ?? [], (account) => ipdataTools(account, signal), { signal }), {
    title: "Ipdata.co",
    description: "Look up the location, ASN, company, carrier, time zone, currency and threat profile of IP addresses.",
    icons,
  }),
}));

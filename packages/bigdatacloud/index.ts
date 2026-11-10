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

const base = "https://api-bdc.net/data";

const bigdatacloud = defineProvider({
  name: "BigDataCloud",
  hosts: ["api-bdc.net"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Looking up a country by code is a cheap read-only call that fails with 403 on a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/country-info?code=US&key=${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ isoAlpha2: string() }));
  },
});

type Account = { fields: { token: string } };

const lang = "localityLanguage is a language code such as en (default en).";
const page = "batchSize is the page size and offset the number of rows to skip.";

const bigdatacloudTools = (account: Account, signal: AbortSignal) => {
  const get = async (
    fetch: typeof globalThis.fetch,
    endpoint: string,
    params: Record<string, string | number | boolean | undefined>,
  ) => {
    const out = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
    out.set("key", account.fields.token);
    return decodeJson(
      await fetch(`${base}/${endpoint}?${out.toString()}`, { signal, headers: { Accept: "application/json" } }),
      json(),
    );
  };
  const ipOnly = (endpoint: string, description: string) =>
    query(
      { description: `${description} ${lang}`, input: object({ ip: string(), localityLanguage: string().optional() }) },
      async ({ fetch }, input) => get(fetch, endpoint, input),
    );
  const coords = (endpoint: string, description: string) =>
    query(
      {
        description: `${description} ${lang}`,
        input: object({ latitude: number(), longitude: number(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, endpoint, input),
    );
  const asnPaged = (endpoint: string, description: string) =>
    query(
      {
        description: `${description} asn is like AS13335 or 13335. ${page}`,
        input: object({
          asn: string(),
          batchSize: number().optional(),
          offset: number().optional(),
          localityLanguage: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, endpoint, input),
    );

  return router({
    ipGeolocation: ipOnly(
      "ip-geolocation",
      "Geolocate an IPv4 or IPv6 address: country, region, city, coordinates, network and ISP.",
    ),
    ipGeolocationFull: ipOnly(
      "ip-geolocation-full",
      "Full IP geolocation including confidence area, network details and hazard report.",
    ),
    ipGeolocationWithConfidence: ipOnly(
      "ip-geolocation-with-confidence",
      "IP geolocation with a confidence rating and the estimated area boundary.",
    ),
    reverseGeocode: coords(
      "reverse-geocode",
      "Turn coordinates into an address: locality, city, region, country, postcode.",
    ),
    reverseGeocodeWithTimezone: coords(
      "reverse-geocode-with-timezone",
      "Turn coordinates into an address plus timezone, UTC offset and local time.",
    ),
    timezoneByLocation: query(
      {
        description:
          "Timezone for coordinates: IANA id, offset, DST status and local time. utcReference is an optional ISO 8601 time to convert.",
        input: object({ latitude: number(), longitude: number(), utcReference: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "timezone-by-location", input),
    ),
    timezoneByIp: query(
      {
        description:
          "Timezone for an IP address: IANA id, offset, DST status and local time. utcReference is an optional ISO 8601 time to convert.",
        input: object({ ip: string(), utcReference: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "timezone-by-ip", input),
    ),
    timezoneByIanaId: query(
      {
        description:
          "Timezone details for an IANA id such as Australia/Sydney: offset, DST status and local time. utcReference is an optional ISO 8601 time to convert.",
        input: object({ timeZoneId: string(), utcReference: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "timezone-info", input),
    ),
    countryByIp: ipOnly("country-by-ip", "Find the country of an IP address with full country details."),
    countryInfo: query(
      {
        description: `Details for a country by ISO 3166-1 alpha-2 code (AU, US): names, currency, calling code, regions, flag. ${lang}`,
        input: object({ code: string(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "country-info", input),
    ),
    allCountries: query(
      {
        description: `List every country with names, currencies, calling codes and regions. ${lang}`,
        input: object({ localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "countries", input),
    ),
    networkByIp: ipOnly(
      "network-by-ip",
      "BGP network for an IP address: announced prefix, autonomous system, carrier and network type.",
    ),
    networksByCidr: query(
      {
        description: `All BGP-announced networks inside a CIDR range such as 1.1.1.0/24. ${lang}`,
        input: object({ cidr: string(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "network-by-cidr", input),
    ),
    asnInfo: query(
      {
        description: `Autonomous system details: name, organisation, country and announced prefixes. asn is like AS13335 or 13335. ${lang}`,
        input: object({ asn: string(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "asn-info", input),
    ),
    asnInfoFull: query(
      {
        description: `Extended autonomous system details with upstream and downstream peers, prefix counts, rank and service area. asn is like AS13335. ${lang}`,
        input: object({ asn: string(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "asn-info-full", input),
    ),
    asnReceivingFrom: asnPaged(
      "asn-info-receiving-from",
      "Paged list of upstream networks an ASN receives traffic from.",
    ),
    asnTransitTo: asnPaged("asn-info-transit-to", "Paged list of downstream networks an ASN provides transit to."),
    bgpPrefixes: query(
      {
        description: `Paged list of BGP prefixes announced by an ASN. isIPv4 true (default) for IPv4, false for IPv6. ${page}`,
        input: object({
          asn: string(),
          isIPv4: boolean().optional(),
          batchSize: number().optional(),
          offset: number().optional(),
        }),
      },
      async ({ fetch }, { isIPv4, ...input }) => get(fetch, "prefixes-list", { ...input, isv4: isIPv4 }),
    ),
    asnRankList: query(
      {
        description: `Paged ranking of all ASNs by IPv4 address space. ${page}`,
        input: object({ batchSize: number().optional(), offset: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "asn-rank-list", input),
    ),
    ipHazardReport: query(
      {
        description: "Threat assessment for an IP address: VPN, proxy, Tor, bot, spam and other hazard flags.",
        input: object({ ip: string() }),
      },
      async ({ fetch }, input) => get(fetch, "hazard-report", input),
    ),
    userRisk: query(
      {
        description:
          "Risk level (Low, Medium, High) of an IP address for sign-up and checkout flows, with a description.",
        input: object({ ip: string() }),
      },
      async ({ fetch }, input) => get(fetch, "user-risk", input),
    ),
    torExitNodes: query(
      {
        description: `Paged list of active Tor exit nodes with geolocation and carrier. ${page} ${lang}`,
        input: object({
          batchSize: number().optional(),
          offset: number().optional(),
          localityLanguage: string().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "tor-exit-nodes-list", input),
    ),
    validatePhoneNumber: query(
      {
        description: `Validate and format a phone number: country, carrier, line type. countryCode is an optional ISO alpha-2 hint used when the number has no international prefix. ${lang}`,
        input: object({ number: string(), countryCode: string().optional(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "phone-number-validate", input),
    ),
    validatePhoneNumberByIp: query(
      {
        description: `Validate a phone number, using the end user's IP address to infer the country. ${lang}`,
        input: object({ number: string(), ip: string(), localityLanguage: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "phone-number-validate-by-ip", input),
    ),
    verifyEmail: query(
      {
        description: "Verify an email address: format, domain, MX records and disposable-provider status.",
        input: object({ emailAddress: string() }),
      },
      async ({ fetch }, input) => get(fetch, "email-verify", input),
    ),
    userAgentInfo: query(
      {
        description: "Parse a raw User-Agent string into browser, operating system, device type and bot detection.",
        input: object({ userAgentRaw: string() }),
      },
      async ({ fetch }, input) => get(fetch, "user-agent-info", input),
    ),
  });
};

export default defineApp({ user: { accounts: { bigdatacloud: bigdatacloud.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.bigdatacloud ?? [], (account) => bigdatacloudTools(account, signal), { signal }), {
    title: "BigDataCloud",
    description:
      "IP geolocation, reverse geocoding, timezones, ASN and BGP network data, phone and email validation, and IP hazard checks.",
    icons,
  }),
}));

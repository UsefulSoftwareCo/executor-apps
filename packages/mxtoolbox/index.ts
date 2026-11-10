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

const base = "https://api.mxtoolbox.com/api/v1";

const mxtoolbox = defineProvider({
  name: "MXToolbox",
  hosts: ["api.mxtoolbox.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API reference documents 401 for a missing or invalid Authorization key. A DNS lookup is
  // runnable on every plan, so it is used instead of /Usage (whose plan availability is undocumented).
  // The reference's example.com test endpoint needs no key, so a real domain is used to exercise the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/Lookup/a/mxtoolbox.com`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(
      response,
      object({ Passed: array(json()), Failed: array(json()), Warnings: array(json()), Timeouts: array(json()) }),
    );
  },
});

type Account = { fields: { token: string } };

// MxToolbox expects the bare key in Authorization, with no Bearer prefix.
const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

const dnsCommands: Record<string, string> = {
  a: "Resolve A (IPv4) records for a hostname.",
  aaaa: "Resolve AAAA (IPv6) records for a hostname.",
  asn: "Look up the autonomous system number and network owner for an IP address.",
  bimi: "Check the BIMI record and its validity for a domain.",
  dmarc: "Check and validate the DMARC record for a domain.",
  dns: "Check the DNS health of a domain: name servers, SOA consistency and common misconfigurations.",
  "mta-sts": "Check the MTA-STS policy record for a domain.",
  mx: "List MX records for a domain and test that each mail host resolves.",
  ptr: "Reverse DNS (PTR) lookup for an IP address.",
  soa: "Fetch the SOA record for a domain.",
  spf: "Check and validate the SPF record for a domain, including lookup count.",
  tlsrpt: "Check the SMTP TLS reporting (TLS-RPT) record for a domain.",
  txt: "List TXT records for a domain.",
  arin: "Look up ARIN registration (whois) data for an IP address.",
};

const networkCommands: Record<string, string> = {
  blacklist: "Check a domain or IP address against more than 100 DNS blacklists. Uses the network quota.",
  http: "Test an HTTP web server: connectivity, response time and status. Uses the network quota.",
  https: "Test an HTTPS web server including its certificate. Uses the network quota.",
  ping: "Ping a host and report latency. Uses the network quota.",
  smtp: "Test an SMTP mail server: connect, banner, reverse DNS, open relay and TLS. Uses the network quota.",
  trace: "Run a traceroute to a host. Uses the network quota.",
};

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const mxtoolboxTools = (account: Account, signal: AbortSignal) => {
  const lookups = Object.fromEntries([
    ...Object.entries({ ...dnsCommands, ...networkCommands }).map(([command, description]) => {
      const key = command.replace(/-/g, "_");
      return [
        key,
        query(
          {
            description: `${description} Returns Passed, Warnings, Failed and Timeouts check lists. argument is a domain name or IP address.`,
            input: object({ argument: string() }),
          },
          async ({ fetch }, { argument }) =>
            decodeJson(
              await fetch(`${base}/Lookup/${command}/?${search({ argument })}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
      ] as const;
    }),
  ]);
  return router({
    ...lookups,
    dkim: query(
      {
        description:
          "Check a DKIM record for a domain and selector. Uses the DNS quota. Returns Passed, Warnings, Failed and Timeouts check lists.",
        input: object({ domain: string(), selector: string() }),
      },
      async ({ fetch }, { domain, selector }) =>
        decodeJson(
          await fetch(`${base}/Lookup/dkim/?${search({ argument: `${domain}:${selector}` })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    tcp: query(
      {
        description:
          "Test whether a TCP port is open on a host. Uses the network quota. Returns Passed, Warnings, Failed and Timeouts check lists.",
        input: object({ argument: string(), port: number() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/Lookup/tcp/?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    lookup: query(
      {
        description:
          "Run any MxToolbox lookup by command name (a, aaaa, arin, asn, bimi, blacklist, dkim, dmarc, dns, http, https, mta-sts, mx, ping, ptr, smtp, soa, spf, tcp, tlsrpt, trace, txt). For dkim use domain:selector as argument; tcp needs port.",
        input: object({ command: string(), argument: string(), port: number().optional() }),
      },
      async ({ fetch }, { command, ...input }) =>
        decodeJson(
          await fetch(`${base}/Lookup/${encodeURIComponent(command)}/?${search(input)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    usage: query(
      {
        description:
          "Show today's consumed and maximum DNS and network requests (DnsRequests, DnsMax, NetworkRequests, NetworkMax). Quotas reset at 00:00 UTC.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/Usage`, { signal, headers: headers(account) }), json()),
    ),
    listMonitors: query(
      {
        description:
          "List monitors with their current status, failing and warning checks and tags. Optional filters: command (lookup type), name (monitored domain or IP) and tag. Requires a paid API key.",
        input: object({ command: string().optional(), name: string().optional(), tag: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/Monitor?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getMonitor: query(
      {
        description: "Get one monitor by its MonitorUID. Returns an array holding the monitor. Requires a paid API key.",
        input: object({ monitorUid: string() }),
      },
      async ({ fetch }, { monitorUid }) =>
        decodeJson(
          await fetch(`${base}/Monitor/${encodeURIComponent(monitorUid)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listMonitorTags: query(
      {
        description: "List the tags attached to a monitor (Name, UID, IsHidden, IsNegative, MonitorCount). Requires a paid API key.",
        input: object({ monitorUid: string() }),
      },
      async ({ fetch }, { monitorUid }) =>
        decodeJson(
          await fetch(`${base}/Monitor/${encodeURIComponent(monitorUid)}/Tag`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { mxtoolbox: mxtoolbox.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mxtoolbox ?? [], (account) => mxtoolboxTools(account, signal), { signal }), {
    title: "MXToolbox",
    description:
      "Run MxToolbox DNS, email-authentication (SPF, DKIM, DMARC), blacklist and network lookups, read monitors and check API usage.",
    icons,
  }),
}));

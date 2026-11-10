import {
  accountRouter,
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

const base = "https://api.ip2proxy.com/";

const ip2proxy = defineProvider({
  name: "IP2Proxy",
  hosts: ["api.ip2proxy.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The credit check is free and needs only a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}?${new URLSearchParams({ key: account.fields.token, check: "1" })}`, { signal });
    // The vendor documents neither the credit-check body nor the error body. An invalid key
    // returns HTTP 200 with a JSON `null` for check=1 (and {"response":"Invalid API key..."} on
    // lookups), so reject non-objects and any `response` field that is not "OK".
    const body = await decodeJson(response, json());
    if (typeof body !== "object" || body === null) throw new Error("IP2Proxy rejected the API key.");
    const status = (body as { response?: unknown }).response;
    if (typeof status === "string" && status !== "OK") throw new Error(`IP2Proxy: ${status}`);
  },
});

type Account = { fields: { token: string } };

const ip2proxyTools = (account: Account, signal: AbortSignal) =>
  router({
    detectProxy: query(
      {
        description:
          "Check whether an IPv4 or IPv6 address is an anonymizing proxy. Returns isProxy, proxyType (VPN, TOR, DCH data center, PUB public proxy, WEB web proxy, SES search engine robot, RES residential proxy) and creditsConsumed. package (PX1 to PX11, default PX1) selects how much detail comes back and costs that many credits per query: PX2 adds country, PX3 region and city, PX4 ISP, PX5 domain, PX6 usage type, PX7 ASN, PX8 last seen, PX9 threat, PX10 provider, PX11 adds residential proxy detection.",
        input: object({ ip: string(), package: string().optional() }),
      },
      async ({ fetch }, { ip, package: pkg }) =>
        decodeJson(
          await fetch(
            `${base}?${new URLSearchParams({ ip, key: account.fields.token, format: "json", ...(pkg ? { package: pkg } : {}) })}`,
            { signal },
          ),
          json(),
        ),
    ),
    checkCredits: query(
      {
        description: "Return the remaining query credits on the API key. The figure lags real usage by about 10 minutes. Consumes no credits.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}?${new URLSearchParams({ key: account.fields.token, check: "1" })}`, { signal }), json()),
    ),
  });

export default defineApp({ user: { accounts: { ip2proxy: ip2proxy.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ip2proxy ?? [], (account) => ip2proxyTools(account, signal), { signal }), {
    title: "IP2Proxy",
    description: "Detect VPNs, Tor exit nodes, public and residential proxies, data centers and search engine robots by IP address, and check remaining credits.",
    icons,
  }),
}));

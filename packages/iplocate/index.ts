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

const base = "https://iplocate.io/api/lookup";

const iplocate = defineProvider({
  name: "IPLocate",
  hosts: ["iplocate.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Looking up a public address is read-only and needs a valid key (401 otherwise).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/8.8.8.8?include=ip`, {
      signal,
      headers: { "X-API-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ ip: string() }));
  },
});

type Account = { fields: { token: string } };

const iplocateTools = (account: Account, signal: AbortSignal) =>
  router({
    lookup: query(
      {
        description:
          "Look up an IPv4 or IPv6 address: country, city, coordinates, time zone, postal code, currency, ASN, company, hosting provider, privacy flags (VPN, proxy, Tor, relay, abuser) and abuse contact. Omit ip to look up the caller's own address. include is an optional comma-separated list of top-level fields to return (for example country,city,privacy,asn).",
        input: object({ ip: string().optional(), include: string().optional() }),
      },
      async ({ fetch }, { ip, include }) => {
        const url = new URL(ip === undefined ? base : `${base}/${encodeURIComponent(ip)}`);
        if (include !== undefined) url.searchParams.set("include", include);
        return decodeJson(
          await fetch(url.toString(), {
            signal,
            headers: { "X-API-Key": account.fields.token, Accept: "application/json" },
          }),
          json(),
        );
      },
    ),
  });

export default defineApp({ user: { accounts: { iplocate: iplocate.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.iplocate ?? [], (account) => iplocateTools(account, signal), { signal }), {
    title: "IPLocate",
    description: "Look up geolocation, ASN, company, privacy, hosting and abuse contact data for IP addresses.",
    icons,
  }),
}));

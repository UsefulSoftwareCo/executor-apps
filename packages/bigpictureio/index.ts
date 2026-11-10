import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  decodeJson,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const companyBase = "https://company.bigpicture.io";
const ipBase = "https://ip.bigpicture.io";

const bigpictureio = defineProvider({
  name: "BigPicture.io",
  hosts: ["company.bigpicture.io", "ip.bigpicture.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint. A lookup with an empty domain is rejected with the documented
  // 400 bad_request after the key is checked (401 for a bad key), so 400 is the only healthy status.
  // 402 (plan quota exhausted) also fails: no tool can work without quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${companyBase}/v1/companies/find?domain=`, {
      signal,
      headers: { Authorization: account.fields.token },
    });
    if (response.status === 400) return;
    if (response.status === 401) throw new Error("BigPicture rejected the API key (401)");
    if (response.status === 402) throw new Error("BigPicture plan quota exhausted (402)");
    throw new Error(`BigPicture health check failed with status ${response.status}`);
  },
});

type Account = { fields: { token: string } };

const get = async (
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  account: Account,
  url: string,
) => {
  const response = await fetch(url, { signal, headers: { Authorization: account.fields.token } });
  // Applied to every GET, though the vendor documents the empty 202 only for company find.
  // 202 means the lookup is still processing; surface it as data rather than an error.
  if (response.status === 202) return { pending: true, message: "Lookup is still processing; retry shortly." };
  return decodeJson(response, json());
};

const bigpictureioTools = (account: Account, signal: AbortSignal) =>
  router({
    findCompany: query(
      {
        description:
          "Find a company profile by domain (for example stripe.com): name, description, category, location, employees, revenue estimates, tech stack, social handles. May return a pending result (HTTP 202) while BigPicture builds the profile; retry shortly, or use streamCompany.",
        input: object({ domain: string({ minLength: 1 }) }),
      },
      async ({ fetch }, { domain }) =>
        get(fetch, signal, account, `${companyBase}/v1/companies/find?domain=${encodeURIComponent(domain)}`),
    ),
    streamCompany: query(
      {
        description:
          "Find a company profile by domain, holding the request open until BigPicture finishes (up to about 200 seconds) instead of returning a pending result. Limited to 5 requests per minute.",
        input: object({ domain: string({ minLength: 1 }) }),
      },
      async ({ fetch }, { domain }) =>
        get(fetch, signal, account, `${companyBase}/v1/companies/find/stream?domain=${encodeURIComponent(domain)}`),
    ),
    findCompanyByIp: query(
      {
        description:
          "Identify the company behind an IPv4 or IPv6 address: IP type (business, isp or hosting), confidence, geolocation, whois, ASN and the company profile.",
        input: object({ ip: string({ minLength: 1 }) }),
      },
      async ({ fetch }, { ip }) =>
        get(fetch, signal, account, `${ipBase}/v2/companies/ip?ip=${encodeURIComponent(ip)}`),
    ),
  });

export default defineApp(
  { user: { accounts: { bigpictureio: bigpictureio.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.bigpictureio ?? [], (account) => bigpictureioTools(account, signal), { signal }),
      {
        title: "BigPicture.io",
        description: "Company profiles by domain and company identification by IP address.",
        icons,
      },
    ),
  }),
);

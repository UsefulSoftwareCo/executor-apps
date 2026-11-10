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

const base = "https://api.verifi.email/v1";

const verifiEmail = defineProvider({
  name: "Verifi.Email",
  hosts: ["api.verifi.email"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Verifi.Email has no account or key-info endpoint, so the health check validates one address
  // (it counts against the monthly quota). Only 401 means a bad key; 402/429 are quota or rate limits.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/validate`);
    url.searchParams.set("token", account.fields.token);
    url.searchParams.set("email", "health@example.com");
    const response = await fetch(url.toString(), { signal });
    if (response.status === 401) throw new Error("Verifi.Email rejected the API key (401)");
  },
});

type Fetch = typeof fetch;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: "GET" | "POST", path: string, params: Record<string, string>, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("token", token);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };

  return router({
    validateEmail: query(
      {
        description:
          "Validate one email address. Returns overall validity plus syntax, MX, spoofing and disposable-address signals. Malformed addresses are returned as invalid. Counts against the plan's monthly quota.",
        input: object({ email: string({ minLength: 1 }) }),
      },
      async (_ctx, { email }) => call("GET", "/validate", { email }),
    ),
    validateEmails: query(
      {
        description:
          "Validate several email addresses in one request (the vendor allows 1 to 10) and return one result per input in order. Counts against the plan's monthly quota. Avoid duplicates.",
        input: object({ emails: array(string({ minLength: 1 })) }),
      },
      async (_ctx, { emails }) => call("POST", "/bulk/check", {}, { emails }),
    ),
    checkDomainHealth: query(
      {
        description:
          "Check a domain's SPF, DKIM, DMARC and BIMI configuration and return protocol scores with recommendations. domain is bare (no scheme, path or www). selector is the DKIM selector, for example google for Google Workspace or default for others; omit it to let the provider infer one. Read-only despite using POST.",
        input: object({ domain: string({ minLength: 1 }), selector: string().optional() }),
      },
      async (_ctx, { domain, selector }) =>
        call("POST", "/domain/check", selector === undefined ? { domain } : { domain, selector }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { verifiEmail: verifiEmail.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.verifiEmail ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Verifi.Email",
        description: "Validate email addresses (single or batches of up to 10) and check a domain's SPF, DKIM, DMARC and BIMI setup.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.44api.dev";

const api44 = defineProvider({
  name: "44API",
  hosts: ["api.44api.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /webhook/core/health is unauthenticated, so it cannot check the key. Listing the whitelist is
  // read-only and authenticated. Only 401 means a bad key: a plan-gated response (Free/Starter) is not one.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/webhook/ip-whitelist`, {
      method: "POST",
      signal,
      headers: { "X-API-Key": account.fields.token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    });
    if (response.status === 401) throw new Error("44API rejected the API key (401)");
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, body: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "X-API-Key": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    validateVatNumber: query(
      {
        description:
          "Validate a VAT or tax ID for one country. countryCode is an ISO 2-letter code (Greece is EL; GB, CH, NO, AU ABN, NZ NZBN, TR, UA and others are supported). The country prefix on vatNumber is optional. Company name and address are returned on Starter and above where the registry provides them; Free returns basic validation. Germany, Spain and Switzerland return validity only. Canada (CA) is not supported by this tool: the vendor requires a company name for it and the API schema does not list CA. Results are cached for 7 days. Counts against the plan's monthly quota.",
        input: object({ vatNumber: string({ minLength: 1 }), countryCode: string({ minLength: 2 }) }),
      },
      async (_ctx, { vatNumber, countryCode }) => call("/webhook/validate-vat", { vatNumber, countryCode }),
    ),
    ipWhitelist: router(
      {
        list: query(
          { description: "List the IP addresses on the account's whitelist. Pro plan and above.", input: object({}) },
          async () => call("/webhook/ip-whitelist", { action: "list" }),
        ),
        add: mutation(
          {
            description:
              "Add an IPv4 or IPv6 address to the account's whitelist. Requires email verification at the given address. Pro plan and above.",
            input: object({ ipAddress: string({ minLength: 1 }), email: string({ minLength: 3 }) }),
          },
          async (_ctx, { ipAddress, email }) => call("/webhook/ip-whitelist", { action: "add", ipAddress, email }),
        ),
        remove: mutation(
          {
            description: "Remove an IP address from the account's whitelist. Pro plan and above.",
            input: object({ ipAddress: string({ minLength: 1 }) }),
          },
          async (_ctx, { ipAddress }) => call("/webhook/ip-whitelist", { action: "remove", ipAddress }),
        ),
      },
      { title: "IP whitelist", description: "Restrict API key use to approved IP addresses (Pro plan and above)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { api44: api44.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.api44 ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "44API",
        description: "Validate VAT and tax IDs in 50+ countries with company details, and manage the account IP whitelist.",
        icons,
      },
    ),
  }),
);

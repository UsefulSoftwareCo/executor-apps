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

const base = "https://api.minelead.io/v1";

const minelead = defineProvider({
  name: "Minelead",
  hosts: ["api.minelead.io"],
  auth: {
    // Created in the Minelead dashboard; sent as the "key" query parameter.
    apiKey: secrets({
      label: "API key",
      fields: object({ key: string({ minLength: 1 }) }),
      request: ({ key }) => query("key", key),
    }),
  },
  // Minelead documents no account or credit endpoint. The cheapest documented call is detect-disposable (1 credit);
  // it answers 200 with status "success" for a valid key and status "error" (Unauthorized Access) for a bad one.
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/detect-disposable/`);
    url.searchParams.set("email", "healthcheck@example.com");
    const response = await fetch(account.url(url.toString()), { signal });
    const body = await decodeJson(response, object({ status: string() }));
    if (body.status === "error") throw new Error("Minelead rejected the API key");
  },
});

type Params = Record<string, string | number | boolean | undefined>;

function lookups(
  account: { url(url: string): string; headers(): Record<string, string> },
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
) {
  const get = async (path: string, params: Params) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) target.searchParams.set(key, String(value));
    }
    const response = await fetcher(account.url(target.toString()), { signal, headers: account.headers() });
    return decodeJson(response, json());
  };

  return router({
    search: query(
      {
        description:
          "Domain search: all professional emails found for a company domain, with quality scores and the email pattern. Set enrich for job title, location and industry (up to 10 emails). Set deep for AI deep search of employees (5 credits plus 2 per verified email). Consumes credits.",
        input: object({
          domain: string({ minLength: 1 }),
          enrich: boolean().optional(),
          deep: boolean().optional(),
          max_deep_results: number().optional(),
        }),
      },
      async (_ctx, input) => get("/search/", input),
    ),
    find: query(
      {
        description: "Find one person's professional email from first name, last name and company domain. Consumes credits.",
        input: object({ firstname: string({ minLength: 1 }), lastname: string({ minLength: 1 }), domain: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/find/", input),
    ),
    validate: query(
      {
        description:
          "Verify an email in real time: format, MX records, SMTP mailbox existence and webmail detection. Status is success, catch-all or error.",
        input: object({ email: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/validate/", input),
    ),
    enrich: query(
      {
        description:
          "Enrich a lead with job title, company, location, industry, bio and social profiles. Pass email, or name plus company (a domain). Consumes credits.",
        input: object({ email: string().optional(), name: string().optional(), company: string().optional() }),
      },
      async (_ctx, input) => {
        if (!input.email && !(input.name && input.company)) throw new Error("Pass email, or both name and company");
        return get("/enrich/", input);
      },
    ),
    buyingIntent: query(
      {
        description:
          "Buying intent report for a company (company name and primary domain are both required to avoid ambiguous matches): hiring, funding, expansion, executive hires and more, with intent score, level, signals and recommended solutions to pitch. Takes about 15 seconds. Consumes credits.",
        input: object({ company: string({ minLength: 1 }), domain: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/buying-intent/", input),
    ),
    socialEmailFinder: query(
      {
        description: "Find emails for a YouTube channel or Twitter/X profile URL, grouped by the company domain. Consumes credits.",
        input: object({ url: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/social-email-finder/", input),
    ),
    detectDisposable: query(
      {
        description: "Detect disposable or throwaway email addresses, with a disposability score and business or personal domain type.",
        input: object({ email: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => get("/detect-disposable/", input),
    ),
  });
}

export default defineApp(
  { user: { accounts: { minelead: minelead.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.minelead ?? [], (account) => lookups(account, fetch, signal), { signal }),
      {
        title: "Minelead",
        description:
          "Find and verify professional emails with Minelead: domain search, find by name, verification, lead enrichment, buying intent, social email finder and disposable email detection.",
        icons,
      },
    ),
  }),
);

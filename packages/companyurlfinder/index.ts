import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  ProviderError,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.companyurlfinder.com/v2/services";

const companyUrlFinder = defineProvider({
  name: "Company URL Finder",
  hosts: ["api.companyurlfinder.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint and every successful lookup spends a credit. Send a lookup
  // with an empty domain instead: the key is checked first (401 when wrong) and the empty value is
  // then rejected as invalid data (422) before any record is found, so no credit is spent.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/domain_to_name`, {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.token, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ domain: "" }),
    });
    if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
    if (response.status >= 500) throw new ProviderError({ reason: "unavailable", status: response.status });
  },
});

const Result = object({
  status: number(),
  code: number(),
  data: object({ exists: boolean() }),
});

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (path: string, form: Record<string, string>) => {
    const response = await fetcher(`${base}/${path}`, {
      method: "POST",
      signal,
      headers: { "x-api-key": token, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form),
    });
    // The response body carries more fields (domain, company_name, linkedin_url, remaining_credits);
    // decode the guaranteed ones for validation and return the whole body.
    await decodeJson(response.clone(), Result);
    return (await response.json()) as unknown;
  };
}

export default defineApp(
  { user: { accounts: { companyUrlFinder: companyUrlFinder.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.companyUrlFinder ?? [],
        (account) => {
          const call = client(account.fields.token, fetch, signal);
          return router({
            companyNameToDomain: query(
              {
                description:
                  "Find a company's website domain from its name. countryCode (for example US or CH) restricts results to that country. Costs 1 credit per record found.",
                input: object({ companyName: string({ minLength: 1 }), countryCode: string({ minLength: 2 }) }),
              },
              async (_ctx, { companyName, countryCode }) =>
                call("name_to_domain", { company_name: companyName, country_code: countryCode }),
            ),
            domainToCompanyName: query(
              {
                description: "Find a company's name from its domain, for example ibm.com. Costs 1 credit per record found.",
                input: object({ domain: string({ minLength: 1 }) }),
              },
              async (_ctx, { domain }) => call("domain_to_name", { domain }),
            ),
            companyToLinkedinUrl: query(
              {
                description:
                  "Find a company's LinkedIn company-page URL from its name or domain. Costs 1 credit per record found.",
                input: object({ query: string({ minLength: 1 }) }),
              },
              async (_ctx, { query: q }) => call("name_to_linkedin", { query: q }),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Company URL Finder",
        description: "Find company domains, company names and LinkedIn company-page URLs from a name or domain.",
        icons,
      },
    ),
  }),
);

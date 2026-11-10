import {
  accountRouter,
  array,
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
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.rocketreach.co/api/v2";

const rocketreach = defineProvider({
  name: "RocketReach",
  hosts: ["api.rocketreach.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The account endpoint is free and reports plan and credit usage.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/`, {
      signal,
      headers: { "Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ id: number(), state: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "Api-Key": account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const lookupType = "standard, premium, premium (feeds disabled), bulk, phone or enrich";
const identify =
  "Identify the person by id, linkedin_url, linkedin_ext_url, email, npi_number, phone, or name together with current_employer (title narrows it).";

const searchQueryDoc =
  "query is the PersonQuery object: each key is an array of strings, for example { current_title: [\"Product Manager\"], company_domain: [\"rocketreach.co\"], geo: [\"United States\"], management_levels: [\"Director\"], department: [\"Engineering\"], skills: [\"Python\"], company_size: [\"51-200\"], email_grade: \"A\", contact_method: [\"email\"] }. Other keys: name, employer, previous_employer, school, degree, major, keyword, keywords, state, company_industry, company_name, company_id, company_funding_min/max, company_revenue, company_intent, company_news_signal, job_change_signal, years_experience, id, link, phone, domain, email and more. ";
const companyQueryDoc =
  "query is the CompanyQuery object: each key is an array of strings, for example { name: [\"RocketReach\"], domain: [\"rocketreach.co\"], industry: [\"Software\"], employees: [\"51-200\"], geo: [\"United States\"], revenue: [\"1-10M\"], techstack: [\"Salesforce\"], total_funding: [\"1000000-5000000\"], keyword: [\"sales\"] }. Other keys: location, naics_code, sic_code, publicly_traded, growth, intent, news_signal, job_posting_signal, id, link. ";
const paging = "start counts from 1 (max 10000); page_size is 1-100 (default 10). order_by is relevance, popularity or score. Searching does not consume credits.";

const lookupFields = {
  id: number().optional(),
  name: string().optional(),
  current_employer: string().optional(),
  title: string().optional(),
  email: string().optional(),
  linkedin_url: string().optional(),
  linkedin_ext_url: string().optional(),
  npi_number: number().optional(),
  phone: string().optional(),
  return_cached_emails: boolean().optional(),
  webhook_id: number().optional(),
};
const companyLookupInput = object({
  id: number().optional(),
  domain: string().optional(),
  name: string().optional(),
  linkedin_url: string().optional(),
  ticker: string().optional(),
});
const searchInput = object({
  query: json(),
  start: number().optional(),
  page_size: number().optional(),
  order_by: string().optional(),
});

const rocketreachTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = search(params);
    return decodeJson(await fetch(`${base}${path}${qs ? `?${qs}` : ""}`, { signal, headers: headers(account) }), json());
  };
  const post = async (fetch: typeof globalThis.fetch, path: string, body: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(account), "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );

  return router(
    {
      account: query(
        { description: "Get the account: id, state, credit_usage and rate_limits.", input: object({}) },
        async ({ fetch }) => get(fetch, "/account/"),
      ),
      universalAccount: query(
        { description: "Get the account's Universal Credits plan, credit usage (by action and total) and rate limits. The account API key is deliberately not returned.", input: object({}) },
        async ({ fetch }, _input) => {
          // Decode only declared fields: the raw response contains the account's own api_key, which must never reach tool output.
          const response = await fetch(`${base}/universal/account/`, { signal, headers: headers(account) });
          return decodeJson(
            response,
            object({ plan: json(), credit_usage_by_action: json(), credit_usage: json(), rate_limits: json() }),
          );
        },
      ),
      personSearch: query(
        {
          description: `Search RocketReach profiles. Returns profile ids, names, titles, employers and locations without contact details; use personLookup for those. ${searchQueryDoc}${paging}`,
          input: searchInput,
        },
        async ({ fetch }, input) => post(fetch, "/person/search", input),
      ),
      companySearch: query(
        {
          description: `Search companies. ${companyQueryDoc}${paging}`,
          input: searchInput,
        },
        async ({ fetch }, input) => post(fetch, "/searchCompany", input),
      ),
      companyLookup: query(
        {
          description:
            "Get full details for one company by domain, id, name, ticker or linkedin_url. Consumes a company export credit.",
          input: companyLookupInput,
          approval: always(),
        },
        async ({ fetch }, input) => get(fetch, "/company/lookup/", input),
      ),
      personLookup: query(
        {
          description: `Get a person's emails and phone numbers. ${identify} Consumes export credits. The lookup is asynchronous: the result may be status "searching"; poll personCheckStatus with the profile id, or pass a webhook_id. lookup_type (${lookupType}) selects the data tier.`,
          input: object({ ...lookupFields, lookup_type: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) => get(fetch, "/person/lookup", input),
      ),
      personCheckStatus: query(
        {
          description: "Check the status of one or more person lookups by profile id. Returns each profile with its lookup status (complete, searching, failed...).",
          input: object({ ids: array(number()) }),
        },
        async ({ fetch }, { ids }) => {
          const qs = ids.map((id) => `ids=${id}`).join("&");
          return decodeJson(await fetch(`${base}/person/checkStatus?${qs}`, { signal, headers: headers(account) }), json());
        },
      ),
      bulkLookup: query(
        {
          description:
            "Start lookups for 1-100 people in one request. queries is an array of lookup criteria objects such as { linkedin_url } or { name, current_employer } (also id, email, title, npi_number, phone). profile_list names the list the results are added to; webhook_id receives results on completion, otherwise poll personCheckStatus. Consumes credits for each person.",
          input: object({ queries: array(json()), profile_list: string().optional(), webhook_id: number().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) => post(fetch, "/bulkLookup", input),
      ),
      personAndCompanyLookup: query(
        {
          description: `Look up a person's contact details and their current company's full details in one call. ${identify} The person side is asynchronous (poll personCheckStatus); the company side resolves immediately. Consumes credits for the person lookup and the company lookup. lookup_type is one of ${lookupType}.`,
          input: object({ ...lookupFields, lookup_type: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) => get(fetch, "/profile-company/lookup", input),
      ),
      emailVerify: query(
        {
          description:
            "Verify whether one email address can receive mail: checks format, domain and probes the mailbox. Charges one email verification credit, refunded when the result is unknown or the address is malformed.",
          input: object({ email: string() }),
          approval: always(),
        },
        async ({ fetch }, input) => post(fetch, "/email/verify/", input),
      ),
      universal: router(
        {
          personSearch: query(
            {
              description: `Search profiles under Universal Credits. Consumes 1 Universal Credit per page of results. ${searchQueryDoc}${paging.replace(" Searching does not consume credits.", "")}`,
              input: searchInput,
              approval: always(),
            },
            async ({ fetch }, input) => post(fetch, "/universal/person/search", input),
          ),
          companySearch: query(
            {
              description: `Search companies under Universal Credits. Consumes 2 Universal Credits per page of results. ${companyQueryDoc}${paging.replace(" Searching does not consume credits.", "")}`,
              input: searchInput,
              approval: always(),
            },
            async ({ fetch }, input) => post(fetch, "/universal/company/search", input),
          ),
          companyLookup: query(
            {
              description: "Get full details for one company by domain, id, name, ticker or linkedin_url, billed in Universal Credits.",
              input: companyLookupInput,
              approval: always(),
            },
            async ({ fetch }, input) => get(fetch, "/universal/company/lookup", input),
          ),
          personLookup: query(
            {
              description: `Look up a person under Universal Credits. ${identify} Choose what to reveal, and pay for, with the reveal_* flags: reveal_professional_email, reveal_personal_email, reveal_phone, reveal_detailed_person_enrichment, reveal_healthcare_enrichment. At least one reveal_* flag must be true or the call returns no data. Accounts without Universal Credit access get 403. The lookup may be asynchronous; poll universal.personCheckStatus.`,
              input: object({
                ...lookupFields,
                reveal_professional_email: boolean().optional(),
                reveal_personal_email: boolean().optional(),
                reveal_phone: boolean().optional(),
                reveal_detailed_person_enrichment: boolean().optional(),
                reveal_healthcare_enrichment: boolean().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) => get(fetch, "/universal/person/lookup", input),
          ),
          personBulkLookup: query(
            {
              description:
                "Start Universal Credits lookups for 10-100 people (use universal.personLookup for fewer than 10). queries is an array of lookup objects (id, name, current_employer, title, email, linkedin_url, npi_number, phone, reveal_* flags). profile_list names the destination list; webhook_id receives results on completion.",
              input: object({ queries: array(json()), profile_list: string().optional(), webhook_id: number().optional() }),
              approval: always(),
            },
            async ({ fetch }, input) => post(fetch, "/universal/person/bulk_lookup", input),
          ),
          personCheckStatus: query(
            {
              description: "Check the status of one or more Universal Credits person lookups by profile id.",
              input: object({ ids: array(number()) }),
            },
            async ({ fetch }, { ids }) => {
              const qs = ids.map((id) => `ids=${id}`).join("&");
              return decodeJson(await fetch(`${base}/universal/person/check_status?${qs}`, { signal, headers: headers(account) }), json());
            },
          ),
        },
        { title: "Universal Credits", description: "Search and lookup endpoints billed in RocketReach Universal Credits." },
      ),
    },
    {},
  );
};

export default defineApp({ user: { accounts: { rocketreach: rocketreach.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.rocketreach ?? [], (account) => rocketreachTools(account, signal), { signal }), {
    title: "RocketReach",
    description:
      "Find and verify professional contact details: people and company search, person and company lookup, bulk lookup, Universal Credits endpoints and email verification.",
    icons,
  }),
}));

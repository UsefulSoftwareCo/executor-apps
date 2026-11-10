import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.icypeas.com/api";

const icypeas = defineProvider({
  name: "Icypeas",
  hosts: ["app.icypeas.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing bulk-search files is free and read-only; Icypeas answers a bad key with 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/search-files/read`, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 1 }),
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

// Icypeas takes the raw API key in Authorization, with no "Bearer" prefix.
const headers = (account: Account) => ({ Authorization: account.fields.token, "Content-Type": "application/json" });

const post = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  body: unknown,
) =>
  decodeJson(
    await fetch(`${base}${path}`, { method: "POST", signal, headers: headers(account), body: JSON.stringify(body) }),
    json(),
  );

const get = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  params: Record<string, string>,
) =>
  decodeJson(
    await fetch(`${base}${path}?${new URLSearchParams(params).toString()}`, { signal, headers: headers(account) }),
    json(),
  );

const custom = object({
  webhookUrl: string().optional(),
  externalId: string().optional(),
});

const sortCursor = array(json());

const icypeasTools = (account: Account, signal: AbortSignal) =>
  router({
    findEmail: mutation(
      {
        description:
          "Start an asynchronous email search for one person. Give firstname and/or lastname (at least one) and domainOrCompany (a domain or a company name). Returns an item _id with status NONE; fetch the result with getSearchResult until the status is terminal (see getSearchResult): DEBITED or FOUND means a hit (1 credit), NOT_FOUND or DEBITED_NOT_FOUND means no hit. Optional custom.webhookUrl and custom.externalId. For many people use bulkSearch.",
        input: object({
          firstname: string(),
          lastname: string(),
          domainOrCompany: string(),
          custom: custom.optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/email-search", input),
    ),
    verifyEmail: mutation(
      {
        description:
          "Start an asynchronous verification of one email address (0.1 credit). Returns an item _id; fetch the outcome and certainty with getSearchResult. Optional custom.webhookUrl and custom.externalId.",
        input: object({ email: string(), custom: custom.optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/email-verification", input),
    ),
    scanDomain: mutation(
      {
        description:
          "Start an asynchronous scan of a domain or company name for role-based addresses (contact@, sales@ ...). Returns an item _id; fetch the result with getSearchResult. Optional custom.webhookUrl and custom.externalId.",
        input: object({ domainOrCompany: string(), custom: custom.optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/domain-search", input),
    ),
    bulkSearch: mutation(
      {
        description:
          "Launch a bulk job of up to 5000 rows. task is email-search (rows [firstname, lastname, domainOrCompany]; either name may be an empty string), email-verification (rows [email]) or domain-search (rows [domainOrCompany]). name labels the bulk. custom.externalIds, if given, must match data in length. Returns the file id; follow progress with listBulkFiles and read items with listSearchResults.",
        input: object({
          name: string(),
          task: string(),
          data: array(array(string())),
          custom: object({
            webhookUrlItem: string().optional(),
            webhookUrlBulkDone: string().optional(),
            externalIds: array(string()).optional(),
            includeResultsInWebhook: boolean().optional(),
          }).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/bulk-search", input),
    ),
    getSearchResult: query(
      {
        description:
          "Fetch one search item by the _id returned from findEmail, verifyEmail or scanDomain. Statuses NONE, SCHEDULED and IN_PROGRESS mean poll again. Terminal statuses: FOUND and DEBITED (result found, DEBITED means charged), NOT_FOUND and DEBITED_NOT_FOUND (finished with no hit), BAD_INPUT (invalid request), INSUFFICIENT_FUNDS (no credits), ABORTED (cancelled). Poll gently: rate limits apply.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) => post(fetch, account, signal, "/bulk-single-searchs/read", { id }),
    ),
    listSearchResults: query(
      {
        description:
          "List search items, newest first. mode single lists individual searches (optionally filtered by type: email-search, domain-scan or email-verification); mode bulk lists the items of one bulk, requires file, and cannot use type. limit defaults to 10, maximum 100. For the next page set next true and send back the sorts cursor from the previous response.",
        input: object({
          mode: string(),
          id: string().optional(),
          file: string().optional(),
          type: string().optional(),
          limit: number().optional(),
          next: boolean().optional(),
          sorts: sortCursor.optional(),
        }),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/bulk-single-searchs/read", input),
    ),
    listBulkFiles: query(
      {
        description:
          "List bulk-search files with progress and stats. Filter by file id or status (in_progress or done); limit defaults to 10, maximum 50. Poll this until a bulk is done, then read its items with listSearchResults.",
        input: object({
          file: string().optional(),
          status: string().optional(),
          limit: number().optional(),
          next: boolean().optional(),
          sorts: sortCursor.optional(),
        }),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/search-files/read", input),
    ),
    getSubscription: query(
      {
        description:
          "Get the subscription, remaining credits and user id for an account. email must be the email of the account that owns the API key.",
        input: object({ email: string() }),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/a/actions/subscription-information", input),
    ),
    scrapeProfile: mutation(
      {
        description:
          "Scrape one LinkedIn profile by URL (1.5 credits when found). The call can return a job id; read the data with listSearchResults or listBulkFiles as the Icypeas docs describe.",
        input: object({ url: string() }),
        approval: always(),
      },
      async ({ fetch }, { url }) => get(fetch, account, signal, "/scrape/profile", { url }),
    ),
    scrapeCompany: mutation(
      {
        description:
          "Scrape one LinkedIn company page by URL (0.5 credit when found). The call can return a job id; read the data with listSearchResults or listBulkFiles.",
        input: object({ url: string() }),
        approval: always(),
      },
      async ({ fetch }, { url }) => get(fetch, account, signal, "/scrape/company", { url }),
    ),
    bulkScrape: mutation(
      {
        description: "Scrape up to 50 LinkedIn profile or company URLs at once. type is profile or company.",
        input: object({ type: string(), data: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/scrape", input),
    ),
    findProfileUrl: mutation(
      {
        description:
          "Find a person's LinkedIn profile URL from firstname, lastname and a company or domain and/or job title (1 credit when found). At least one of companyOrDomain and jobTitle is required.",
        input: object({
          firstname: string(),
          lastname: string(),
          companyOrDomain: string().optional(),
          jobTitle: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/url-search/profile", input),
    ),
    findCompanyUrl: mutation(
      {
        description: "Find a company's LinkedIn URL from its name or domain (1 credit when found).",
        input: object({ companyOrDomain: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/url-search/company", input),
    ),
    bulkFindUrls: mutation(
      {
        description:
          "Find up to 50 LinkedIn URLs at once. type is profile (each data item has firstname, lastname and companyOrDomain and/or jobTitle) or company (each item has companyOrDomain).",
        input: object({
          type: string(),
          data: array(
            object({
              firstname: string().optional(),
              lastname: string().optional(),
              companyOrDomain: string().optional(),
              jobTitle: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/url-search", input),
    ),
    reverseEmailLookup: mutation(
      {
        description: "Find the LinkedIn profile behind one professional email address (10 credits per profile found).",
        input: object({ email: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/reverse-email-lookup", input),
    ),
    bulkReverseEmailLookup: mutation(
      {
        description:
          "Reverse-lookup 2 to 50 professional email addresses at once. Results come back in the response rather than in the background (10 credits per profile found).",
        input: object({ data: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/reverse-email-lookups", input),
    ),
    countPeople: query(
      {
        description:
          "Count lead-database people matching a query, free of charge. query holds filters: Include/Exclude filters are { include: [...], exclude: [...] } (up to 200 values) for firstname, lastname, currentJobTitle, pastJobTitle, school, languages, skills, location, profileLocation, workLocation, keyword, currentCompanyName, currentCompanyId, currentCompanyWebsite, currentCompanyUrn, pastCompanyName (and the other past* and current* company filters, e.g. \"currentCompany.industry\", \"currentCompany.type\"); Range filters are { \">=\": n, \"<=\": n } for totalYearsOfExperience, timeInCurrentCompany, \"currentCompany.headcount\", \"currentCompany.revenue\"; headcountGrowth filters are { min, max, timespan: 6months|12months|24months }.",
        input: object({ query: json() }),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/find-people/count", input),
    ),
    findPeople: mutation(
      {
        description:
          "Search the lead database for people (spends credits). Takes the same query filters as countPeople; run countPeople first. pagination is optional: size 1-200 (default 100) and the token from the previous response, sent back with the identical query for the next page. Tokens expire.",
        input: object({
          query: json(),
          pagination: object({ token: string().optional(), size: number().optional() }).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/find-people", input),
    ),
    countCompanies: query(
      {
        description:
          "Count lead-database companies matching a query, free of charge. Include/Exclude filters ({ include, exclude }, up to 200 values): name, lid (LinkedIn public id), urn, companyId, type (Privately Held, Public Company, Nonprofit ...), industry, location, keyword, domain (bare domain). Range filters ({ \">=\": n, \"<\": n }): headcount, revenue. headcountGrowth is { min, max, timespan: 6months|12months|24months }.",
        input: object({ query: json() }),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/find-companies/count", input),
    ),
    findCompanies: mutation(
      {
        description:
          "Search the lead database for companies (spends credits). Takes the same query filters as countCompanies; run countCompanies first. pagination is optional: size 1-200 (default 100) and the token from the previous response, sent back with the identical query for the next page.",
        input: object({
          query: json(),
          pagination: object({ token: string().optional(), size: number().optional() }).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => post(fetch, account, signal, "/find-companies", input),
    ),
  });

export default defineApp({ user: { accounts: { icypeas: icypeas.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.icypeas ?? [], (account) => icypeasTools(account, signal), { signal }), {
    title: "Icypeas",
    description:
      "Find and verify professional emails, scan domains, scrape LinkedIn profiles and companies, reverse-lookup emails and search the Icypeas lead database.",
    icons,
  }),
}));

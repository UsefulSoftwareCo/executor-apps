import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Read-only POST operations (search, lookup, enrichment, reference data). Async/bulk job creators
// and list writes stay mutations. Keyed by generated name without the kind: no operationIds.
const readOnlyPosts = [
  "companyEnrichment.postCompaniesEnrich",
  "companyEnrichment.postCompaniesEnrichBatch",
  "companySearch.postCompaniesSearch",
  "companySearch.postCompaniesSearchPreview",
  "companySearch.postCompaniesSearchCount",
  "companySearch.postCompaniesSearchScroll",
  "companySimilar.postCompaniesSimilar",
  "companySimilar.postCompaniesSimilarPreview",
  "companySimilar.postCompaniesSimilarCount",
  "companySimilar.postCompaniesSimilarScroll",
  "peopleSearch.postPeopleLookup",
  "peopleSearch.postPeopleSearch",
  "peopleSearch.postPeopleSearchScroll",
  "geo.postCountries",
  "geo.postStates",
  "geo.postCities",
];
const kinds = Object.fromEntries(readOnlyPosts.map((name) => [name, "query" as const]));

const companyenrich = defineProvider({
  name: "CompanyEnrich",
  hosts: ["api.companyenrich.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /me is free and returns the key's credits and capabilities.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.companyenrich.com/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ userId: string({ minLength: 1 }) }));
  },
});

export default defineApp(
  { user: { accounts: { companyenrich: companyenrich.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.companyenrich ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account, kinds }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CompanyEnrich",
        description: "Enrich and search companies and people with CompanyEnrich: enrichment, search, similar companies, emails, lists and reference data.",
        icons,
      },
    ),
  }),
);

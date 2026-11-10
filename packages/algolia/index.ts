import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  abtestingOptions,
  analyticsOptions,
  ingestionOptions,
  insightsOptions,
  monitoringOptions,
  personalizationOptions,
  querySuggestionsOptions,
  recommendOptions,
  searchOptions,
} from "./openapi.js";

const appIdPattern = /^[A-Za-z0-9]{6,20}$/;
const regionPattern = /^(us|eu)$/;

type Fields = { appId: string; region: string };

function applicationId(account: { fields: { appId: string } }) {
  const appId = account.fields.appId.trim();
  if (!appIdPattern.test(appId)) throw new Error("Enter your Algolia Application ID, for example ERBSOWZO32.");
  return appId;
}

function region(account: { fields: { region: string } }) {
  const value = account.fields.region.trim().toLowerCase();
  if (!regionPattern.test(value)) throw new Error("Enter the region of your Algolia application: us or eu.");
  return value;
}

// Search and Recommend run on the application's own host; Analytics, A/B Testing, Insights and Monitoring on
// global hosts; Ingestion, Personalization and Query Suggestions on a regional host.
// Application IDs are upper case; a URL's host is lower case, and allowedOrigin must match it.
const origins = {
  search: (account: { fields: Fields }) => `https://${applicationId(account).toLowerCase()}.algolia.net`,
  recommend: (account: { fields: Fields }) => `https://${applicationId(account).toLowerCase()}.algolia.net`,
  analytics: () => "https://analytics.algolia.com",
  abtesting: () => "https://analytics.algolia.com",
  insights: () => "https://insights.algolia.io",
  monitoring: () => "https://status.algolia.com",
  ingestion: (account: { fields: Fields }) => `https://data.${region(account)}.algolia.com`,
  personalization: (account: { fields: Fields }) => `https://personalization.${region(account)}.algolia.com`,
  querySuggestions: (account: { fields: Fields }) => `https://query-suggestions.${region(account)}.algolia.com`,
};

const algolia = defineProvider({
  name: "Algolia",
  hosts: [
    "*.algolia.net",
    "analytics.algolia.com",
    "insights.algolia.io",
    "status.algolia.com",
    "data.us.algolia.com",
    "data.eu.algolia.com",
    "personalization.us.algolia.com",
    "personalization.eu.algolia.com",
    "query-suggestions.us.algolia.com",
    "query-suggestions.eu.algolia.com",
  ],
  auth: {
    apiKey: secrets({
      label: "Application ID, region and API key",
      fields: object({
        appId: plain(string({ minLength: 1 })),
        region: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  // A key can always read itself, whatever its ACL.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origins.search(account)}/1/keys/${account.fields.apiKey}`, {
      signal,
      headers: {
        "x-algolia-application-id": applicationId(account),
        "x-algolia-api-key": account.fields.apiKey,
      },
    });
    await decodeJson(response, object({ value: string() }));
    return { accountInfo: { externalId: applicationId(account), displayName: applicationId(account) } };
  },
});

export default defineApp(
  { user: { accounts: { algolia: algolia.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.algolia ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          const mount = <K extends keyof typeof origins>(
            key: K,
            options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">,
          ) => {
            const base = origins[key](account);
            return approve(
              liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            );
          };
          return router(
            {
              search: mount("search", searchOptions),
              recommend: mount("recommend", recommendOptions),
              analytics: mount("analytics", analyticsOptions),
              abtesting: mount("abtesting", abtestingOptions),
              insights: mount("insights", insightsOptions),
              monitoring: mount("monitoring", monitoringOptions),
              ingestion: mount("ingestion", ingestionOptions),
              personalization: mount("personalization", personalizationOptions),
              querySuggestions: mount("querySuggestions", querySuggestionsOptions),
            },
            { title: "Algolia", description: "Algolia application." },
          );
        },
        { signal },
      ),
      {
        title: "Algolia",
        description:
          "Algolia. search: indices, records, settings, synonyms, rules, API keys, dictionaries, clusters. recommend: recommendations and Recommend rules. analytics: search and click metrics. abtesting: A/B tests. insights: click, conversion and view events. monitoring: cluster status and incidents. ingestion: sources, destinations, tasks, transformations. personalization: strategy and user profiles. querySuggestions: Query Suggestions configurations.",
        icons,
      },
    ),
  }),
);

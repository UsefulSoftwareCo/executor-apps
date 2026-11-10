import {
  accountRouter,
  boolean,
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

const base = "https://www.klazify.com/api";

const klazify = defineProvider({
  name: "Klazify",
  hosts: ["www.klazify.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Klazify has no current-account endpoint; the taxonomy listing is a read-only authenticated GET.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/list-category/v1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json", "User-Agent": "executor" },
    });
    await decodeJson(response, json());
  },
});

const url = object({ url: string({ minLength: 1 }) });

export default defineApp(
  { user: { accounts: { klazify: klazify.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.klazify ?? [],
        (account) => {
          const call = async (method: "GET" | "POST", path: string, body?: Record<string, unknown>) =>
            decodeJson(
              await fetch(`${base}${path}`, {
                method,
                signal,
                headers: {
                  Authorization: `Bearer ${account.fields.token}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "User-Agent": "executor",
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
              }),
              json(),
            );
          // Lookups are POSTs in Klazify's API but do not change anything, so they are queries.
          const lookup = (path: string, description: string) =>
            query({ description, input: url }, async (_ctx, { url }) => call("POST", path, { url }));
          return router({
            categorize: lookup(
              "/categorize",
              "Classify a website into IAB categories with confidence scores, plus social links and logo. Consumes API credits.",
            ),
            realTimeCategorization: query(
              {
                description:
                  "Classify a URL. Returns the last saved classification; set refresh to re-crawl and reclassify live.",
                input: object({ url: string({ minLength: 1 }), refresh: boolean().optional() }),
              },
              async (_ctx, { url, refresh }) =>
                call("POST", "/real_time_categorization", { url, ...(refresh ? { refresh: "true" } : {}) }),
            ),
            iabCategories: lookup("/domain_iab_categories", "IAB Content Taxonomy v1 and v3 category mappings for a domain."),
            company: lookup("/domain_company", "Company data for a domain: name, location, employee range, revenue, tags."),
            techStack: lookup("/domain_tech", "Technologies detected on a domain's website."),
            logo: lookup("/domain_logo", "Hosted logo URL for a domain."),
            socialMedia: lookup("/domain_social_media", "Social media profile links found on a domain."),
            domainExpiration: lookup("/domain_expiration", "Domain registration age and expiration dates."),
            similarDomains: lookup("/similar_domain", "Competitor and similar websites for a domain."),
            trafficIntelligence: lookup(
              "/domain_traffic_intelligence",
              "Traffic analytics for a domain: rank, monthly visits, engagement, sources and top countries.",
            ),
            listCategories: query(
              {
                description: "List the category taxonomy. version is v1 or v2.",
                input: object({ version: string({ minLength: 2 }) }),
              },
              async (_ctx, { version }) => call("GET", `/list-category/${encodeURIComponent(version)}`),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Klazify",
        description:
          "Klazify website classification API: IAB categories, company data, logos, tech stack, social links, traffic and domain expiration for any domain.",
        icons,
      },
    ),
  }),
);

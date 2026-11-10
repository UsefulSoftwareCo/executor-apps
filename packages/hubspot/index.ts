import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { sources } from "./openapi.js";

const Details = object({ portalId: number() });

// Requested as optional scopes. HubSpot drops optional scopes the chosen account cannot use, but an
// optional scope that is NOT configured as Optional in the public app's Auth settings makes the
// install fail ("mismatch between the scopes in the install URL and the app's configured scopes").
// So the public app must list every scope below as Optional (and only "oauth" as Required). Strings
// were checked against HubSpot's scope reference. Private app tokens need none of this.
const optionalScopes = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.objects.companies.read",
  "crm.objects.companies.write",
  "crm.objects.deals.read",
  "crm.objects.deals.write",
  "crm.objects.owners.read",
  "crm.objects.leads.read",
  "crm.objects.leads.write",
  "crm.objects.line_items.read",
  "crm.objects.line_items.write",
  "crm.objects.quotes.read",
  "crm.objects.quotes.write",
  "crm.objects.invoices.read",
  "crm.objects.orders.read",
  "crm.objects.orders.write",
  "crm.objects.appointments.read",
  "crm.objects.appointments.write",
  "crm.objects.courses.read",
  "crm.objects.courses.write",
  "crm.objects.listings.read",
  "crm.objects.listings.write",
  "crm.objects.services.read",
  "crm.objects.services.write",
  "crm.objects.projects.read",
  "crm.objects.projects.write",
  "crm.objects.custom.read",
  "crm.objects.custom.write",
  "crm.objects.users.read",
  "crm.objects.users.write",
  "crm.objects.goals.read",
  "crm.objects.marketing_events.read",
  "crm.objects.marketing_events.write",
  "crm.lists.read",
  "crm.lists.write",
  "crm.import",
  "crm.export",
  "crm.pipelines.orders.read",
  "crm.pipelines.orders.write",
  "crm.schemas.contacts.read",
  "crm.schemas.contacts.write",
  "crm.schemas.companies.read",
  "crm.schemas.companies.write",
  "crm.schemas.deals.read",
  "crm.schemas.deals.write",
  "crm.schemas.custom.read",
  "tickets",
  "e-commerce",
  "content",
  "forms",
  "files",
  "automation",
  "timeline",
  "conversations.read",
  "conversations.write",
  "communication_preferences.read",
  "communication_preferences.write",
  "transactional-email",
  "business-intelligence",
  "settings.users.read",
  "settings.users.write",
  "settings.currencies.read",
  "settings.currencies.write",
  "sales-email-read",
  "scheduler.meetings.meeting-link.read",
  "cms.domains.read",
  "cms.knowledge_base.articles.read",
];

const hubspot = defineProvider({
  name: "HubSpot",
  hosts: ["api.hubapi.com"],
  auth: {
    token: secrets({
      label: "Private app access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // HubSpot has no dynamic registration: the connect page asks for a public app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.hubspot.com/oauth/authorize",
      // Current date-versioned endpoint (client_secret_post, params in the form body). The legacy
      // /oauth/v1/token is deprecated by HubSpot on 2027-02-16.
      tokenUrl: "https://api.hubapi.com/oauth/2026-03/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["oauth"],
      authorizationParams: { optional_scope: optionalScopes.join(" ") },
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.hubapi.com/account-info/v3/details", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const details = await decodeJson(response, Details);
    return { accountInfo: { externalId: String(details.portalId) } };
  },
});

export default defineApp(
  { user: { accounts: { hubspot: hubspot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hubspot ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(sources).map(([key, options]) => [
                key,
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "HubSpot",
        description:
          "HubSpot CRM objects, associations, lists, marketing, CMS, conversations, files, automation and account APIs.",
        icons,
      },
    ),
  }),
);

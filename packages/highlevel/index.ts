import {
  accountRouter,
  bearer,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  ProviderError,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const origin = "https://services.leadconnectorhq.com";

const Location = object({ location: object({ id: string() }) });

const highlevel = defineProvider({
  name: "HighLevel",
  hosts: ["services.leadconnectorhq.com"],
  auth: {
    // A Private Integration Token belongs to one sub-account (or the agency); the sub-account id is used to check it.
    token: secrets({
      label: "Private Integration Token",
      fields: object({ token: string({ minLength: 1 }), locationId: plain(string({ minLength: 1 })) }),
    }),
    // Create the app in the HighLevel Marketplace (Developer) and choose the scopes there.
    oauth: oauth2({
      authorizationUrl: "https://marketplace.gohighlevel.com/oauth/chooselocation",
      tokenUrl: "https://services.leadconnectorhq.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "adPublishing.readonly",
        "adPublishing.write",
        "affiliate-manager.readonly",
        "agent-studio.readonly",
        "agent-studio.write",
        "associations.readonly",
        "associations.write",
        "associations/relation.readonly",
        "associations/relation.write",
        "blogs/author.readonly",
        "blogs/category.readonly",
        "blogs/check-slug.readonly",
        "blogs/list.readonly",
        "blogs/post-update.write",
        "blogs/post.write",
        "blogs/posts.readonly",
        "brand-boards/design-kit.readonly",
        "brand-boards/design-kit.write",
        "businesses.readonly",
        "businesses.write",
        "calendars.readonly",
        "calendars.write",
        "calendars/events.readonly",
        "calendars/events.write",
        "calendars/groups.readonly",
        "calendars/groups.write",
        "calendars/resources.readonly",
        "calendars/resources.write",
        "campaigns.readonly",
        "charges.readonly",
        "charges.write",
        "companies.readonly",
        "contacts.readonly",
        "contacts.write",
        "conversation-ai.readonly",
        "conversation-ai.write",
        "conversations.readonly",
        "conversations.write",
        "conversations/livechat.write",
        "conversations/message.readonly",
        "conversations/message.write",
        "custom-menu-link.readonly",
        "custom-menu-link.write",
        "emails/builder.readonly",
        "emails/builder.write",
        "emails/schedule.readonly",
        "forms.readonly",
        "forms.write",
        "funnels/redirect.readonly",
        "funnels/redirect.write",
        "invoices.readonly",
        "invoices.write",
        "invoices/estimate.readonly",
        "invoices/estimate.write",
        "invoices/schedule.readonly",
        "invoices/schedule.write",
        "invoices/template.readonly",
        "invoices/template.write",
        "links.readonly",
        "links.write",
        "locations.readonly",
        "locations.write",
        "locations/customFields.readonly",
        "locations/customFields.write",
        "locations/customValues.readonly",
        "locations/customValues.write",
        "locations/tags.readonly",
        "locations/tags.write",
        "locations/tasks.readonly",
        "locations/templates.readonly",
        "medias.readonly",
        "medias.write",
        "numberpools.read",
        "objects/record.readonly",
        "objects/record.write",
        "objects/schema.readonly",
        "objects/schema.write",
        "opportunities.readonly",
        "opportunities.write",
        "payments/coupons.readonly",
        "payments/coupons.write",
        "payments/custom-provider.readonly",
        "payments/custom-provider.write",
        "payments/integration.readonly",
        "payments/integration.write",
        "payments/orders.collectPayment",
        "payments/orders.readonly",
        "payments/orders.write",
        "payments/subscriptions.readonly",
        "payments/transactions.readonly",
        "phonenumbers.read",
        "phonenumbers.write",
        "products.readonly",
        "products.write",
        "products/collection.readonly",
        "products/collection.write",
        "products/prices.readonly",
        "products/prices.write",
        "socialplanner/account.readonly",
        "socialplanner/category.readonly",
        "socialplanner/csv.write",
        "socialplanner/oauth.readonly",
        "socialplanner/post.readonly",
        "socialplanner/post.write",
        "surveys.readonly",
        "users.readonly",
        "users.write",
        "voice-ai-agent-goals.readonly",
        "voice-ai-agent-goals.write",
        "voice-ai-agents.readonly",
        "voice-ai-agents.write",
        "voice-ai-dashboard.readonly",
        "workflows.readonly",
      ],
      response: object({
        access_token: string(),
        userType: string().optional(),
        locationId: string().optional(),
        companyId: string().optional(),
      }),
      request: ({ access_token }) => bearer(access_token),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    let path: string;
    if (account.method === "token") {
      path = `/locations/${encodeURIComponent(account.fields.locationId.trim())}`;
    } else {
      // The token response names the installed sub-account (userType "Location", locationId) or agency (userType "Company", companyId).
      const { userType, locationId, companyId } = account.fields;
      if (userType === "Company" && companyId) path = `/companies/${encodeURIComponent(companyId)}`;
      else if (locationId) path = `/locations/${encodeURIComponent(locationId)}`;
      else throw new ProviderError({ reason: "unauthorized", status: 401 });
    }
    const response = await fetch(`${origin}${path}`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" },
    });
    if (path.startsWith("/companies/")) {
      await decodeJson(response, object({}));
      return { accountInfo: { externalId: decodeURIComponent(path.slice("/companies/".length)) } };
    }
    const { location } = await decodeJson(response, Location);
    return { accountInfo: { externalId: location.id } };
  },
});

export default defineApp(
  { user: { accounts: { highlevel: highlevel.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.highlevel ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(apis).map(([key, options]) => [
                key,
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ) as { [K in keyof typeof apis]: ReturnType<typeof withApprovals> },
            { title: "HighLevel", description: "HighLevel sub-account or agency." },
          ),
        { signal },
      ),
      {
        title: "HighLevel",
        description:
          "HighLevel (GoHighLevel) CRM. Contacts, conversations and messages, calendars and appointments, opportunities and pipelines, invoices, payments, products, workflows, forms, funnels, blogs, social planner, voice and conversation AI, locations and users. One router per API area; most calls need a locationId (the sub-account).",
        icons,
      },
    ),
  }),
);

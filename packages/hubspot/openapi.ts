import type { OpenapiToolNamesOptions } from "apps/openapi";
import emptySecurity from "./empty-security.json" with { type: "json" };

// Pinned to a commit so tool names and schemas (and approval policy names) do not shift on upstream merges.
const root =
  "https://raw.githubusercontent.com/HubSpot/HubSpot-public-api-spec-collection/ae6cecf86bb214471cd779a32f23ebda43e1c04e/PublicApiSpecs";

// HubSpot publishes one OpenAPI document per API, all served from https://api.hubapi.com.
// Each becomes its own router. Paths are relative to the public spec collection.
const specs = {
  contacts: "CRM/Contacts/Rollouts/424/v3/contacts.json",
  companies: "CRM/Companies/Rollouts/424/v3/companies.json",
  deals: "CRM/Deals/Rollouts/424/v3/deals.json",
  tickets: "CRM/Tickets/Rollouts/424/v3/tickets.json",
  leads: "CRM/Leads/Rollouts/424/v3/leads.json",
  products: "CRM/Products/Rollouts/424/v3/products.json",
  lineItems: "CRM/Line Items/Rollouts/424/v3/lineItems.json",
  quotes: "CRM/Quotes/Rollouts/424/v3/quotes.json",
  invoices: "CRM/Invoices/Rollouts/424/v3/invoices.json",
  orders: "CRM/Orders/Rollouts/424/v3/orders.json",
  carts: "CRM/Carts/Rollouts/424/v3/carts.json",
  discounts: "CRM/Discounts/Rollouts/424/v3/discounts.json",
  fees: "CRM/Fees/Rollouts/424/v3/fees.json",
  taxes: "CRM/Taxes/Rollouts/424/v3/taxes.json",
  payments: "CRM/Payments/Rollouts/424/v3/payments.json",
  subscriptions: "CRM/Commerce Subscriptions/Rollouts/424/v3/commerceSubscriptions.json",
  contracts: "CRM/Contracts/Rollouts/424/v3/contracts.json",
  services: "CRM/Services/Rollouts/424/v3/services.json",
  listings: "CRM/Listings/Rollouts/424/v3/listings.json",
  courses: "CRM/Courses/Rollouts/424/v3/courses.json",
  appointments: "CRM/Appointments/Rollouts/424/v3/appointments.json",
  projects: "CRM/Projects/Rollouts/260890/v3/projects.json",
  notes: "CRM/Notes/Rollouts/424/v3/notes.json",
  tasks: "CRM/Tasks/Rollouts/424/v3/tasks.json",
  calls: "CRM/Calls/Rollouts/424/v3/calls.json",
  emails: "CRM/Emails/Rollouts/424/v3/emails.json",
  meetings: "CRM/Meetings/Rollouts/424/v3/meetings.json",
  communications: "CRM/Communications/Rollouts/424/v3/communications.json",
  postalMail: "CRM/Postal Mail/Rollouts/424/v3/postalMail.json",
  feedbackSubmissions: "CRM/Feedback Submissions/Rollouts/424/v3/feedbackSubmissions.json",
  goalTargets: "CRM/Goal Targets/Rollouts/424/v3/goalTargets.json",
  users: "CRM/Users/Rollouts/424/v3/users.json",
  objects: "CRM/Objects/Rollouts/424/v3/objects.json",
  customObjects: "CRM/Custom Objects/Rollouts/424/v3/customObjects.json",
  owners: "CRM/Crm Owners/Rollouts/146888/v3/crmOwners.json",
  properties: "CRM/Properties/Rollouts/145899/v3/properties.json",
  propertyValidations: "CRM/Property Validations/Rollouts/215885/v3/propertyValidations.json",
  pipelines: "CRM/Pipelines/Rollouts/145896/v3/pipelines.json",
  schemas: "CRM/Schemas/Rollouts/145900/v3/schemas.json",
  associations: "CRM/Associations/Rollouts/130902/v4/associations.json",
  associationsSchema: "CRM/Associations Schema/Rollouts/130902/v4/associationsSchema.json",
  dealSplits: "CRM/Deal Splits/Rollouts/157885/v3/dealSplits.json",
  forecasts: "CRM/Forecasts/Rollouts/260892/v3/forecasts.json",
  lists: "CRM/Lists/Rollouts/144891/v3/lists.json",
  imports: "CRM/Imports/Rollouts/144903/v3/imports.json",
  exports: "CRM/Exports/Rollouts/95922/v3/exports.json",
  timeline: "CRM/Timeline/Rollouts/147898/v3/timeline.json",
  limitsTracking: "CRM/Limits Tracking/Rollouts/199890/v3/limitsTracking.json",
  objectLibrary: "CRM/Object Library/Rollouts/196908/v3/objectLibrary.json",
  callingExtensions: "CRM/Calling Extensions/Rollouts/145891/v3/callingExtensions.json",
  accountInfo: "Account/Account Info/Rollouts/144923/v3/accountInfo.json",
  auditLogs: "Account/Audit Logs/Rollouts/144923/v3/auditLogs.json",
  actions: "Automation/Actions V4/Rollouts/148901/v4/actionsV4.json",
  workflows: "Automation/Automation V4/Rollouts/144908/v4/automationV4.json",
  sequences: "Automation/Sequences/Rollouts/177891/v4/sequences.json",
  businessUnits: "Business Units/Business Units/Rollouts/140946/v3/businessUnits.json",
  cmsAuthors: "CMS/Authors/Rollouts/635/v3/authors.json",
  cmsBlogSettings: "CMS/Blog Settings/Rollouts/635/v3/blogSettings.json",
  cmsDomains: "CMS/Domains/Rollouts/149894/v3/domains.json",
  cmsHubdb: "CMS/Hubdb/Rollouts/243927/v3/hubdb.json",
  cmsPages: "CMS/Pages/Rollouts/59888/v3/pages.json",
  cmsPosts: "CMS/Posts/Rollouts/635/v3/posts.json",
  cmsSiteSearch: "CMS/Site Search/Rollouts/144890/v3/siteSearch.json",
  cmsSourceCode: "CMS/Source Code/Rollouts/140886/v3/sourceCode.json",
  cmsTags: "CMS/Tags/Rollouts/635/v3/tags.json",
  cmsUrlMappings: "CMS/Url Mappings/Rollouts/149915/v3/urlMappings.json",
  cmsUrlRedirects: "CMS/Url Redirects/Rollouts/149916/v3/urlRedirects.json",
  communicationPreferences: "Communication Preferences/Subscriptions/Rollouts/176901/v4/subscriptions.json",
  conversations: "Conversations/Conversations/Rollouts/54902/v3/conversations.json",
  conversationsInbox: "Conversations/Conversations Inbox & Messages/Rollouts/54902/v3/conversationsInboxMessages.json",
  customChannels: "Conversations/Custom Channels/Rollouts/160898/v3/customChannels.json",
  visitorIdentification: "Conversations/Visitor Identification/Rollouts/140938/v3/visitorIdentification.json",
  events: "Events/Events/Rollouts/147897/v3/events.json",
  eventDefinitions: "Events/Manage Event Definitions/Rollouts/138888/v3/manageEventDefinitions.json",
  eventCompletions: "Events/Send Event Completions/Rollouts/669/v3/sendEventCompletions.json",
  files: "Files/Files/Rollouts/140950/v3/files.json",
  campaigns: "Marketing/Campaigns Public Api/Rollouts/177944/v3/campaignsPublicApi.json",
  forms: "Marketing/Forms/Rollouts/144909/v3/forms.json",
  marketingEmails: "Marketing/Marketing Emails/Rollouts/145892/v3/marketingEmails.json",
  marketingEvents: "Marketing/Marketing Events/Rollouts/129888/v3/marketingEvents.json",
  singleSend: "Marketing/Single-send/Rollouts/106894/v4/singlesend.json",
  transactionalEmail: "Marketing/Transactional Single Send/Rollouts/140892/v3/transactionalSingleSend.json",
  schedulerMeetings: "Scheduler/Meetings/Rollouts/177892/v3/meetings.json",
  multicurrency: "Settings/Multicurrency/Rollouts/145897/v3/multicurrency.json",
  taxRates: "Settings/Tax Rates/Rollouts/207908/v1/taxRates.json",
  userProvisioning: "Settings/User Provisioning/Rollouts/144927/v3/userProvisioning.json",
} as const;

// A private app token and an OAuth access token are both sent as a bearer token. The documents
// name their schemes per operation (oauth2, private_apps and legacy variants), so each is
// declared here as a bearer scheme. The developer API key scheme (developer_hapikey) is for
// developer-account endpoints and is not offered, so operations that accept only it are left out.
const common = {
  allowedOrigin: "https://api.hubapi.com",
  securitySchemes: {
    bearer: { type: "http", scheme: "bearer" },
    oauth2: { type: "http", scheme: "bearer" },
    oauth2_legacy: { type: "http", scheme: "bearer" },
    private_apps: { type: "http", scheme: "bearer" },
    private_apps_legacy: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: ["bearer", "private_apps", "private_apps_legacy", "oauth2", "oauth2_legacy"].map(
      (scheme) => ({ scheme, field: "token", part: "value" as const, prefix: "" }),
    ),
    oauth: ["bearer", "private_apps", "private_apps_legacy", "oauth2", "oauth2_legacy"].map(
      (scheme) => ({ scheme, field: "access_token", part: "value" as const, prefix: "" }),
    ),
  },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

// The CRM object documents mark every operation `security: []` (no authentication), though each one
// needs the token. empty-security.json lists them at the pinned commit (scripts/empty-security.ts);
// these patches give them the bearer requirement back, so the account's token is sent.
const requireToken = (operations: readonly string[]) =>
  operations.map((operation) => ({ op: "add" as const, path: `${operation}/security`, value: [{ bearer: [] }] }));

export const sources: Record<string, OpenapiToolNamesOptions> = Object.fromEntries(
  Object.entries(specs).map(([key, path]) => [
    key,
    {
      ...common,
      source: { url: `${root}/${encodeURI(path)}` },
      ...(Object.hasOwn(emptySecurity, key) ? { patches: requireToken(emptySecurity[key as keyof typeof emptySecurity]) } : {}),
    },
  ]),
);

// scripts/tools.ts checks this one; scripts/count.ts in /tmp counts them all.
export const options = sources.contacts satisfies OpenapiToolNamesOptions;

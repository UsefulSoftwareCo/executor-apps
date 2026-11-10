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

const base = "https://app.retently.com/api/v2";

const retently = defineProvider({
  name: "Retently",
  hosts: ["app.retently.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /ping is a read-only account snapshot available to read keys.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/ping`, { signal, headers: headers(account) });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "X-Api-Key": account.fields.token,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const segment = (value: string) => encodeURIComponent(value);

const paging = {
  page: number().optional(),
  limit: number().optional(),
  sort: string().optional(),
};

const subscriber = object({
  email: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  company: string().optional(),
  tags: array(string()).optional(),
  properties: json().optional(),
});

const retentlyTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  // Write responses may be empty (204) or carry no documented body, so read text and parse only when present.
  const send = (method: "POST" | "DELETE", path: string, body: unknown) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }): Promise<unknown> => {
      const response = await fetch(`${base}${path}`, { method, signal, headers: headers(account), body: JSON.stringify(body) });
      const text = await response.text();
      if (!response.ok) throw new Error(`Retently ${method} ${path} failed with status ${response.status}: ${text.slice(0, 500)}`);
      return text === "" ? { status: response.status } : JSON.parse(text);
    };

  return router({
    ping: query(
      {
        description:
          "Account snapshot: identity, plan, survey credits for the period and usage counters (contacts, feedback, outbox, queue, suppressions).",
        input: object({}),
      },
      get("/ping"),
    ),
    listCustomers: query(
      {
        description:
          "List customers, newest first by default. Filter by email, startDate/endDate (YYYY-MM-DD, ISO 8601 or UNIX seconds) or attributes. Paginated: page from 1, limit up to 1000 (default 20). sort is a field name, prefix with - for descending.",
        input: object({
          email: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/customers${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getCustomer: query(
      { description: "Get one customer by id.", input: object({ customerId: string() }) },
      async (ctx, { customerId }) => get(`/customers/${segment(customerId)}`)(ctx),
    ),
    listCompanies: query(
      {
        description:
          "List companies with industry, tags, NPS/CSAT/CES scores and customer counts. Paginated like customers; sort for example -companyName.",
        input: object({ ...paging }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/companies${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getCompany: query(
      { description: "Get one company by id or domain.", input: object({ companyIdOrDomain: string() }) },
      async (ctx, { companyIdOrDomain }) => get(`/companies/${segment(companyIdOrDomain)}`)(ctx),
    ),
    listFeedback: query(
      {
        description:
          "List survey responses, newest first by default. Filter by email, customerId, campaignId, startDate/endDate (endDate is not expanded to end of day). Paginated: page from 1, limit up to 1000.",
        input: object({
          email: string().optional(),
          customerId: string().optional(),
          campaignId: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/feedback${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getFeedback: query(
      { description: "Get one survey response by id.", input: object({ feedbackId: string() }) },
      async (ctx, { feedbackId }) => get(`/feedback/${segment(feedbackId)}`)(ctx),
    ),
    listOutbox: query(
      {
        description:
          "List sent surveys with delivery status. channel is email, link, inapp, intercom or embed; sentBy is campaign, reminder, manual, test or imported. Dates include the whole final day in the account timezone.",
        input: object({
          email: string().optional(),
          campaignId: string().optional(),
          channel: string().optional(),
          sentBy: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
          ...paging,
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/outbox${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getReports: query(
      {
        description:
          "Campaign reports: trend, delivery stats and rating-question stats. Omit campaignId for all campaigns. Dates are strictly YYYY-MM-DD and endDate is inclusive.",
        input: object({
          campaignId: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
        }),
      },
      async ({ fetch }, { campaignId, ...input }) =>
        decodeJson(
          await fetch(`${base}/reports${campaignId === undefined ? "" : `/${segment(campaignId)}`}${search(input)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    getScore: query(
      {
        description:
          "Latest score, rating distribution and counts for a metric. metric is nps, csat, ces or star.",
        input: object({ metric: string() }),
      },
      async (ctx, { metric }) => get(`/${segment(metric)}/score`)(ctx),
    ),
    listTemplates: query({ description: "List survey templates with names, channels and metrics.", input: object({}) }, get("/templates")),
    getTemplate: query(
      {
        description: "Get one survey template, including surveyQuestions with the stable uuid values needed for importFeedback.",
        input: object({ templateId: string() }),
      },
      async (ctx, { templateId }) => get(`/templates/${segment(templateId)}`)(ctx),
    ),
    listCampaigns: query(
      { description: "List campaigns: name, metric, channel, template and active state. Campaign ids are used by sendSurvey and importFeedback.", input: object({}) },
      get("/campaigns"),
    ),
    listTrendGroups: query({ description: "List trend groups: metric, default flag and created date.", input: object({}) }, get("/trends")),
    getTrends: query(
      {
        description:
          "Trends in a group (groupId may be default): current vs baseline with deltas, trend lines and respondent distributions. date is today, yesterday, past-week, past-month, past-3-months, past-6-months, past-year, this-month-to-date, this-quarter-to-date, this-year-to-date or custom; startDate/endDate (YYYY-MM-DD or ISO 8601) apply only with custom.",
        input: object({
          groupId: string(),
          date: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
        }),
      },
      async ({ fetch }, { groupId, ...input }) =>
        decodeJson(
          await fetch(`${base}/trends/${segment(groupId)}${search(input)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listSuppressedEmails: query({ description: "List suppressed email addresses.", input: object({}) }, get("/suppressions/emails")),
    listSuppressedDomains: query({ description: "List suppressed domain patterns.", input: object({}) }, get("/suppressions/domains")),

    upsertCustomers: mutation(
      {
        description:
          "Create or update up to 1000 customers. Each subscriber needs an email; custom properties go in properties as an array of {label, value, type} objects (any other undeclared key is dropped); unset_properties and unset_tags clear only the listed items. Needs a write key.",
        input: object({
          subscribers: array(
            object({
              email: string(),
              first_name: string().optional(),
              last_name: string().optional(),
              company: string().optional(),
              tags: array(string()).optional(),
              properties: json().optional(),
              unset_properties: array(string()).optional(),
              unset_tags: array(string()).optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/customers", input)(ctx),
    ),
    deleteCustomers: mutation(
      {
        description: "Delete customers and all their data, by email. Irreversible.",
        input: object({ subscribers: array(object({ email: string() })) }),
        approval: always(),
      },
      async (ctx, input) => send("DELETE", "/customers", input)(ctx),
    ),
    unsubscribeCustomers: mutation(
      {
        description: "Unsubscribe customers by email so they no longer receive surveys. message is an optional opt-out message.",
        input: object({ subscribers: array(object({ email: string() })), message: array(string()).optional() }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/customers/unsubscribe", input)(ctx),
    ),
    resubscribeCustomers: mutation(
      {
        description:
          "Resubscribe customers by email. Already-subscribed contacts return already_subscribed; self-unsubscribed and hard-bounced contacts are skipped with a reason.",
        input: object({ subscribers: array(object({ email: string() })) }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/customers/resubscribe", input)(ctx),
    ),
    sendSurvey: mutation(
      {
        description:
          "Queue a transactional email or in-app survey for 1 to 100 subscribers. campaign is the campaign id; delay is in days and overrides campaign scheduling. Custom properties go in each subscriber's properties as an array of {label, value, type} objects.",
        input: object({ campaign: string(), delay: number().optional(), subscribers: array(subscriber) }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/survey", input)(ctx),
    ),
    importFeedback: mutation(
      {
        description:
          "Import up to 200 historical responses into a campaign. Each feedback item needs email and an integer score valid for the campaign metric; optional comment, tags, topics [{name, sentiment}], properties, response_date (ISO 8601), additional_questions [{uuid, type RATING|OPEN_ENDED|MULTIPLE_OPTIONS, answer, metric}]. options: create_customers, update_existing_customers, skip_duplicates, duplicate_check_window (1-365), default_send_date. Items that fail validation are listed in details.failed.",
        input: object({
          campaign_id: string(),
          feedback: array(json()),
          options: json().optional(),
        }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/import", input)(ctx),
    ),
    syncAttributes: mutation(
      {
        description:
          "Re-derive the customer snapshot stored on feedback and outbox records from current profiles. Asynchronous (202, one job per scope). Provide exactly one of customers (ids, max 1000), emails (max 1000) or filters. scope is feedback, outbox or all (default).",
        input: object({
          customers: array(string()).optional(),
          emails: array(string()).optional(),
          filters: json().optional(),
          scope: string().optional(),
        }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/sync-attributes", input)(ctx),
    ),
    setResponseTags: mutation(
      {
        description: "Set tags on a response by id. op append adds to existing tags; leave it empty to overwrite.",
        input: object({ id: string(), tags: array(string()), op: string().optional() }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/response/tags", input)(ctx),
    ),
    setResponseTopics: mutation(
      {
        description:
          "Set topics on a response by id. Each topic has a name and a sentiment (positive, negative or neutral, default neutral). op append adds to existing topics; leave it empty to overwrite.",
        input: object({
          id: string(),
          topics: array(object({ name: string(), sentiment: string().optional() })),
          op: string().optional(),
        }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/response/topics", input)(ctx),
    ),
    deleteFeedback: mutation(
      {
        description:
          "Soft-delete responses and recalculate company scores. Each item has either feedbackId, or email optionally narrowed by campaignId, startDate and endDate.",
        input: object({
          responses: array(
            object({
              feedbackId: string().optional(),
              email: string().optional(),
              campaignId: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async (ctx, input) => send("DELETE", "/feedback", input)(ctx),
    ),
    deleteOutbox: mutation(
      {
        description:
          "Soft-delete outbox records. Each item has either surveyId, or email optionally narrowed by campaignId, startDate and endDate.",
        input: object({
          surveys: array(
            object({
              surveyId: string().optional(),
              email: string().optional(),
              campaignId: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async (ctx, input) => send("DELETE", "/outbox", input)(ctx),
    ),
    suppressEmail: mutation(
      {
        description: "Add an email to the suppression list. Set op to delete to also remove the contact.",
        input: object({ email: string(), note: string().optional(), op: string().optional() }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/suppressions/emails", input)(ctx),
    ),
    unsuppressEmail: mutation(
      {
        description: "Remove a manually added email suppression by id.",
        input: object({ id: string() }),
        approval: always(),
      },
      async (ctx, { id }) => send("DELETE", `/suppressions/emails/${segment(id)}`, undefined)(ctx),
    ),
    suppressDomain: mutation(
      {
        description:
          "Suppress a domain pattern (wildcards allowed, for example *.example.com). category is other (default), corporate, disposable or invalid.",
        input: object({ pattern: string(), category: string().optional(), note: string().optional() }),
        approval: always(),
      },
      async (ctx, input) => send("POST", "/suppressions/domains", input)(ctx),
    ),
    unsuppressDomain: mutation(
      {
        description: "Remove a manually added domain suppression by id.",
        input: object({ id: string() }),
        approval: always(),
      },
      async (ctx, { id }) => send("DELETE", `/suppressions/domains/${segment(id)}`, undefined)(ctx),
    ),
  });
};

export default defineApp({ user: { accounts: { retently: retently.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.retently ?? [], (account) => retentlyTools(account, signal), { signal }), {
    title: "Retently",
    description:
      "Retently customer experience surveys: customers, companies, feedback, campaigns, NPS/CSAT/CES scores, trends, outbox and suppressions.",
    icons,
  }),
}));

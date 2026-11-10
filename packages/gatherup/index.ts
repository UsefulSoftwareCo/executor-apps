import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.gatherup.com/api/v2";

const gatherup = defineProvider({
  name: "GatherUp",
  hosts: ["app.gatherup.com"],
  auth: {
    // GatherUp has no OAuth for customers; every call needs the account's Bearer token plus its Client ID.
    apiKey: secrets({
      label: "API credentials",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/test`);
    url.searchParams.set("clientId", account.fields.clientId);
    const response = await fetch(url.toString(), {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.clientId, displayName: `GatherUp ${account.fields.clientId}` } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(clientId: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  // clientId goes in the query string for GET and in the JSON body for everything else.
  return async (method: Method, path: string, search: Params = {}, body: Params = {}, agent?: string) => {
    const url = new URL(`${base}${path}`);
    const merge = (target: Params): Params => ({ ...target, clientId, ...(agent === undefined ? {} : { agent }) });
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    let init: RequestInit;
    if (method === "GET") {
      for (const [key, value] of Object.entries(merge(search))) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
      init = { method, signal, headers };
    } else {
      // Smart-insight and scorecard writes also read clientId from the query string, so send it in both places.
      for (const [key, value] of Object.entries(merge(search))) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
      init = { method, signal, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(merge(body)) };
    }
    const response = await fetcher(url.toString(), init);
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const agent = string().optional();
const filters = record(json()).optional();
const payload = record(json());

function read(call: Call, path: string, description: string) {
  return query(
    {
      description: `${description} Optional agent selects an agency client; filters go in query.`,
      input: object({ agent, query: filters }),
    },
    async (_ctx, input: { agent?: string; query?: Params }) => call("GET", path, input.query, {}, input.agent),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string) {
  return mutation(
    {
      description: `${description} Optional agent selects an agency client; body holds the request fields from the GatherUp API reference (clientId is added for you).`,
      input: object({ agent, body: payload }),
    },
    async (_ctx, input: { agent?: string; body: Params }) => call(method, path, {}, input.body, input.agent),
  );
}

function build(call: Call) {
  return router({
    test: read(call, "/test", "Check that the API credentials work."),
    businesses: router(
      {
        list: read(call, "/businesses/get", "List businesses. Query: includeDeletedBusinesses, page, limit."),
        get: read(call, "/business/get", "Get one business. Query: businessId."),
        search: read(call, "/business/search", "Find a business id. Query: by (for example extraField), search."),
        types: read(call, "/business/types", "List business types. Query: search."),
        create: write(call, "POST", "/business/create", "Create a business (businessName, businessType, address fields, owner fields, package, language)."),
        update: write(call, "PUT", "/business/update", "Update a business. Body: businessId plus fields to change."),
        delete: write(call, "DELETE", "/business/delete", "Delete a business. Body: businessId."),
        deactivate: write(call, "PUT", "/business/deactivate", "Deactivate a business. Body: businessId."),
        reactivate: write(call, "PUT", "/business/reactivate", "Reactivate a business. Body: businessId."),
        autoFeedbackRequests: write(call, "PUT", "/business/auto-feedback-requests", "Turn automatic feedback requests on or off for a business."),
        onlineReviewLinks: read(call, "/business/online-review-links/get", "Get a business's online review links. Query: businessId."),
        addOnlineReviewLink: write(call, "POST", "/business/online-review-link/add", "Add an online review link to a business."),
        updateOnlineReviewLink: write(call, "PUT", "/business/online-review-link/update", "Update a business's online review link."),
        addNotificationEmail: write(call, "POST", "/business/notifications/email/add", "Add an email address to a business's review notifications."),
        removeNotificationEmail: write(call, "DELETE", "/business/notifications/email/remove", "Remove an email address from a business's review notifications."),
      },
      { title: "Businesses", description: "Locations managed in GatherUp." },
    ),
    customers: router(
      {
        list: read(call, "/customers/get", "List customers. Query: businessId plus optional filters."),
        get: read(call, "/customer/get", "Get one customer. Query: customerId."),
        create: write(call, "POST", "/customer/create", "Create a customer and optionally send a feedback request (businessId, customerEmail, customerFirstName, customerPhone, sendFeedbackRequest, ...)."),
        createMany: write(call, "POST", "/customers/create", "Create several customers at once. Body: businessId and customers array."),
        update: write(call, "PUT", "/customer/update", "Update a customer. Body: customerId plus fields to change."),
        delete: write(call, "DELETE", "/customer/delete", "Delete a customer. Body: customerId."),
        reply: write(call, "POST", "/customer/reply", "Reply to a customer's private feedback."),
      },
      { title: "Customers", description: "Customers who receive feedback requests." },
    ),
    feedback: router(
      {
        list: read(call, "/feedbacks/get", "List private feedback received. Query: customerId, businessId, dates."),
        responses: read(call, "/feedbacks/responses/get", "List feedback responses."),
        requestsCount: read(call, "/feedback-requests/count", "Count feedback requests sent. Query: businessId, from, to (YYYY-MM-DD)."),
        showHideHistory: read(call, "/feedbacks/show-hide-history", "History of feedback shown or hidden."),
        send: write(call, "POST", "/customer/feedback/send", "Send a feedback request to a customer. Body: customerId, ratingRevision, checkThreshold, jobId."),
        update: write(call, "PUT", "/customer/feedback/update", "Update a customer's feedback record. Body: customerId, customerCustomId, customerJobId."),
        surveyAverages: read(call, "/survey-questions/average/get", "Average survey results for a business. Query: businessId, from, to."),
        customerSurveyAnswers: read(call, "/survey-questions/customer/get", "A customer's survey answers. Query: customerId."),
      },
      { title: "Feedback", description: "Private feedback requests, responses and survey results." },
    ),
    reviews: router(
      {
        list: read(call, "/online-reviews/get", "List online reviews received. Query: businessId plus filters."),
        all: read(call, "/online-review/all-reviews", "List all reviews. Query: businessId, page, perPage, order."),
        ratingTypes: read(call, "/online-review/rating-types", "List rating types."),
        overallRating: read(call, "/online-review/overall-rating", "Overall review rating."),
        monthlyCount: read(call, "/online-review/monthly-review-count", "Online reviews by month. Query: businessId."),
        sources: read(call, "/online-review/review-source", "Review counts by source. Query: businessId."),
        facebookRecommendations: read(call, "/facebook-recommendations/get", "Facebook recommendations. Query: businessId."),
        googleQa: read(call, "/google-qa/get", "Google Q&A. Query: businessId."),
        reply: write(call, "POST", "/online-review/reply", "Reply to an online review. Body: reviewId, content."),
      },
      { title: "Online reviews", description: "Reviews collected from public review sites." },
    ),
    widgets: router(
      {
        reviews: read(call, "/widget/get-html", "Get the reviews widget embed HTML. Query: businessId, fullVersion, includeSchemaOrg, widgetType."),
        tagged: read(call, "/widget/tagged/get-html", "Get tag widget embed codes. Query: businessId."),
        popup: read(call, "/widget/popup/get-html", "Get the conversion pop-up embed code. Query: businessId."),
        createTagged: write(call, "POST", "/widget/tagged/create", "Create a tag widget."),
        updateTagged: write(call, "PUT", "/widget/tagged/update", "Update a tag widget."),
      },
      { title: "Widgets", description: "Embeddable review widgets." },
    ),
    insights: router(
      {
        sentiment: read(call, "/insights-report/sentiment", "Sentiment report. Query: type, sentiment, limit."),
        smartInsight: read(call, "/smart-insight", "Get the smart insight. Query: businessId."),
        generateSmartInsight: write(call, "POST", "/smart-insight/generate", "Generate a new smart insight. Body: businessId."),
        smartReply: write(call, "POST", "/smart-reply/generate", "Generate an AI reply suggestion for a review."),
        scorecards: read(call, "/reputation-scorecard/", "List reputation scorecards. Query: page, limit."),
        scorecard: read(call, "/reputation-scorecard/get", "Get a reputation scorecard. Query: uuid."),
        generateScorecard: write(call, "POST", "/reputation-scorecard/generate", "Generate a reputation scorecard."),
        deleteScorecard: mutation(
          {
            description: "Delete a reputation scorecard by uuid.",
            input: object({ uuid: string(), agent }),
          },
          async (_ctx, input: { uuid: string; agent?: string }) => call("DELETE", "/reputation-scorecard/remove", { uuid: input.uuid }, {}, input.agent),
        ),
        reviewDefenseAudit: read(call, "/review-defense/audit/get", "Get a review defense audit. Query: client, businessId."),
        generateReviewDefenseAudit: write(call, "POST", "/review-defense/audit/generate", "Generate a review defense audit."),
      },
      { title: "Insights", description: "Sentiment, smart insights, scorecards and review defense audits." },
    ),
    users: router(
      {
        list: read(call, "/user/managers/get", "List users."),
        find: read(call, "/user/managers/find", "Find a user. Query: email."),
        create: write(call, "POST", "/user/create", "Create a user."),
        createAgencyManager: write(call, "POST", "/user/create-agency-manager", "Create an agency manager."),
        update: write(call, "PUT", "/user/manager/update", "Update a user."),
        updateManagedBusinesses: write(call, "PUT", "/user/update-managed-businesses", "Change which businesses a user manages."),
        deactivate: write(call, "PUT", "/user/deactivate", "Deactivate a user."),
        reactivate: write(call, "PUT", "/user/reactivate", "Reactivate a user."),
      },
      { title: "Users", description: "Dashboard users and agency managers." },
    ),
    agency: router(
      {
        clients: read(call, "/agency/clients", "List agency clients. Query: includeBusinesses."),
        findClientId: read(call, "/agency/find/clientId", "Find the client id for a business. Query: businessId."),
        businesses: read(call, "/agency/businesses/get", "List businesses across the agency. Query: page."),
        createClient: write(call, "POST", "/agency/create-client", "Create a new agency client."),
        moveBusinesses: write(call, "PUT", "/agency/move-businesses", "Move businesses between clients."),
      },
      { title: "Agency", description: "Agency-level account management." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { gatherup: gatherup.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gatherup ?? [],
        (account) =>
          withApprovals(build(client(account.fields.clientId, account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GatherUp",
        description: "Customer feedback and online review management: businesses, customers, feedback requests, reviews, widgets, insights, users and agency clients.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.trustpilot.com/v1";
const invitations = "https://invitations-api.trustpilot.com/v1";
const tokenUrl = "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken";

type Account =
  | { method: "apiKey"; fields: { apiKey: string } }
  | { method: "oauth" | "machine"; fields: { access_token: string } };

const trustpilot = defineProvider({
  name: "Trustpilot",
  hosts: ["api.trustpilot.com", "invitations-api.trustpilot.com"],
  auth: {
    // Public endpoints (business units, reviews, categories, ...) take the API key in an `apikey` header.
    apiKey: secrets({
      label: "API key (public endpoints)",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Business endpoints take a business user's OAuth token. The OAuth client ID is the API key and the
    // client secret is the API secret; Trustpilot requires the redirect URI to be https and registered.
    oauth: oauth2({
      authorizationUrl: "https://authenticate.trustpilot.com",
      tokenUrl,
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
    // Client credentials: a token not tied to a user; pass businessUserId to tools that need one.
    machine: oauth2({
      grant: "client_credentials",
      tokenUrl,
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // Listing supported countries is read-only and needs only the API key. OAuth accounts are not probed.
  async health({ account, fetch, signal }) {
    if (account.method !== "apiKey") return;
    const response = await fetch(`${api}/resources/metadata/countries`, {
      signal,
      headers: { apikey: account.fields.apiKey },
    });
    await decodeJson(response, json());
  },
});

type Params = Record<string, unknown>;
const enc = encodeURIComponent;
const id = string({ minLength: 1 });

function sender(account: Account, signal: AbortSignal | undefined, fetcher: typeof fetch) {
  return async (
    method: string,
    path: string,
    init: { query?: Params; body?: unknown; businessUserId?: string | undefined; host?: string } = {},
  ) => {
    const url = new URL(`${init.host ?? api}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> =
      account.method === "apiKey"
        ? { apikey: account.fields.apiKey }
        : { Authorization: `Bearer ${account.fields.access_token}` };
    if (init.businessUserId !== undefined) headers["x-business-user-id"] = init.businessUserId;
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Trustpilot responded with HTTP ${response.status}: ${text.slice(0, 500)}`);
    if (text.trim() === "") return { ok: true };
    return JSON.parse(text) as Record<string, unknown>;
  };
}
type Send = ReturnType<typeof sender>;

const Q = object({ params: json().optional() });
const reviewParams =
  "params is an object of query parameters, such as stars, language, tagGroup, tagValue, state, orderBy (createdat.asc|createdat.desc|stars.asc|stars.desc|updatedat.asc|updatedat.desc), page, perPage (up to 100), startDateTime, endDateTime, referenceId, referralEmail.";
const asParams = (value: unknown): Params => (value ?? {}) as Params;

const publicTools = (send: Send) => {
  const get = (description: string, path: (i: { id: string }) => string, withParams = false) =>
    query(
      { description, input: object({ id, params: json().optional() }) },
      async (_c, i) => send("GET", path(i), { query: withParams ? asParams(i.params) : {} }),
    );
  const getBare = (description: string, path: string) =>
    query({ description, input: Q }, async (_c, i) => send("GET", path, { query: asParams(i.params) }));
  const post = (description: string, path: (i: { id: string }) => string) =>
    query(
      { description, input: object({ id, body: json() }) },
      async (_c, i) => send("POST", path(i), { body: i.body }),
    );
  return router({
    businessUnits: router(
      {
        search: query(
          {
            description: "Search business units by name or domain. params: query (required), country, page, perPage.",
            input: object({ query: string({ minLength: 1 }), params: json().optional() }),
          },
          async (_c, i) => send("GET", "/business-units/search", { query: { ...asParams(i.params), query: i.query } }),
        ),
        profile: get("Get company profile information for a business unit (id is the business unit ID).", (i) => `/business-units/${enc(i.id)}/profileinfo`),
        webLinks: get("Get the public profile page links of a business unit. params: locale.", (i) => `/business-units/${enc(i.id)}/web-links`, true),
        images: get("Get the profile images of a business unit.", (i) => `/business-units/${enc(i.id)}/images`),
        logo: get("Get the logo of a business unit.", (i) => `/business-units/${enc(i.id)}/images/logo`),
        header: get("Get the header image of a business unit.", (i) => `/business-units/${enc(i.id)}/images/header`),
        promotionBox: get("Get the promotion box of a business unit.", (i) => `/business-units/${enc(i.id)}/images/promotion-box`),
        categories: get("List the categories of a business unit.", (i) => `/business-units/${enc(i.id)}/categories`),
        reviews: get(`List a business unit's public reviews. ${reviewParams}`, (i) => `/business-units/${enc(i.id)}/reviews`, true),
        allReviews: get("List all reviews of a business unit, paginated with params.pageToken.", (i) => `/business-units/${enc(i.id)}/all-reviews`, true),
      },
      { title: "Business units", description: "Company profiles, images, categories and public reviews." },
    ),
    reviews: router(
      {
        latest: getBare("List the latest reviews by language. params: count, language.", "/reviews/latest"),
        get: get("Get one public review.", (i) => `/reviews/${enc(i.id)}`),
        likes: get("Get the likes of a review.", (i) => `/reviews/${enc(i.id)}/likes`),
        webLinks: get("Get the public links of a review. params: locale.", (i) => `/reviews/${enc(i.id)}/web-links`, true),
        deletions: getBare("List review IDs deleted in a date range. params: limit, startDateTime, endDateTime. Delete the returned data from your system.", "/reviews/deletions"),
      },
      { title: "Reviews", description: "Public service reviews." },
    ),
    productReviews: router(
      {
        forBusinessUnit: get("Get product review summary of a business unit.", (i) => `/product-reviews/business-units/${enc(i.id)}`, true),
        reviews: get("List product reviews. params must include skus, productUrls or both, or a single customerProductId; also page, perPage, orderBy, language, stars.", (i) => `/product-reviews/business-units/${enc(i.id)}/reviews`, true),
        attributeSummaries: post("Read attribute summaries for products. body: { skus: string[], locale? }. Read-only.", (i) => `/product-reviews/business-units/${enc(i.id)}/attribute-summaries`),
        batchSummaries: post("Read review summaries for many products. body: { skus: string[] }. Read-only.", (i) => `/product-reviews/business-units/${enc(i.id)}/batch-summaries`),
        importedReviews: get("List imported product reviews. params: sku (list).", (i) => `/product-reviews/business-units/${enc(i.id)}/imported-reviews`, true),
        importedReviewsSummaries: get("Summaries of imported product reviews. params: sku (list).", (i) => `/product-reviews/business-units/${enc(i.id)}/imported-reviews-summaries`, true),
        conversation: get("Get a public product review conversation.", (i) => `/conversations/${enc(i.id)}`),
        deletions: getBare("List product review IDs deleted in a date range. params: limit, startDateTime, endDateTime.", "/product-reviews/deletions"),
      },
      { title: "Product reviews", description: "Public product reviews and summaries." },
    ),
    categories: router(
      {
        list: getBare("List categories. params: country, locale.", "/categories"),
        get: get("Get one category.", (i) => `/categories/${enc(i.id)}`, true),
        businessUnits: get("List business units in a category. params: country, page, perPage, orderBy.", (i) => `/categories/${enc(i.id)}/business-units`, true),
      },
      { title: "Categories", description: "Business categories." },
    ),
    consumers: router(
      {
        get: get("Get a consumer's public profile (id is the consumer ID).", (i) => `/consumers/${enc(i.id)}`),
        profile: get("Get a consumer's profile details.", (i) => `/consumers/${enc(i.id)}/profile`),
        webLinks: get("Get a consumer's public profile links. params: locale.", (i) => `/consumers/${enc(i.id)}/web-links`, true),
        reviews: get("List a consumer's reviews. params: stars, language, page, perPage, orderBy, includeReportedReviews.", (i) => `/consumers/${enc(i.id)}/reviews`, true),
        bulkProfiles: query(
          { description: "Get profiles of many consumers at once. body: { consumerIds: string[] }. Read-only.", input: object({ body: json() }) },
          async (_c, i) => send("POST", "/consumers/profile/bulk", { body: i.body }),
        ),
        validateDisplayName: query(
          { description: "Check whether a display name is valid. body: { displayName }. Read-only.", input: object({ body: json() }) },
          async (_c, i) => send("POST", "/consumers/profile/displayname/validate", { body: i.body }),
        ),
        deletions: getBare("List consumer IDs deleted in a date range. params: limit, startDateTime, endDateTime.", "/consumers/deletions"),
      },
      { title: "Consumers", description: "Reviewer profiles." },
    ),
    resources: router(
      {
        locales: getBare("List supported locales. params: translationLocale.", "/resources/metadata/locales"),
        countries: getBare("List supported countries. params: locale.", "/resources/metadata/countries"),
        images: getBare("List Trustpilot images.", "/resources/images"),
        logos: getBare("List Trustpilot logos.", "/resources/images/logos"),
        icons: getBare("List Trustpilot icons.", "/resources/images/icons"),
        stars: get("Get star images for a rating (id is the star count, 1-5).", (i) => `/resources/images/stars/${enc(i.id)}`),
        starStrings: get("Get star label strings for a rating (id is the star count, 1-5). Use params.locale.", (i) => `/resources/strings/stars/${enc(i.id)}`, true),
      },
      { title: "Resources", description: "Locales, countries and Trustpilot brand images." },
    ),
  });
};

const businessTools = (send: Send) => {
  const bu = object({ businessUnitId: id, businessUserId: string().optional(), params: json().optional() });
  const read = (description: string, path: (i: { businessUnitId: string }) => string, host?: string) =>
    query({ description, input: bu }, async (_c, i) =>
      send("GET", path(i), { query: asParams(i.params), businessUserId: i.businessUserId, ...(host ? { host } : {}) }),
    );
  const write = (
    description: string,
    method: string,
    path: (i: { businessUnitId: string }) => string,
    host?: string,
  ) =>
    mutation(
      { description, input: object({ businessUnitId: id, businessUserId: string().optional(), body: json() }), approval: always() },
      async (_c, i) =>
        send(method, path(i), { body: i.body, businessUserId: i.businessUserId, ...(host ? { host } : {}) }),
    );
  const review = object({ reviewId: id, businessUserId: string().optional() });
  const reviewBody = object({ reviewId: id, businessUserId: string().optional(), body: json() });
  const priv = `/private/business-units`;
  return router({
    reviews: router(
      {
        list: read(`List private reviews of a business unit, including reviewer emails and order IDs. ${reviewParams}`, (i) => `${priv}/${enc(i.businessUnitId)}/reviews`),
        get: query({ description: "Get a private review.", input: review }, async (_c, i) =>
          send("GET", `/private/reviews/${enc(i.reviewId)}`, { businessUserId: i.businessUserId }),
        ),
        reply: mutation(
          { description: "Reply to a review. body: { message, authorBusinessUserId? }.", input: reviewBody, approval: always() },
          async (_c, i) => send("POST", `/private/reviews/${enc(i.reviewId)}/reply`, { body: i.body, businessUserId: i.businessUserId }),
        ),
        deleteReply: mutation(
          { description: "Delete the reply to a review.", input: review, approval: always() },
          async (_c, i) => send("DELETE", `/private/reviews/${enc(i.reviewId)}/reply`, { businessUserId: i.businessUserId }),
        ),
        tags: query({ description: "List the tags of a review.", input: review }, async (_c, i) =>
          send("GET", `/private/reviews/${enc(i.reviewId)}/tags`, { businessUserId: i.businessUserId }),
        ),
        addTags: mutation(
          { description: "Add tags to a review. body: { tags: [{ group, value }] }.", input: reviewBody, approval: always() },
          async (_c, i) => send("POST", `/private/reviews/${enc(i.reviewId)}/tags`, { body: i.body, businessUserId: i.businessUserId }),
        ),
        setTags: mutation(
          { description: "Replace the tags of a review. body: { tags: [{ group, value }] }.", input: reviewBody, approval: always() },
          async (_c, i) => send("PUT", `/private/reviews/${enc(i.reviewId)}/tags`, { body: i.body, businessUserId: i.businessUserId }),
        ),
        removeTag: mutation(
          { description: "Remove one tag from a review.", input: object({ reviewId: id, group: id, value: id, businessUserId: string().optional() }), approval: always() },
          async (_c, i) =>
            send("DELETE", `/private/reviews/${enc(i.reviewId)}/tags`, { query: { group: i.group, value: i.value }, businessUserId: i.businessUserId }),
        ),
        findReviewer: mutation(
          { description: "Ask the reviewer to get in touch (Find Reviewer). body: { message, skipNotificationEmailToBusinessUser? }.", input: reviewBody, approval: always() },
          async (_c, i) => send("POST", `/private/reviews/${enc(i.reviewId)}/find-reviewer`, { body: i.body, businessUserId: i.businessUserId }),
        ),
      },
      { title: "Service reviews", description: "Read, reply to, tag and follow up on service reviews." },
    ),
    invitations: router(
      {
        templates: read("List invitation templates of a business unit.", (i) => `/private/business-units/${enc(i.businessUnitId)}/templates`, invitations),
        sendEmail: write(
          "Send a review invitation by email. body follows Trustpilot's email-invitations schema: { recipientEmail, recipientName, referenceNumber, templateId, locale, senderEmail, senderName, replyTo, preferredSendTime, serviceReviewInvitation?, productReviewInvitation? }.",
          "POST",
          (i) => `/private/business-units/${enc(i.businessUnitId)}/email-invitations`,
          invitations,
        ),
        createLink: write(
          "Generate a review invitation link. body: { email, name, referenceId, locale?, redirectUri?, tags? }.",
          "POST",
          (i) => `/private/business-units/${enc(i.businessUnitId)}/invitation-links`,
          invitations,
        ),
        deleteData: write(
          "Permanently delete invitation data. body: { customerEmails?: string[], deleteOlderThan?: ISO date }. Not reversible.",
          "POST",
          (i) => `/private/business-units/${enc(i.businessUnitId)}/invitation-data/delete`,
          invitations,
        ),
      },
      { title: "Invitations", description: "Send and manage review invitations." },
    ),
    locations: router(
      {
        list: read("List locations of a business unit. params: page, perPage.", (i) => `${priv}/${enc(i.businessUnitId)}/locations`),
        get: query(
          { description: "Get a location by your external ID.", input: object({ businessUnitId: id, customerLocationId: id, businessUserId: string().optional() }) },
          async (_c, i) =>
            send("GET", `${priv}/${enc(i.businessUnitId)}/locations/external-id/${enc(i.customerLocationId)}`, { businessUserId: i.businessUserId }),
        ),
        delete: mutation(
          { description: "Delete a location by your external ID.", input: object({ businessUnitId: id, customerLocationId: id, businessUserId: string().optional() }), approval: always() },
          async (_c, i) =>
            send("DELETE", `${priv}/${enc(i.businessUnitId)}/locations/external-id/${enc(i.customerLocationId)}`, { businessUserId: i.businessUserId }),
        ),
      },
      { title: "Locations", description: "Business unit locations." },
    ),
    products: router(
      {
        list: read("List products of a business unit. params: skus, page, perPage.", (i) => `${priv}/${enc(i.businessUnitId)}/products`),
        upsert: write("Create or update products. body as documented by Trustpilot's products API.", "POST", (i) => `${priv}/${enc(i.businessUnitId)}/products`),
        catalogList: read("List catalog products. params: page, perPage, locale.", (i) => `${priv}/${enc(i.businessUnitId)}/catalog/products`),
        catalogUpsert: write("Create or update catalog products. body as documented by Trustpilot.", "POST", (i) => `${priv}/${enc(i.businessUnitId)}/catalog/products`),
        catalogGet: query(
          { description: "Get one catalog product. params: locale.", input: object({ businessUnitId: id, productId: id, businessUserId: string().optional(), params: json().optional() }) },
          async (_c, i) =>
            send("GET", `${priv}/${enc(i.businessUnitId)}/catalog/products/${enc(i.productId)}`, { query: asParams(i.params), businessUserId: i.businessUserId }),
        ),
        catalogDelete: mutation(
          { description: "Delete a catalog product.", input: object({ businessUnitId: id, productId: id, businessUserId: string().optional() }), approval: always() },
          async (_c, i) =>
            send("DELETE", `${priv}/${enc(i.businessUnitId)}/catalog/products/${enc(i.productId)}`, { businessUserId: i.businessUserId }),
        ),
      },
      { title: "Products", description: "Product catalog." },
    ),
    productReviews: router(
      {
        list: query(
          { description: `List private product reviews of a business unit. ${reviewParams}`, input: bu },
          async (_c, i) =>
            send("GET", `/private/product-reviews/business-units/${enc(i.businessUnitId)}/reviews`, { query: asParams(i.params), businessUserId: i.businessUserId }),
        ),
        summaries: query(
          { description: "Get private product review summaries of a business unit.", input: bu },
          async (_c, i) =>
            send("GET", `/private/product-reviews/business-units/${enc(i.businessUnitId)}/summaries`, { query: asParams(i.params), businessUserId: i.businessUserId }),
        ),
        get: query({ description: "Get a private product review.", input: review }, async (_c, i) =>
          send("GET", `/private/product-reviews/${enc(i.reviewId)}`, { businessUserId: i.businessUserId }),
        ),
        createConversation: mutation(
          { description: "Create a conversation on a product review.", input: review, approval: always() },
          async (_c, i) => send("POST", `/private/product-reviews/${enc(i.reviewId)}/create-conversation`, { businessUserId: i.businessUserId }),
        ),
        invitationLink: write(
          "Create a product review invitation link. body as documented by Trustpilot.",
          "POST",
          (i) => `/private/product-reviews/business-units/${enc(i.businessUnitId)}/invitation-links`,
        ),
        conversation: query(
          { description: "Get a private conversation.", input: object({ conversationId: id, businessUserId: string().optional() }) },
          async (_c, i) => send("GET", `/private/conversations/${enc(i.conversationId)}`, { businessUserId: i.businessUserId }),
        ),
        comment: mutation(
          { description: "Add a comment to a conversation. body: { content, integrationId }.", input: object({ conversationId: id, businessUserId: string().optional(), body: json() }), approval: always() },
          async (_c, i) =>
            send("POST", `/private/conversations/${enc(i.conversationId)}/comments`, { body: i.body, businessUserId: i.businessUserId }),
        ),
        getComment: query(
          { description: "Get a conversation comment.", input: object({ conversationId: id, commentId: id, businessUserId: string().optional() }) },
          async (_c, i) =>
            send("GET", `/private/conversations/${enc(i.conversationId)}/comments/${enc(i.commentId)}`, { businessUserId: i.businessUserId }),
        ),
        updateComment: mutation(
          { description: "Update a conversation comment. body: { content, integrationId }.", input: object({ conversationId: id, commentId: id, businessUserId: string().optional(), body: json() }), approval: always() },
          async (_c, i) =>
            send("PUT", `/private/conversations/${enc(i.conversationId)}/comments/${enc(i.commentId)}`, { body: i.body, businessUserId: i.businessUserId }),
        ),
      },
      { title: "Product reviews", description: "Private product reviews, conversations and invitations." },
    ),
    signup: router(
      {
        domainAvailability: query(
          { description: "Check whether a domain is available for business sign-up. params: domain.", input: Q },
          async (_c, i) => send("GET", "/business-signup/domain-availability", { query: asParams(i.params) }),
        ),
      },
      { title: "Business sign-up", description: "Business sign-up checks." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { trustpilot: trustpilot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.trustpilot ?? [],
        (account) => {
          const send = sender(account as Account, signal, fetch);
          return account.method === "apiKey" ? publicTools(send) : businessTools(send);
        },
        { signal },
      ),
      {
        title: "Trustpilot",
        description:
          "Trustpilot reviews and business units. An API key account reads public data; an OAuth account manages a business's reviews, invitations, locations and products.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.gumroad.com/v2";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Application access tokens and OAuth access tokens are both sent as bearer tokens.
const tokenOf = (account: Account) => (account.method === "oauth" ? account.fields.access_token : account.fields.token);

const gumroad = defineProvider({
  name: "Gumroad",
  hosts: ["api.gumroad.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The REST API's Doorkeeper endpoints (/oauth/authorize, /oauth/token) are not advertised by discovery, so they are declared manually.
    // The .well-known documents on gumroad.com belong to the MCP server; the connect page asks for an OAuth app's client.
    // GET /v2/user accepts any public read scope (view_public or any of the scopes below such as view_profile), so health passes.
    oauth: oauth2({
      authorizationUrl: "https://gumroad.com/oauth/authorize",
      tokenUrl: "https://api.gumroad.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "view_profile",
        "edit_profile",
        "edit_products",
        "edit_emails",
        "view_sales",
        "edit_sales",
        "mark_sales_as_shipped",
        "view_payouts",
        "view_tax_data",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ user: object({ user_id: string() }) }));
    return { accountInfo: { externalId: me.user.user_id } };
  },
});

type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}${path}`);
    if (url.origin !== "https://api.gumroad.com" || !url.pathname.startsWith("/v2/"))
      throw new Error("path must stay under /v2");
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // Retry rate limits (429) a bounded number of times, honoring Retry-After.
    let response = await send();
    for (let attempt = 0; attempt < 3 && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1),
        10_000,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204) return { success: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Query = record(string());
const listInput = object({ query: Query.optional() });
const bodyInput = object({ body: json() });
const queryDoc = " query holds query parameters as strings.";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description}${queryDoc}`, input: listInput }, (_c, { query: q }) =>
      call("GET", path, q ?? {}),
    );
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const create = (path: string, description: string) =>
    mutation({ description: `${description} body holds the request fields.`, input: bodyInput }, (_c, { body }) =>
      call("POST", path, {}, body),
    );
  const update = (path: (i: string) => string, description: string) =>
    mutation(
      { description: `${description} body holds only the changed fields.`, input: object({ id: id(), body: json() }) },
      (_c, { id: i, body }) => call("PUT", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const action = (path: (i: string) => string, description: string, method = "PUT") =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call(method, path(i)));

  // Children of a product, addressed as /products/:productId/<segment>[/:id].
  const children = (segment: string, noun: string, extra: Record<string, unknown> = {}) => {
    const root = (p: string) => `/products/${seg(p)}/${segment}`;
    return router({
      list: query(
        { description: `List a product's ${noun}s.`, input: object({ productId: id() }) },
        (_c, { productId }) => call("GET", root(productId)),
      ),
      get: query(
        { description: `Get one ${noun}.`, input: object({ productId: id(), id: id() }) },
        (_c, { productId, id: i }) => call("GET", `${root(productId)}/${seg(i)}`),
      ),
      create: mutation(
        { description: `Create a ${noun} on a product. body holds the request fields.`, input: object({ productId: id(), body: json() }) },
        (_c, { productId, body }) => call("POST", root(productId), {}, body),
      ),
      update: mutation(
        { description: `Update a ${noun}. body holds only the changed fields.`, input: object({ productId: id(), id: id(), body: json() }) },
        (_c, { productId, id: i, body }) => call("PUT", `${root(productId)}/${seg(i)}`, {}, body),
      ),
      delete: mutation(
        { description: `Delete a ${noun}.`, input: object({ productId: id(), id: id() }) },
        (_c, { productId, id: i }) => call("DELETE", `${root(productId)}/${seg(i)}`),
      ),
      ...extra,
    });
  };

  const user = router(
    {
      get: query({ description: "Get the authenticated seller's profile.", input: object({}) }, () => call("GET", "/user")),
      update: mutation(
        { description: "Update the seller's profile name and bio. Needs the edit_profile scope.", input: object({ name: string().optional(), bio: string().optional() }) },
        (_c, { name, bio }) => call("PUT", "/user", {}, { name, bio }),
      ),
      theme: query({ description: "Get the store theme (colors and font).", input: object({}) }, () => call("GET", "/user/theme")),
      profileLayout: query(
        { description: "Get the default profile layout: tabs and sections. Needs view_profile.", input: object({}) },
        () => call("GET", "/user/profile_layout"),
      ),
      earnings: query(
        { description: "Get the annual earnings summary. Needs the view_tax_data scope (requested for OAuth too); query holds e.g. year.", input: listInput },
        (_c, { query: q }) => call("GET", "/earnings", q ?? {}),
      ),
      taxForms: query(
        { description: "List the seller's tax forms. Needs the view_tax_data scope (requested for OAuth too).", input: listInput },
        (_c, { query: q }) => call("GET", "/tax_forms", q ?? {}),
      ),
    },
    { title: "User", description: "The authenticated seller's profile, theme, earnings and tax forms." },
  );

  const products = router(
    {
      list: list("/products", "List the seller's products. Paginated with page_key from the previous response."),
      get: get((i) => `/products/${seg(i)}`, "Get one product by id."),
      create: create("/products", "Create a product (name, price in cents, description, native_type, tags, files, rich_content...)."),
      update: update((i) => `/products/${seg(i)}`, "Update a product."),
      delete: remove((i) => `/products/${seg(i)}`, "Permanently delete a product."),
      enable: action((i) => `/products/${seg(i)}/enable`, "Publish a product."),
      disable: action((i) => `/products/${seg(i)}/disable`, "Unpublish a product."),
      comps: list("/products/comps", "Find comparable products by query or taxonomy for pricing research."),
      reviews: query(
        { description: "List the reviews shown on a product's page.", input: object({ productId: id() }) },
        (_c, { productId }) => call("GET", `/products/${seg(productId)}/reviews`),
      ),
      skus: query(
        { description: "List the SKUs of a physical product.", input: object({ productId: id() }) },
        (_c, { productId }) => call("GET", `/products/${seg(productId)}/skus`),
      ),
      customFields: children("custom_fields", "custom checkout field"),
      offerCodes: children("offer_codes", "offer code"),
      variantCategories: children("variant_categories", "variant category"),
      variants: router({
        list: query(
          { description: "List the variants in a variant category.", input: object({ productId: id(), variantCategoryId: id() }) },
          (_c, { productId, variantCategoryId }) =>
            call("GET", `/products/${seg(productId)}/variant_categories/${seg(variantCategoryId)}/variants`),
        ),
        get: query(
          { description: "Get one variant.", input: object({ productId: id(), variantCategoryId: id(), id: id() }) },
          (_c, { productId, variantCategoryId, id: i }) =>
            call("GET", `/products/${seg(productId)}/variant_categories/${seg(variantCategoryId)}/variants/${seg(i)}`),
        ),
        create: mutation(
          { description: "Create a variant in a variant category. body holds the request fields (name, price_difference_cents...).", input: object({ productId: id(), variantCategoryId: id(), body: json() }) },
          (_c, { productId, variantCategoryId, body }) =>
            call("POST", `/products/${seg(productId)}/variant_categories/${seg(variantCategoryId)}/variants`, {}, body),
        ),
        update: mutation(
          { description: "Update a variant. body holds only the changed fields.", input: object({ productId: id(), variantCategoryId: id(), id: id(), body: json() }) },
          (_c, { productId, variantCategoryId, id: i, body }) =>
            call("PUT", `/products/${seg(productId)}/variant_categories/${seg(variantCategoryId)}/variants/${seg(i)}`, {}, body),
        ),
        delete: mutation(
          { description: "Delete a variant.", input: object({ productId: id(), variantCategoryId: id(), id: id() }) },
          (_c, { productId, variantCategoryId, id: i }) =>
            call("DELETE", `/products/${seg(productId)}/variant_categories/${seg(variantCategoryId)}/variants/${seg(i)}`),
        ),
      }),
      subscribers: query(
        { description: "List a product's subscribers (memberships). query may hold email, paginated_by or page_key.", input: object({ productId: id(), query: Query.optional() }) },
        (_c, { productId, query: q }) => call("GET", `/products/${seg(productId)}/subscribers`, q ?? {}),
      ),
    },
    { title: "Products", description: "Products and their custom fields, offer codes, variants, SKUs, reviews and subscribers." },
  );

  const sales = router(
    {
      list: list(
        "/sales",
        "List sales. Filters: after and before (YYYY-MM-DD), product_id, email, name, order_id, license_key; paginated with page_key. Needs view_sales.",
      ),
      get: get((i) => `/sales/${seg(i)}`, "Get one sale."),
      summary: list("/sales/summary", "Summarize sales; query holds from, to (YYYY-MM-DD) and group_by."),
      export: create("/sales/exports", "Start a CSV export of sales (from, to, product_id)."),
      markAsShipped: mutation(
        { description: "Mark a sale as shipped, optionally with a tracking URL. Needs mark_sales_as_shipped.", input: object({ id: id(), trackingUrl: string().optional() }) },
        (_c, { id: i, trackingUrl }) => call("PUT", `/sales/${seg(i)}/mark_as_shipped`, {}, { tracking_url: trackingUrl }),
      ),
      refund: mutation(
        { description: "Refund a sale in full, or partially with amountCents. Needs edit_sales.", input: object({ id: id(), amountCents: number().optional() }) },
        (_c, { id: i, amountCents }) => call("PUT", `/sales/${seg(i)}/refund`, {}, { amount_cents: amountCents }),
      ),
      resendReceipt: action((i) => `/sales/${seg(i)}/resend_receipt`, "Resend the purchase receipt to the customer.", "POST"),
      revokeAccess: action((i) => `/sales/${seg(i)}/revoke_access`, "Revoke the buyer's access to the product."),
      undoRevokeAccess: action((i) => `/sales/${seg(i)}/undo_revoke_access`, "Restore the buyer's access to the product."),
    },
    { title: "Sales", description: "Sales, refunds, shipping, receipts and buyer access." },
  );

  const subscribers = router(
    {
      get: get((i) => `/subscribers/${seg(i)}`, "Get one subscriber (membership) by id."),
    },
    { title: "Subscribers", description: "Individual subscribers." },
  );

  const payouts = router(
    {
      list: list("/payouts", "List payouts. Needs view_payouts."),
      get: get((i) => `/payouts/${seg(i)}`, "Get one payout."),
      upcoming: list("/payouts/upcoming", "List upcoming payouts."),
    },
    { title: "Payouts", description: "Past and upcoming payouts." },
  );

  const licenses = router(
    {
      verify: mutation(
        {
          description:
            "Verify a license key for a product. Increments the use count unless incrementUsesCount is false. Returns the purchase, including refunded and disputed flags.",
          input: object({ productId: id(), licenseKey: id(), incrementUsesCount: boolean().optional() }),
        },
        (_c, { productId, licenseKey, incrementUsesCount }) =>
          call("POST", "/licenses/verify", {}, {
            product_id: productId,
            license_key: licenseKey,
            increment_uses_count: incrementUsesCount ?? true,
          }),
      ),
      enable: mutation(
        { description: "Re-enable a disabled license key.", input: object({ productId: id(), licenseKey: id() }) },
        (_c, { productId, licenseKey }) => call("PUT", "/licenses/enable", {}, { product_id: productId, license_key: licenseKey }),
      ),
      disable: mutation(
        { description: "Disable a license key.", input: object({ productId: id(), licenseKey: id() }) },
        (_c, { productId, licenseKey }) => call("PUT", "/licenses/disable", {}, { product_id: productId, license_key: licenseKey }),
      ),
      decrementUsesCount: mutation(
        { description: "Decrement a license key's use count by one.", input: object({ productId: id(), licenseKey: id() }) },
        (_c, { productId, licenseKey }) =>
          call("PUT", "/licenses/decrement_uses_count", {}, { product_id: productId, license_key: licenseKey }),
      ),
      rotate: mutation(
        { description: "Replace a license key with a newly generated one.", input: object({ productId: id(), licenseKey: id() }) },
        (_c, { productId, licenseKey }) => call("PUT", "/licenses/rotate", {}, { product_id: productId, license_key: licenseKey }),
      ),
    },
    { title: "Licenses", description: "License key verification and management." },
  );

  const emails = router(
    {
      list: list("/emails", "List audience emails. Needs edit_emails."),
      get: get((i) => `/emails/${seg(i)}`, "Get one email."),
      create: create("/emails", "Create a draft email (name, subject, body, audience filters...)."),
      delete: remove((i) => `/emails/${seg(i)}`, "Delete an email."),
      preview: action((i) => `/emails/${seg(i)}/preview`, "Send a preview of the email to the seller.", "POST"),
      send: action((i) => `/emails/${seg(i)}/send`, "Send the email to its audience now.", "POST"),
      schedule: mutation(
        { description: "Schedule the email. body holds the send time (for example scheduled_at).", input: object({ id: id(), body: json() }) },
        (_c, { id: i, body }) => call("POST", `/emails/${seg(i)}/schedule`, {}, body),
      ),
      unschedule: action((i) => `/emails/${seg(i)}/unschedule`, "Cancel a scheduled email.", "POST"),
    },
    { title: "Emails", description: "Audience emails: drafts, previews, sending and scheduling." },
  );

  const workflows = router(
    {
      list: list("/workflows", "List workflows. Needs edit_emails."),
      get: get((i) => `/workflows/${seg(i)}`, "Get one workflow."),
    },
    { title: "Workflows", description: "Read-only access to workflows." },
  );

  const upsells = router(
    {
      list: list("/upsells", "List upsells."),
      get: get((i) => `/upsells/${seg(i)}`, "Get one upsell."),
      create: create("/upsells", "Create an upsell."),
      update: update((i) => `/upsells/${seg(i)}`, "Update an upsell."),
      delete: remove((i) => `/upsells/${seg(i)}`, "Delete an upsell."),
    },
    { title: "Upsells", description: "Checkout upsells." },
  );

  const utmLinks = router(
    {
      list: list("/utm_links", "List UTM links."),
      get: get((i) => `/utm_links/${seg(i)}`, "Get one UTM link."),
      create: create("/utm_links", "Create a UTM link."),
      update: update((i) => `/utm_links/${seg(i)}`, "Update a UTM link."),
      delete: remove((i) => `/utm_links/${seg(i)}`, "Delete a UTM link."),
      enable: action((i) => `/utm_links/${seg(i)}/enable`, "Enable a UTM link."),
      disable: action((i) => `/utm_links/${seg(i)}/disable`, "Disable a UTM link."),
    },
    { title: "UTM links", description: "Tracked marketing links." },
  );

  const webhooks = router(
    {
      list: list("/resource_subscriptions", "List webhook subscriptions; query must hold resource_name (for example sale, refund, dispute, cancellation)."),
      create: mutation(
        {
          description:
            "Subscribe a URL to an event. resourceName is one of sale, refund, dispute, dispute_won, cancellation, subscription_updated, subscription_ended, subscription_restarted. Needs view_sales for sale events.",
          input: object({ resourceName: id(), postUrl: id() }),
        },
        (_c, { resourceName, postUrl }) =>
          call("PUT", "/resource_subscriptions", {}, { resource_name: resourceName, post_url: postUrl }),
      ),
      delete: remove((i) => `/resource_subscriptions/${seg(i)}`, "Delete a webhook subscription."),
    },
    { title: "Webhooks", description: "Resource subscriptions (webhooks) for sales, refunds, disputes and subscription events." },
  );

  const pages = router(
    {
      list: list("/pages", "List storefront pages."),
      get: get((i) => `/pages/${seg(i)}`, "Get a storefront page by slug."),
      create: create("/pages", "Create a storefront page."),
      update: update((i) => `/pages/${seg(i)}`, "Update a storefront page by slug."),
      delete: remove((i) => `/pages/${seg(i)}`, "Delete a storefront page by slug."),
    },
    { title: "Pages", description: "Slugged storefront pages." },
  );

  return router({ user, products, sales, subscribers, payouts, licenses, emails, workflows, upsells, utmLinks, webhooks, pages });
}

export default defineApp(
  { user: { accounts: { gumroad: gumroad.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gumroad ?? [],
        (account) =>
          withApprovals(build(client(tokenOf(account), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gumroad",
        description:
          "Products, variants, offer codes, sales, refunds, license keys, subscribers, payouts, emails and webhooks on Gumroad.",
        icons,
      },
    ),
  }),
);

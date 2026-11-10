import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://plausible.io";

const plausible = defineProvider({
  name: "Plausible Analytics",
  hosts: ["plausible.io"],
  auth: {
    apiKey: secrets({
      label: "API key (Stats API or Sites API)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only Sites API endpoint; accepts both Stats and Sites API keys.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v1/sites?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Call = (method: string, path: string, search: Record<string, unknown>, body: unknown) => Promise<unknown>;

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const page = { limit: number().optional(), after: string().optional(), before: string().optional() };
  const paged = (a: { limit?: number; after?: string; before?: string }) => ({
    limit: a.limit,
    after: a.after,
    before: a.before,
  });

  const stats = router({
    query: query(
      {
        description:
          "Query stats (POST /api/v2/query, needs a Stats API key). Pass site_id (the site's domain), metrics (visitors, visits, pageviews, views_per_visit, bounce_rate, visit_duration, events, scroll_depth, time_on_page, percentage, conversion_rate, group_conversion_rate, average_revenue, total_revenue) and date_range (a preset like 7d, 30d, month, 12mo, all, or [start, end] ISO dates). Optional dimensions (e.g. visit:source, visit:country_name, event:page, time:day), filters (e.g. [[\"is\",\"visit:country\",[\"US\"]]]), order_by, include and pagination. Rate limit: 600 requests per hour.",
        input: object({
          site_id: string(),
          metrics: array(string()),
          date_range: json(),
          dimensions: array(string()).optional(),
          filters: array(json()).optional(),
          order_by: array(json()).optional(),
          include: record(json()).optional(),
          pagination: record(json()).optional(),
        }),
      },
      (_ctx, args) => call("POST", "/api/v2/query", {}, args),
    ),
  });

  const sites = router({
    list: query(
      { description: "List sites the key can access. Optional team_id, limit and cursors.", input: object({ ...page, team_id: string().optional() }) },
      (_ctx, a) => call("GET", "/api/v1/sites", { ...paged(a), team_id: a.team_id }, undefined),
    ),
    get: query(
      { description: "Get a site's configuration and tracker ID. site_id is the domain.", input: object({ site_id: string() }) },
      (_ctx, a) => call("GET", `/api/v1/sites/${encodeURIComponent(a.site_id)}`, {}, undefined),
    ),
    teams: query(
      { description: "List teams the key's user belongs to.", input: object(page) },
      (_ctx, a) => call("GET", "/api/v1/sites/teams", paged(a), undefined),
    ),
    create: mutation(
      {
        description:
          "Create a site (Sites API key, Enterprise). domain is required and globally unique; timezone is an IANA name; tracker_script_configuration holds optional booleans (outbound_links, file_downloads, revenue_tracking, hash_based_routing, track_404_pages, tagged_events, form_submissions, pageview_props) plus installation_type (wordpress, manual, gtm).",
        input: object({
          domain: string(),
          timezone: string().optional(),
          team_id: string().optional(),
          tracker_script_configuration: record(json()).optional(),
        }),
      },
      (_ctx, a) => call("POST", "/api/v1/sites", {}, a),
    ),
    update: mutation(
      {
        description: "Update a site's domain or tracker script configuration; omitted fields keep their values.",
        input: object({
          site_id: string(),
          domain: string().optional(),
          tracker_script_configuration: record(json()).optional(),
        }),
      },
      (_ctx, { site_id, ...body }) => call("PUT", `/api/v1/sites/${encodeURIComponent(site_id)}`, {}, body),
    ),
    delete: mutation(
      { description: "Delete a site. Requires the site owner; data purge can take up to 48 hours.", input: object({ site_id: string() }) },
      (_ctx, a) => call("DELETE", `/api/v1/sites/${encodeURIComponent(a.site_id)}`, {}, undefined),
    ),
    sharedLink: mutation(
      { description: "Create (or fetch, idempotent) a shared link with the given name for a site.", input: object({ site_id: string(), name: string() }) },
      (_ctx, a) => call("PUT", "/api/v1/sites/shared-links", {}, a),
    ),
  });

  const goals = router({
    list: query(
      { description: "List a site's goals.", input: object({ site_id: string(), ...page }) },
      (_ctx, a) => call("GET", "/api/v1/sites/goals", { site_id: a.site_id, ...paged(a) }, undefined),
    ),
    upsert: mutation(
      {
        description:
          "Create a goal (idempotent). goal_type is event (needs event_name) or page (needs page_path, wildcards allowed). Optional display_name and custom_props.",
        input: object({
          site_id: string(),
          goal_type: string(),
          event_name: string().optional(),
          page_path: string().optional(),
          display_name: string().optional(),
          custom_props: record(json()).optional(),
        }),
      },
      (_ctx, a) => call("PUT", "/api/v1/sites/goals", {}, a),
    ),
    delete: mutation(
      { description: "Delete a goal by ID.", input: object({ goal_id: string(), site_id: string() }) },
      (_ctx, a) => call("DELETE", `/api/v1/sites/goals/${encodeURIComponent(a.goal_id)}`, {}, { site_id: a.site_id }),
    ),
  });

  const customProps = router({
    list: query(
      { description: "List a site's custom properties.", input: object({ site_id: string() }) },
      (_ctx, a) => call("GET", "/api/v1/sites/custom-props", { site_id: a.site_id }, undefined),
    ),
    add: mutation(
      { description: "Allow a custom property on a site (idempotent).", input: object({ site_id: string(), property: string() }) },
      (_ctx, a) => call("PUT", "/api/v1/sites/custom-props", {}, a),
    ),
    delete: mutation(
      { description: "Remove a custom property from a site.", input: object({ site_id: string(), property: string() }) },
      (_ctx, a) => call("DELETE", `/api/v1/sites/custom-props/${encodeURIComponent(a.property)}`, {}, { site_id: a.site_id }),
    ),
  });

  const guests = router({
    list: query(
      { description: "List a site's guests.", input: object({ site_id: string(), ...page }) },
      (_ctx, a) => call("GET", "/api/v1/sites/guests", { site_id: a.site_id, ...paged(a) }, undefined),
    ),
    invite: mutation(
      { description: "Invite a guest by email with role editor or viewer (idempotent).", input: object({ site_id: string(), email: string(), role: string() }) },
      (_ctx, a) => call("PUT", "/api/v1/sites/guests", {}, a),
    ),
    remove: mutation(
      { description: "Remove a guest by email.", input: object({ email: string() }) },
      (_ctx, a) => call("DELETE", `/api/v1/sites/guests/${encodeURIComponent(a.email)}`, {}, undefined),
    ),
  });

  return router({ stats, sites, goals, customProps, guests });
}

export default defineApp(
  { user: { accounts: { plausible: plausible.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.plausible ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Plausible Analytics",
        description: "Query Plausible stats and manage sites, goals, custom properties, guests and shared links.",
        instructions: "site_id is always the site's domain as registered in Plausible. stats.query needs a Stats API key (Business plan); sites, goals, customProps and guests write operations need a Sites API key (Enterprise).",
        icons,
      },
    ),
  }),
);

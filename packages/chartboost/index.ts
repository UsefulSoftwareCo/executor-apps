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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const API = "https://api.chartboost.com";
const MEDIATION = "https://helium-api.chartboost.com";
const AUDIENCE = "https://public.api.gateway.chartboost.com";

type Fetch = typeof fetch;
type Fields = { clientId: string; clientSecret: string };

// The token endpoint wants a JSON body with an `audience`, which the generic client_credentials
// grant cannot send, so the app exchanges the credentials itself and caches the 24 hour token.
function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(`${API}/v5/oauth/token`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
        audience: AUDIENCE,
        grant_type: "client_credentials",
      }),
    });
    const t = await decodeJson(response, object({ access_token: string(), expires_in: number() }));
    cached = { token: t.access_token, expires: Date.now() + Math.max(t.expires_in - 120, 60) * 1000 };
    return t.access_token;
  };
  const clean = (values: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));

  const send = async (
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: { base?: string; search?: Record<string, unknown>; body?: unknown } = {},
  ) => {
    const target = new URL(`${options.base ?? API}${path}`);
    for (const [name, value] of Object.entries(clean(options.search ?? {}))) target.searchParams.set(name, String(value));
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json;charset=UTF-8" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const get = (path: string, search?: Record<string, unknown>) => send("GET", path, { search });
  const tools = router({
    apps: router({
      list: query(
        {
          description: "List the company's apps. platform_filters is android, ios or amazon.",
          input: object({
            keyword_filter: string().optional(),
            platform_filters: string().optional(),
            direction: string().optional(),
            page: number().optional(),
            limit: number().optional(),
          }),
        },
        async (_ctx, args) => get("/v5/apps", args),
      ),
      get: query(
        { description: "Get one app, including its signature and SDK status.", input: object({ app_id: string() }) },
        async (_ctx, args) => get(`/v5/apps/${encodeURIComponent(args.app_id)}`),
      ),
      create: mutation(
        {
          description:
            "Create an app. platform is ios, android or amazon; orientations are landscape and/or portrait (default_orientation is required with both); is_directed_at_kids_under_13 is YES or NO. A live app also needs store_app_id, store_app_url and store_bundle_id.",
          input: object({
            nickname: string(),
            platform: string(),
            orientations: array(string()),
            is_live: boolean(),
            is_test_mode_on: boolean(),
            is_directed_at_kids_under_13: string(),
            name: string().optional(),
            default_orientation: string().optional(),
            store_app_id: string().optional(),
            store_app_url: string().optional(),
            store_bundle_id: string().optional(),
            test_mode_duration: number().optional(),
          }),
        },
        async (_ctx, args) => send("POST", "/v5/apps", { body: clean(args) }),
      ),
      update: mutation(
        {
          description:
            "Update an app. An app cannot be changed from live back to not live, and store identifiers cannot be cleared.",
          input: object({
            app_id: string(),
            orientations: array(string()).optional(),
            default_orientation: string().optional(),
            is_live: boolean().optional(),
            store_app_id: string().optional(),
            store_app_url: string().optional(),
            store_bundle_id: string().optional(),
            is_test_mode_on: boolean().optional(),
            test_mode_duration: number().optional(),
            is_directed_at_kids_under_13: string().optional(),
          }),
        },
        async (_ctx, { app_id, ...body }) => send("PATCH", `/v5/apps/${encodeURIComponent(app_id)}`, { body: clean(body) }),
      ),
      delete: mutation(
        { description: "Soft-delete an app.", input: object({ app_id: string() }) },
        async (_ctx, args) => send("DELETE", `/v5/apps/${encodeURIComponent(args.app_id)}`),
      ),
    }),
    adLocations: router({
      list: query(
        {
          description:
            "List an app's ad locations. type_filter: bidding, fixed_cpm, auto_cpm, cross_promo or mock_response. ad_type_filter: rewarded, interstitial or banner.",
          input: object({ app_id: string(), type_filter: string().optional(), ad_type_filter: string().optional() }),
        },
        async (_ctx, { app_id, ...search }) => get(`/v5/apps/${encodeURIComponent(app_id)}/ad-locations`, search),
      ),
      create: mutation(
        {
          description:
            "Create an ad location. ad_type is interstitial, rewarded or banner; type is bidding or fixed_cpm. country_targeting (fixed_cpm only) is a list of { country: ISO alpha-2 or \"default\", price: USD 0.01-500 }. name is 1-80 characters.",
          input: object({
            app_id: string(),
            name: string(),
            ad_type: string(),
            type: string(),
            country_targeting: array(json()).optional(),
          }),
        },
        async (_ctx, { app_id, ...body }) =>
          send("POST", `/v5/apps/${encodeURIComponent(app_id)}/ad-locations`, { body: clean(body) }),
      ),
      update: mutation(
        {
          description:
            "Rename an ad location or replace its country_targeting list (fixed_cpm only). Type and ad type cannot change.",
          input: object({
            app_id: string(),
            ad_location_uuid: string(),
            name: string().optional(),
            country_targeting: array(json()).optional(),
          }),
        },
        async (_ctx, { app_id, ad_location_uuid, ...body }) =>
          send("PATCH", `/v5/apps/${encodeURIComponent(app_id)}/ad-locations/${encodeURIComponent(ad_location_uuid)}`, {
            body: clean(body),
          }),
      ),
      delete: mutation(
        {
          description: "Delete an ad location.",
          input: object({ app_id: string(), ad_location_uuid: string() }),
        },
        async (_ctx, args) =>
          send("DELETE", `/v5/apps/${encodeURIComponent(args.app_id)}/ad-locations/${encodeURIComponent(args.ad_location_uuid)}`),
      ),
    }),
    lists: router({
      list: query(
        {
          description: "List content-category block lists. sort is title, date_modified or date_created; direction is ASC or DESC.",
          input: object({
            keyword_filter: string().optional(),
            types_filter: string().optional(),
            limit: number().optional(),
            page: number().optional(),
            sort: string().optional(),
            direction: string().optional(),
            summary: boolean().optional(),
          }),
        },
        async (_ctx, args) => get("/v5/lists", args),
      ),
      get: query(
        { description: "Get one list with its elements.", input: object({ list_id: string() }) },
        async (_ctx, args) => get(`/v5/lists/${encodeURIComponent(args.list_id)}`),
      ),
      create: mutation(
        {
          description: "Create a list. elements are IAB Content Taxonomy 1.0 Tier 2 codes such as IAB1-1.",
          input: object({ title: string(), type: string(), elements: array(string()) }),
        },
        async (_ctx, args) => send("POST", "/v5/lists", { body: args }),
      ),
      replace: mutation(
        {
          description: "Replace a list's title, type and elements.",
          input: object({ list_id: string(), title: string(), type: string(), elements: array(string()) }),
        },
        async (_ctx, { list_id, ...body }) => send("PUT", `/v5/lists/${encodeURIComponent(list_id)}`, { body }),
      ),
      delete: mutation(
        {
          description: "Permanently delete a list. Apps using it fall back to the default taxonomy list.",
          input: object({ list_id: string() }),
        },
        async (_ctx, args) => send("DELETE", `/v5/lists/${encodeURIComponent(args.list_id)}`),
      ),
    }),
    monetizationSettings: router({
      get: query(
        {
          description: "Get an app's ad blocking, ad experience and ad targeting settings.",
          input: object({ app_id: string() }),
        },
        async (_ctx, args) => get(`/v5/apps/${encodeURIComponent(args.app_id)}/monetization_settings`),
      ),
      update: mutation(
        {
          description:
            "Update an app's monetization settings. Any of: ad_blocking_settings { monetization_agefilter_check, blocked_advertiser_store_ids, blocked_iab_categories_v1_list }, ad_experience_settings { template_settings { button_type, show_button_timer, default_muted }, video_duration_settings { interstitial_max_duration, rewarded_max_duration } }, ad_targeting_settings { target_device_types { device_types, is_included }, target_os_version { min, max } }.",
          input: object({
            app_id: string(),
            ad_blocking_settings: json().optional(),
            ad_experience_settings: json().optional(),
            ad_targeting_settings: json().optional(),
          }),
        },
        async (_ctx, { app_id, ...body }) =>
          send("PATCH", `/v5/apps/${encodeURIComponent(app_id)}/monetization_settings`, { body: clean(body) }),
      ),
    }),
    mediation: router({
      publisherMetrics: query(
        {
          description:
            "Mediation publisher metrics from the Reporting API (limited to 40 requests per 10 minutes). All fields optional: dimensions, metrics, filters (apps, placements, country, placement_type, demand_source, network_type), date_min and date_max (YYYY-MM-DD, at most 30 days apart), timezone (UTC or PST). Some metrics depend on network_type (all, mediation, bidding). This is a read despite being a POST.",
          input: object({
            dimensions: array(string()).optional(),
            metrics: array(string()).optional(),
            filters: json().optional(),
            date_min: string().optional(),
            date_max: string().optional(),
            timezone: string().optional(),
          }),
        },
        async (_ctx, args) => send("POST", "/v2/publisher/metrics", { base: MEDIATION, body: clean(args) }),
      ),
    }),
  });
  return { tools, probe: () => get("/v5/apps", { limit: 1 }) };
}

const chartboost = defineProvider({
  name: "Chartboost",
  hosts: ["api.chartboost.com", "helium-api.chartboost.com"],
  auth: {
    // API v5 credentials: Company info & settings > Access Management > Refresh API v5 Credentials.
    clientCredentials: secrets({
      label: "API v5 client credentials",
      fields: object({
        clientId: string({ minLength: 1 }),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting a token proves the credentials; listing one app then proves access to the API.
  async health({ account, fetch, signal }) {
    const api = client(account.fields, fetch, signal);
    await api.probe();
    return { accountInfo: { externalId: account.fields.clientId, displayName: `Chartboost ${account.fields.clientId.slice(0, 8)}` } };
  },
});

export default defineApp(
  { user: { accounts: { chartboost: chartboost.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chartboost ?? [],
        (account) =>
          withApprovals(client(account.fields, fetch, signal).tools, (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Chartboost",
        description:
          "Manage Chartboost apps, ad locations, block lists and monetization settings, and read mediation reports.",
        icons,
      },
    ),
  }),
);

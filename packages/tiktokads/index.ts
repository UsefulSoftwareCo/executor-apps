import {
  accountRouter,
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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const base = "https://business-api.tiktok.com/open_api/v1.3";

const tiktokAds = defineProvider({
  name: "TikTok Ads",
  hosts: ["business-api.tiktok.com"],
  auth: {
    // TikTok's OAuth exchange is not RFC 6749 (it uses app_id, secret and auth_code in a JSON body and wraps the
    // token in {code, data}), so the long-lived access token is entered directly.
    accessToken: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // GET /bc/get/ is in TikTok's official spec and needs only the token. TikTok answers HTTP 200 with a non-zero code
    // on failure, so only the always-present envelope is decoded. A token that cannot list Business Centers is rejected.
    const response = await fetch(`${base}/bc/get/?page_size=1`, { signal, headers: { "Access-Token": account.fields.token } });
    const body = await decodeJson(response, object({ code: number(), message: string() }));
    if (body.code !== 0) throw new Error(`TikTok Ads error ${body.code}: ${body.message}`);
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const advertiserId = string({ minLength: 1 });
const params = json().optional();

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; search?: Params; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    // TikTok expects arrays and objects (filtering, fields, advertiser_ids...) as JSON strings in the query.
    for (const [key, value] of Object.entries(init.search ?? {})) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: {
        "Access-Token": token,
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    // TikTok answers HTTP 200 with a non-zero code on failure.
    const result = await decodeJson(response, json());
    const envelope = result as { code?: number; message?: string; request_id?: string };
    if (typeof envelope?.code === "number" && envelope.code !== 0)
      throw new Error(`TikTok Ads error ${envelope.code}: ${envelope.message ?? "request failed"} (request_id ${envelope.request_id ?? "unknown"})`);
    return result;
  };
  const extra = (value: unknown): Params => (value && typeof value === "object" ? (value as Params) : {});

  // GET with advertiser_id plus optional filtering, fields, page, page_size and other documented parameters.
  const read = (description: string, path: string) =>
    query({ description, input: object({ advertiser_id: advertiserId, params }) }, async (_ctx, input: { advertiser_id: string; params?: unknown }) =>
      call(path, { search: { ...extra(input.params), advertiser_id: input.advertiser_id } }),
    );
  // GET without advertiser_id (user, Business Center and tool lookups).
  const readPlain = (description: string, path: string) =>
    query({ description, input: object({ params }) }, async (_ctx, input: { params?: unknown }) => call(path, { search: extra(input.params) }));
  // POST with advertiser_id merged into a JSON body.
  const write = (description: string, path: string) =>
    mutation({ description, input: object({ advertiser_id: advertiserId, body: json() }) }, async (_ctx, input: { advertiser_id: string; body: unknown }) =>
      call(path, { method: "POST", body: { ...extra(input.body), advertiser_id: input.advertiser_id } }),
    );

  return {
    account: router(
      {
        advertiserBalance: readPlain("Balance and budget of ad accounts. params: bc_id, advertiser_ids, fields, filtering, page, page_size.", "/advertiser/balance/get/"),
        advertiserTransactions: readPlain("Billing transactions of an ad account. params: advertiser_id, filtering, page, page_size.", "/advertiser/transaction/get/"),
      },
      { title: "Account", description: "Ad account balance and billing." },
    ),
    campaigns: router(
      {
        list: read("Campaigns of an advertiser. params: filtering {campaign_ids, campaign_name, primary_status...}, fields, page, page_size.", "/campaign/get/"),
        create: write('Create a campaign. body: {"campaign_name", "objective_type", "budget_mode", "budget", ...}.', "/campaign/create/"),
        update: write('Update a campaign. body: {"campaign_id", ...fields to change}.', "/campaign/update/"),
        updateStatus: write('Enable, disable or delete campaigns. body: {"campaign_ids": [...], "operation_status": "ENABLE"|"DISABLE"|"DELETE"}.', "/campaign/status/update/"),
      },
      { title: "Campaigns", description: "Campaigns and their status." },
    ),
    adGroups: router(
      {
        list: read("Ad groups of an advertiser. params: filtering {campaign_ids, adgroup_ids, ...}, fields, page, page_size.", "/adgroup/get/"),
        create: write('Create an ad group. body: {"campaign_id", "adgroup_name", "placement_type", "budget_mode", "schedule_type", "optimization_goal", "billing_event", "bid_type", "location_ids", ...}.', "/adgroup/create/"),
        update: write('Update an ad group, including its budget. body: {"adgroup_id", ...fields to change}.', "/adgroup/update/"),
        updateStatus: write('Enable, disable or delete ad groups. body: {"adgroup_ids": [...], "operation_status": "ENABLE"|"DISABLE"|"DELETE"}.', "/adgroup/status/update/"),
      },
      { title: "Ad groups", description: "Ad groups: targeting, placement, budget, schedule and bids." },
    ),
    ads: router(
      {
        list: read("Ads of an advertiser. params: filtering {campaign_ids, adgroup_ids, ad_ids, ...}, fields, page, page_size.", "/ad/get/"),
        create: write('Create ads. body: {"adgroup_id", "creatives": [{ad_name, identity_id, identity_type, video_id or image_ids, ad_text, call_to_action, landing_page_url}]}.', "/ad/create/"),
        update: write('Update ads. body: {"adgroup_id", "creatives": [{ad_id, ...fields}]}.', "/ad/update/"),
        updateStatus: write('Enable, disable or delete ads. body: {"ad_ids": [...], "operation_status": "ENABLE"|"DISABLE"|"DELETE"}.', "/ad/status/update/"),
      },
      { title: "Ads", description: "Ads and their status." },
    ),
    creatives: router(
      {
        imageInfo: read("Image details. params: image_ids (list), or material_ids.", "/file/image/ad/info/"),
        uploadImage: write('Upload an image by URL or file id. body: {"upload_type": "UPLOAD_BY_URL", "image_url", "file_name"}. Binary multipart uploads are not offered.', "/file/image/ad/upload/"),
        searchVideos: read("Search videos in the creative library. params: filtering, page, page_size.", "/file/video/ad/search/"),
        videoInfo: read("Video details and preview URLs. params: video_ids (list).", "/file/video/ad/info/"),
        uploadVideo: write('Upload a video by URL. body: {"upload_type": "UPLOAD_BY_URL", "video_url", "file_name"}. Binary multipart uploads are not offered.', "/file/video/ad/upload/"),
        identities: read("Identities (TikTok accounts, custom identities) usable for ads. params: identity_type, identity_authorized_bc_id, page, page_size.", "/identity/get/"),
        createIdentity: write('Create a custom identity. body: {"display_name", "image_uri"}.', "/identity/create/"),
        sparkPostInfo: read("A TikTok post you own, for Spark Ads. params: identity_id, identity_type, item_id (the post id).", "/identity/video/info/"),
      },
      { title: "Creatives", description: "Images, videos, identities and Spark Ads posts." },
    ),
    targeting: router(
      {
        regions: readPlain("Regions and locations for geo targeting. params: advertiser_id, placements, objective_type, level_range, language.", "/tool/region/"),
        languages: readPlain("Languages for targeting. params: advertiser_id.", "/tool/language/"),
        interestCategories: readPlain("Interest categories. params: advertiser_id, version, placement.", "/tool/interest_category/"),
        interestKeywords: readPlain("Recommended interest keywords. params: advertiser_id, keyword (one seed keyword).", "/tool/interest_keyword/recommend/"),
        deviceModels: readPlain("Device models. params: advertiser_id.", "/tool/device_model/"),
      },
      { title: "Targeting", description: "Targeting option catalogs not covered by the generated tools." },
    ),
    api: router(
      {
        get: query(
          {
            description:
              "Call a GET endpoint of the TikTok API for Business v1.3 that has no typed tool (docs: https://business-api.tiktok.com/portal/docs). path is relative, e.g. /ad/aco/get/. params become query parameters; arrays and objects are JSON-encoded.",
            input: object({ path: string({ minLength: 1 }), params }),
          },
          async (_ctx, input: { path: string; params?: unknown }) => call(input.path.startsWith("/") ? input.path : `/${input.path}`, { search: extra(input.params) }),
        ),
        post: mutation(
          {
            description:
              "Call a POST endpoint of the TikTok API for Business v1.3 that has no typed tool (docs: https://business-api.tiktok.com/portal/docs). path is relative, e.g. /ad/aco/create/. body is sent as JSON.",
            input: object({ path: string({ minLength: 1 }), body: json() }),
          },
          async (_ctx, input: { path: string; body: unknown }) =>
            call(input.path.startsWith("/") ? input.path : `/${input.path}`, { method: "POST", body: input.body }),
        ),
      },
      { title: "Raw API", description: "Any other v1.3 endpoint without a typed tool." },
    ),
  };
}

export default defineApp({ user: { accounts: { tiktokAds: tiktokAds.many() } }, icons }, async ({ user, cache, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.tiktokAds ?? [],
      (account) =>
        withApprovals(
          router(
            {
              openapi: liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
              ...tools(account.fields.token, fetch, signal),
            },
            { title: "TikTok Ads", description: "TikTok API for Business v1.3." },
          ),
          (tool) => (tool.kind === "mutation" ? always() : undefined),
        ),
      { signal },
    ),
    {
      title: "TikTok Ads",
      description:
        "TikTok Ads. openapi: about 200 operations from TikTok's official specs (Business Center, catalogs, audiences, pixels, reports, Smart+, GMV Max, comments, targeting tools). Other groups: campaigns, ad groups, ads, creatives and account balance. api: raw GET/POST for the rest.",
      icons,
    },
  ),
}));

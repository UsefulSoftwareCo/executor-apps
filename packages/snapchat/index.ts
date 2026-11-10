import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://adsapi.snapchat.com/v1";

const snapchat = defineProvider({
  name: "Snapchat",
  hosts: ["adsapi.snapchat.com", "accounts.snapchat.com"],
  auth: {
    // Snap has no OIDC discovery document, so the endpoints are declared. Apps are created in Snap Business Manager
    // (Business Details > OAuth Apps) and the connect page asks for that app's client ID and secret.
    oauth: oauth2({
      authorizationUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
      tokenUrl: "https://accounts.snapchat.com/login/oauth2/access_token",
      // Snap documents client_id and client_secret as form fields on the token request.
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["snapchat-marketing-api"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const body = await decodeJson(response, object({ me: object({ id: string(), email: string() }) }));
    return { accountInfo: { externalId: body.me.id, username: body.me.email } };
  },
});

type Fetch = typeof fetch;
type Search = Record<string, string | number | boolean | undefined>;

const id = string({ minLength: 1 });
const limit = number().optional();
const cursor = string().optional();

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; search?: Search; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  const page = { limit, cursor };
  const paging = ({ limit, cursor }: { limit?: number; cursor?: string }) => ({ limit, cursor });
  const enc = encodeURIComponent;

  const list = (description: string, path: (input: { id: string }) => string) =>
    query({ description, input: object({ id, ...page }) }, async (_ctx, input: { id: string; limit?: number; cursor?: string }) =>
      call(path(input), { search: paging(input) }),
    );
  const get = (description: string, path: (input: { id: string }) => string) =>
    query({ description, input: object({ id }) }, async (_ctx, input: { id: string }) => call(path(input)));
  const create = (description: string, path: (input: { id: string }) => string) =>
    mutation({ description, input: object({ id, body: json() }) }, async (_ctx, input: { id: string; body: unknown }) =>
      call(path(input), { method: "POST", body: input.body }),
    );
  const update = (description: string, path: (input: { id: string }) => string) =>
    mutation({ description, input: object({ id, body: json() }) }, async (_ctx, input: { id: string; body: unknown }) =>
      call(path(input), { method: "PUT", body: input.body }),
    );
  const remove = (description: string, path: (input: { id: string }) => string) =>
    mutation({ description, input: object({ id }) }, async (_ctx, input: { id: string }) => call(path(input), { method: "DELETE" }));

  const statsInput = object({
    id,
    granularity: string().default("TOTAL"),
    fields: string().default("impressions,swipes,spend"),
    start_time: string().optional(),
    end_time: string().optional(),
    breakdown: string().optional(),
    dimension: string().optional(),
    pivot: string().optional(),
    swipe_up_attribution_window: string().optional(),
    view_attribution_window: string().optional(),
  });
  const stats = (description: string, path: (input: { id: string }) => string) =>
    query({ description, input: statsInput }, async (_ctx, { id: entity, ...search }: { id: string } & Search) =>
      call(path({ id: entity }), { search }),
    );

  return router({
    account: router(
      {
        me: query({ description: "The connected Snapchat Business user: id, email, display name and organization.", input: object({}) }, async () =>
          call("/me"),
        ),
        organizations: query(
          {
            description: "Organizations the user belongs to. Set withAdAccounts to include each organization's ad accounts.",
            input: object({ withAdAccounts: string().optional() }),
          },
          async (_ctx, { withAdAccounts }: { withAdAccounts?: string }) =>
            call("/me/organizations", { search: { with_ad_accounts: withAdAccounts } }),
        ),
      },
      { title: "Account", description: "The connected Snapchat user and their organizations." },
    ),
    organizations: router(
      {
        get: get("One organization by id.", ({ id }) => `/organizations/${enc(id)}`),
        adAccounts: list("Ad accounts in an organization.", ({ id }) => `/organizations/${enc(id)}/adaccounts`),
        members: list("Members of an organization.", ({ id }) => `/organizations/${enc(id)}/members`),
        fundingSources: list("Funding sources of an organization.", ({ id }) => `/organizations/${enc(id)}/fundingsources`),
        billingCenters: list("Billing centers of an organization.", ({ id }) => `/organizations/${enc(id)}/billingcenters`),
        catalogs: list("Product catalogs of an organization.", ({ id }) => `/organizations/${enc(id)}/catalogs`),
        pixels: list("Snap Pixels owned by an organization.", ({ id }) => `/organizations/${enc(id)}/pixels`),
      },
      { title: "Organizations", description: "Organizations, members, billing and catalogs." },
    ),
    adAccounts: router(
      {
        get: get("One ad account by id: currency, timezone, status and funding.", ({ id }) => `/adaccounts/${enc(id)}`),
        roles: list("Roles on an ad account.", ({ id }) => `/adaccounts/${enc(id)}/roles`),
        pixels: list("Snap Pixels available to an ad account.", ({ id }) => `/adaccounts/${enc(id)}/pixels`),
        stats: stats("Performance stats for an ad account.", ({ id }) => `/adaccounts/${enc(id)}/stats`),
      },
      { title: "Ad accounts", description: "Ad accounts, roles, pixels and account-level stats." },
    ),
    campaigns: router(
      {
        list: list("Campaigns in an ad account (id is the ad account id).", ({ id }) => `/adaccounts/${enc(id)}/campaigns`),
        get: get("One campaign by id.", ({ id }) => `/campaigns/${enc(id)}`),
        stats: stats("Performance stats for a campaign.", ({ id }) => `/campaigns/${enc(id)}/stats`),
        create: create(
          'Create campaigns in an ad account (id is the ad account id). body is {"campaigns":[{name, status, start_time, ...}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/campaigns`,
        ),
        update: update(
          'Update campaigns in an ad account (id is the ad account id). body is {"campaigns":[{id, ...fields}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/campaigns`,
        ),
        delete: remove("Delete a campaign by id.", ({ id }) => `/campaigns/${enc(id)}`),
      },
      { title: "Campaigns", description: "Campaigns and their stats." },
    ),
    adSquads: router(
      {
        listForAdAccount: list("Ad squads in an ad account.", ({ id }) => `/adaccounts/${enc(id)}/adsquads`),
        listForCampaign: list("Ad squads in a campaign.", ({ id }) => `/campaigns/${enc(id)}/adsquads`),
        get: get("One ad squad by id: targeting, bid, budget and schedule.", ({ id }) => `/adsquads/${enc(id)}`),
        stats: stats("Performance stats for an ad squad.", ({ id }) => `/adsquads/${enc(id)}/stats`),
        create: create(
          'Create ad squads in a campaign (id is the campaign id). body is {"adsquads":[{name, type, targeting, ...}]}.',
          ({ id }) => `/campaigns/${enc(id)}/adsquads`,
        ),
        update: update(
          'Update ad squads in a campaign (id is the campaign id). body is {"adsquads":[{id, ...fields}]}.',
          ({ id }) => `/campaigns/${enc(id)}/adsquads`,
        ),
        delete: remove("Delete an ad squad by id.", ({ id }) => `/adsquads/${enc(id)}`),
      },
      { title: "Ad squads", description: "Ad squads: targeting, bids, budgets and stats." },
    ),
    ads: router(
      {
        listForAdAccount: list("Ads in an ad account.", ({ id }) => `/adaccounts/${enc(id)}/ads`),
        listForAdSquad: list("Ads in an ad squad.", ({ id }) => `/adsquads/${enc(id)}/ads`),
        get: get("One ad by id.", ({ id }) => `/ads/${enc(id)}`),
        stats: stats("Performance stats for an ad.", ({ id }) => `/ads/${enc(id)}/stats`),
        create: create(
          'Create ads in an ad squad (id is the ad squad id). body is {"ads":[{name, creative_id, type, status}]}.',
          ({ id }) => `/adsquads/${enc(id)}/ads`,
        ),
        update: update(
          'Update ads in an ad squad (id is the ad squad id). body is {"ads":[{id, ...fields}]}.',
          ({ id }) => `/adsquads/${enc(id)}/ads`,
        ),
        delete: remove("Delete an ad by id.", ({ id }) => `/ads/${enc(id)}`),
      },
      { title: "Ads", description: "Ads and their stats." },
    ),
    creatives: router(
      {
        list: list("Creatives in an ad account.", ({ id }) => `/adaccounts/${enc(id)}/creatives`),
        get: get("One creative by id.", ({ id }) => `/creatives/${enc(id)}`),
        create: create(
          'Create creatives in an ad account (id is the ad account id). body is {"creatives":[{name, type, top_snap_media_id, ...}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/creatives`,
        ),
        update: update(
          'Update creatives in an ad account (id is the ad account id). body is {"creatives":[{id, ...fields}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/creatives`,
        ),
      },
      { title: "Creatives", description: "Ad creatives." },
    ),
    media: router(
      {
        list: list("Media files in an ad account.", ({ id }) => `/adaccounts/${enc(id)}/media`),
        get: get("One media entity by id, including its upload status.", ({ id }) => `/media/${enc(id)}`),
        create: create(
          'Create a media entity in an ad account (id is the ad account id). body is {"media":[{name, type: "VIDEO"|"IMAGE"}]}. File upload is a separate multipart call not offered here.',
          ({ id }) => `/adaccounts/${enc(id)}/media`,
        ),
      },
      { title: "Media", description: "Media entities used by creatives." },
    ),
    segments: router(
      {
        list: list("Custom audience segments in an ad account.", ({ id }) => `/adaccounts/${enc(id)}/segments`),
        get: get("One audience segment by id.", ({ id }) => `/segments/${enc(id)}`),
        create: create(
          'Create audience segments in an ad account (id is the ad account id). body is {"segments":[{name, source_type, retention_in_days, ...}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/segments`,
        ),
        update: update(
          'Update audience segments in an ad account (id is the ad account id). body is {"segments":[{id, ...fields}]}.',
          ({ id }) => `/adaccounts/${enc(id)}/segments`,
        ),
        delete: remove("Delete an audience segment by id.", ({ id }) => `/segments/${enc(id)}`),
      },
      { title: "Segments", description: "Custom audience segments." },
    ),
    targeting: router(
      {
        geo: query({ description: "Countries available for geo targeting.", input: object({}) }, async () => call("/targeting/geo/country")),
        options: query(
          {
            description: "All targeting options available in a country (lowercase ISO code, e.g. us) in one lookup.",
            input: object({ countryCode: id }),
          },
          async (_ctx, { countryCode }: { countryCode: string }) => call("/targeting/v1/options", { search: { country_code: countryCode } }),
        ),
        regions: query(
          { description: "Region targeting options for a country.", input: object({ countryCode: id }) },
          async (_ctx, { countryCode }: { countryCode: string }) => call(`/targeting/geo/${enc(countryCode)}/region`),
        ),
        option: query(
          {
            description:
              "A targeting option list. category is one of demographics/age_group, demographics/gender, demographics/languages, demographics/advanced_demographics, interests/nln, device/connection_type, device/os_type, device/carrier, device/marketing_name. Also interests/scls, interests/vac and interests/shp (Snap v1 interest segments), which are requested under targeting/v1/.",
            input: object({ category: id, ...page }),
          },
          async (_ctx, { category, ...rest }: { category: string; limit?: number; cursor?: string }) =>
            call(`/targeting/${(/^interests\/(scls|vac|shp)$/.test(category) ? `v1/${category}` : category).split("/").map(enc).join("/")}`, {
              search: paging(rest),
            }),
        ),
      },
      { title: "Targeting", description: "Targeting option catalogs." },
    ),
  });
}

export default defineApp({ user: { accounts: { snapchat: snapchat.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.snapchat ?? [],
      (account) =>
        withApprovals(tools(account.fields.access_token, fetch, signal), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "Snapchat",
      description:
        "Snapchat Ads: organizations, ad accounts, campaigns, ad squads, ads, creatives, media, audience segments, targeting options and performance stats.",
      icons,
    },
  ),
}));

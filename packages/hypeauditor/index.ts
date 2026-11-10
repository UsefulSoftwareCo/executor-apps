import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
  number,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { mutation } from "apps";

const base = "https://hypeauditor.com/api/method";

const hypeauditor = defineProvider({
  name: "HypeAuditor",
  hosts: ["hypeauditor.com"],
  auth: {
    apiKey: secrets({
      label: "Client ID and API token",
      fields: object({ clientId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/auditor.planInfo/`, {
      signal,
      headers: { Accept: "application/json", "X-Auth-Id": account.fields.clientId, "X-Auth-Token": account.fields.token },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: account.fields.clientId, displayName: `HypeAuditor client ${account.fields.clientId}` } };
  },
});

type Account = { fields: { clientId: string; token: string } };

const headers = (account: Account, extra: Record<string, string> = {}) => ({
  Accept: "application/json",
  "X-Auth-Id": account.fields.clientId,
  "X-Auth-Token": account.fields.token,
  ...extra,
});

const url = (path: string, params: Record<string, string | number | undefined> = {}) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const qs = out.toString();
  return `${base}/${path}${qs ? `?${qs}` : ""}`;
};

const reportNote =
  " Reports are generated on demand and spend credits; HTTP 202 means the report is still being built, retry after result.retryTtl seconds.";

const hypeauditorTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Record<string, string | number | undefined>, f: typeof fetch) =>
    f(url(path, params), { signal, headers: headers(account) }).then((r) => decodeJson(r, json()));

  return router({
    planInfo: query(
      {
        description: "Remaining report credits, advanced reports and discovery requests on the plan.",
        input: object({}),
      },
      async ({ fetch }) => get("auditor.planInfo/", {}, fetch),
    ),
    suggester: query(
      {
        description:
          "Search influencer accounts by keyword. st restricts to one network (IG, TT, YT, TW, TWI, SC); exclSt is a comma separated list of networks to exclude.",
        input: object({ search: string(), st: string().optional(), exclSt: string().optional() }),
      },
      async ({ fetch }, { search, st, exclSt }) => get("auditor.suggester", { search, st, exclSt, v: 2 }, fetch),
    ),
    instagramReport: query(
      {
        description:
          "Instagram report by username (no @). type is report (mini report) or advanced_report (default). features is a comma separated list of ranking, mentions, mentioned_by, notable_audience, audience_brand_affinity, er_benchmarks." +
          reportNote,
        input: object({ username: string(), type: string().optional(), features: string().optional() }),
      },
      async ({ fetch }, { username, type, features }) => get("auditor.report/", { username, type, features, v: 2 }, fetch),
    ),
    instagramReportByUserId: query(
      {
        description: "Instagram report by numeric Instagram user id. Same type and features options as instagramReport." + reportNote,
        input: object({ userId: string(), type: string().optional(), features: string().optional() }),
      },
      async ({ fetch }, { userId, type, features }) =>
        get("auditor.reportByUserId/", { user_id: userId, type, features, v: 2 }, fetch),
    ),
    instagramMedia: query(
      { description: "Recent media of an Instagram account with post-level metrics.", input: object({ username: string() }) },
      async ({ fetch }, { username }) => get("auditor.reportMedia/", { username, v: 2 }, fetch),
    ),
    instagramHistory: query(
      { description: "Historical metrics (followers, engagement) of an Instagram account.", input: object({ username: string() }) },
      async ({ fetch }, { username }) => get("auditor.instagramHistory/", { username, v: 2 }, fetch),
    ),
    youtubeReport: query(
      {
        description: "YouTube channel report by channel id. features is an optional comma separated list of extra sections." + reportNote,
        input: object({ channel: string(), features: string().optional() }),
      },
      async ({ fetch }, { channel, features }) => get("auditor.youtube/", { channel, features }, fetch),
    ),
    youtubeMedia: query(
      { description: "Videos of a YouTube channel, paginated with page.", input: object({ channel: string(), page: number().optional() }) },
      async ({ fetch }, { channel, page }) => get("auditor.youtubeMedia/", { channel, page }, fetch),
    ),
    youtubeBrandMentions: query(
      { description: "Brands mentioned by a YouTube channel.", input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.youtubeBrandMentions/", { channel }, fetch),
    ),
    tiktokReport: query(
      {
        description: "TikTok report by username (no @)." + reportNote,
        input: object({ channel: string(), type: string().optional() }),
      },
      async ({ fetch }, { channel, type }) => get("auditor.tiktok/", { channel, type }, fetch),
    ),
    tiktokReportByUserId: query(
      { description: "TikTok report by TikTok user id." + reportNote, input: object({ userId: string(), type: string().optional() }) },
      async ({ fetch }, { userId, type }) => get("auditor.tiktokByUserId/", { user_id: userId, type }, fetch),
    ),
    tiktokMedia: query(
      { description: "Recent videos of a TikTok account by channel id.", input: object({ channelId: string() }) },
      async ({ fetch }, { channelId }) => get("auditor.tiktokMedia/", { channelId }, fetch),
    ),
    tiktokHistory: query(
      { description: "Historical metrics of a TikTok account.", input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.tiktokHistory/", { channel }, fetch),
    ),
    tiktokBrandMentions: query(
      { description: "Brands mentioned by a TikTok account.", input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.tiktokBrandMentions/", { channel }, fetch),
    ),
    twitterReport: query(
      { description: "Twitter/X account report by username." + reportNote, input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.twitter/", { channel }, fetch),
    ),
    twitterHistory: query(
      { description: "Historical metrics of a Twitter/X account.", input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.twitterHistory/", { channel }, fetch),
    ),
    twitchReport: query(
      { description: "Twitch channel report." + reportNote, input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.twitch/", { channel }, fetch),
    ),
    twitchHistory: query(
      { description: "Historical metrics of a Twitch channel.", input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.twitchHistory/", { channel }, fetch),
    ),
    snapchatReport: query(
      { description: "Snapchat account report." + reportNote, input: object({ channel: string() }) },
      async ({ fetch }, { channel }) => get("auditor.snapchat/", { channel }, fetch),
    ),
    unlockedReports: query(
      {
        description: "Reports already unlocked on the account, filterable by date_from/date_to and paginated with limit and offset.",
        input: object({
          limit: number().optional(),
          offset: number().optional(),
          dateFrom: string().optional(),
          dateTo: string().optional(),
        }),
      },
      async ({ fetch }, { limit, offset, dateFrom, dateTo }) =>
        get("auditor.reportsUnlocked", { limit, offset, date_from: dateFrom, date_to: dateTo }, fetch),
    ),
    creators: query(
      {
        description: "Creator profile info for unlocked reports (My Network), filtered by creator ids or accounts and paginated with cursor.",
        input: object({
          limit: number().optional(),
          cursor: string().optional(),
          creatorIds: string().optional(),
          creatorAccounts: string().optional(),
          reportUnlockedFrom: string().optional(),
          reportUnlockedTo: string().optional(),
        }),
      },
      async ({ fetch }, i) =>
        get(
          "auditor.creators",
          {
            limit: i.limit,
            cursor: i.cursor,
            creator_ids: i.creatorIds,
            creator_accounts: i.creatorAccounts,
            report_unlocked_from: i.reportUnlockedFrom,
            report_unlocked_to: i.reportUnlockedTo,
          },
          fetch,
        ),
    ),
    taxonomy: query(
      { description: "Taxonomy (categories) used by HypeAuditor reports and discovery.", input: object({}) },
      async ({ fetch }) => get("auditor.taxonomy/", { v: 1 }, fetch),
    ),
    searchKeywordsPosts: query(
      {
        description: "Fetch the results of a keyword post search by social network and content ids.",
        input: object({ socialNetwork: string(), contentIds: string() }),
      },
      async ({ fetch }, { socialNetwork, contentIds }) =>
        get("auditor.searchKeywordsPosts/", { socialNetwork, contentIds }, fetch),
    ),
    discoverySearch: query(
      {
        description:
          "Discovery search over HypeAuditor's influencer database. body is the JSON search request, for example {\"social_network\":\"instagram\",\"account_has_contacts\":true}; see https://hypeauditor.readme.io/reference/general_discovery. Consumes discovery requests, not report credits.",
        input: object({ body: json() }),
      },
      async ({ fetch }, { body }) =>
        decodeJson(
          await fetch(url("auditor.search"), {
            method: "POST",
            signal,
            headers: headers(account, { "content-type": "application/json" }),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    lists: query(
      { description: "All report lists on the account.", input: object({}) },
      async ({ fetch }) => get("auditor.lists", {}, fetch),
    ),
    listReports: query(
      {
        description: "Reports in one list, paginated with limit and offset.",
        input: object({ id: string(), limit: number().optional(), offset: number().optional() }),
      },
      async ({ fetch }, { id, limit, offset }) => get("auditor.list", { id, limit, offset }, fetch),
    ),
    addReportToList: mutation(
      {
        description: "Add a report (by channel id and network type) to a list.",
        input: object({ listId: string(), channelId: string(), type: string() }),
        approval: always(),
      },
      async ({ fetch }, { listId, channelId, type }) =>
        get("auditor.addToList", { list_id: listId, channel_id: channelId, type }, fetch),
    ),
    removeReportFromList: mutation(
      {
        description: "Remove a report from a list.",
        input: object({ reportId: string(), listId: string() }),
        approval: always(),
      },
      async ({ fetch }, { reportId, listId }) =>
        get("auditor.removeFromList", { report_id: reportId, list_id: listId }, fetch),
    ),
  });
};

export default defineApp({ user: { accounts: { hypeauditor: hypeauditor.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.hypeauditor ?? [], (account) => hypeauditorTools(account, signal), { signal }), {
    title: "HypeAuditor",
    description:
      "Influencer analytics: Instagram, YouTube, TikTok, Twitter, Twitch and Snapchat reports, metrics history, brand mentions, discovery search, report lists and plan credits.",
    icons,
  }),
}));

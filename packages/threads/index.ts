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

const base = "https://graph.threads.net";

type Account = { method: "token"; fields: { token: string } };

const tokenOf = (account: Account) => account.fields.token;

const threads = defineProvider({
  name: "Threads",
  hosts: ["graph.threads.net"],
  auth: {
    // Generated for a Threads tester or app user in the Meta app dashboard (Threads use case).
    token: secrets({
      label: "Threads user access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1.0/me?fields=id,username`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}` },
    });
    const me = await decodeJson(response, object({ id: string(), username: string() }));
    return {
      accountInfo: {
        externalId: me.id,
        username: me.username,
        profileUrl: `https://www.threads.com/@${me.username}`,
      },
    };
  },
});

type Fetch = typeof fetch;
type Param = string | number | boolean | undefined;
type CallInit = { method?: string; search?: Record<string, Param> };

const id = string({ minLength: 1 });
const fields = string().optional();
const limit = number().optional();
const after = string().optional();
const before = string().optional();
const since = string().optional();
const until = string().optional();

const postFields =
  "id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post,alt_text,link_attachment_url,has_replies,reply_audience,quoted_post,reposted_post,gif_url,topic_tag,is_verified,profile_picture_url";
const replyFields =
  "id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post,has_replies,root_post,replied_to,is_reply,is_reply_owned_by_me,hide_status,reply_audience,quoted_post,reposted_post,gif_url,topic_tag,is_verified,profile_picture_url";
const searchFields =
  "id,media_product_type,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post,alt_text,link_attachment_url,has_replies,is_reply,root_post,replied_to,reply_audience,quoted_post,reposted_post,gif_url,topic_tag";
const profileFields = "id,username,name,threads_profile_picture_url,threads_biography,is_verified";

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: CallInit = {}) => {
    const url = new URL(`${base}/v1.0${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    return decodeJson(response, json());
  };
  const node = (value: string) => `/${encodeURIComponent(value)}`;
  const page = (l: number | undefined, a: string | undefined, b: string | undefined = undefined) => ({ limit: l, after: a, before: b });

  return router(
    {
      profile: router(
        {
          get: query(
            {
              description:
                "Get the connected Threads profile: username, name, biography, profile picture and verification status.",
              input: object({ fields }),
            },
            async (_ctx, { fields }) => call("/me", { search: { fields: fields ?? profileFields } }),
          ),
          getUser: query(
            {
              description: "Get a profile by Threads user ID. Only the connected user's own fields are fully available.",
              input: object({ userId: id, fields }),
            },
            async (_ctx, { userId, fields }) => call(node(userId), { search: { fields: fields ?? profileFields } }),
          ),
          lookup: query(
            {
              description: "Look up basic public information for any public profile by exact username (no @).",
              input: object({ username: id }),
            },
            async (_ctx, { username }) => call("/profile_lookup", { search: { username } }),
          ),
          publishingLimit: query(
            {
              description:
                "Current publishing rate-limit usage: posts, replies, deletes and location searches (quota_usage, reply_quota_usage, delete_quota_usage, location_search_quota_usage and their config).",
              input: object({ fields }),
            },
            async (_ctx, { fields }) =>
              call("/me/threads_publishing_limit", {
                search: {
                  fields:
                    fields ??
                    "quota_usage,config,reply_quota_usage,reply_config,delete_quota_usage,delete_config,location_search_quota_usage,location_search_config",
                },
              }),
          ),
          insights: query(
            {
              description:
                "Account-level insights. metric is a comma-separated list of views, likes, replies, reposts, quotes, clicks, followers_count, follower_demographics (the last cannot be combined with since/until; breakdown applies to it). since/until are Unix timestamps; the default range is yesterday through today.",
              input: object({ metric: id, since, until, breakdown: string().optional() }),
            },
            async (_ctx, search) => call("/me/threads_insights", { search }),
          ),
        },
        { title: "Profile", description: "The connected profile, public profile lookup, rate limits and account insights." },
      ),
      posts: router(
        {
          list: query(
            {
              description: "List the connected user's own posts, newest first.",
              input: object({ fields, limit, after, before, since, until }),
            },
            async (_ctx, { fields, limit, after, before, since, until }) =>
              call("/me/threads", { search: { fields: fields ?? postFields, ...page(limit, after, before), since, until } }),
          ),
          get: query(
            {
              description: "Get one post by ID.",
              input: object({ postId: id, fields }),
            },
            async (_ctx, { postId, fields }) =>
              call(node(postId), { search: { fields: fields ?? `${postFields},owner,hide_status,is_reply,root_post,replied_to` } }),
          ),
          listPublic: query(
            {
              description: "List the posts of any public profile by exact username (no @).",
              input: object({ username: id, fields, limit, after, before, since, until }),
            },
            async (_ctx, { username, fields, limit, after, before, since, until }) =>
              call("/profile_posts", {
                search: { username, fields: fields ?? postFields, ...page(limit, after, before), since, until },
              }),
          ),
          mentions: query(
            {
              description: "List posts that mention the connected user.",
              input: object({ fields, limit, after, before, since, until }),
            },
            async (_ctx, { fields, limit, after, before, since, until }) =>
              call("/me/mentions", { search: { fields: fields ?? postFields, ...page(limit, after, before), since, until } }),
          ),
          ghostPosts: query(
            {
              description: "List the connected user's ghost posts.",
              input: object({ fields, limit, after, before, since, until }),
            },
            async (_ctx, { fields, limit, after, before, since, until }) =>
              call("/me/ghost_posts", { search: { fields: fields ?? postFields, ...page(limit, after, before), since, until } }),
          ),
          search: query(
            {
              description:
                "Search public posts by keyword or topic tag. searchType is TOP (default) or RECENT; searchMode is KEYWORD (default) or TAG; mediaType is TEXT, IMAGE or VIDEO; authorUsername restricts to one author.",
              input: object({
                q: id,
                searchType: string().optional(),
                searchMode: string().optional(),
                mediaType: string().optional(),
                authorUsername: string().optional(),
                fields,
                limit,
                since,
                until,
              }),
            },
            async (_ctx, { q, searchType, searchMode, mediaType, authorUsername, fields, limit, since, until }) =>
              call("/keyword_search", {
                search: {
                  q,
                  search_type: searchType,
                  search_mode: searchMode,
                  media_type: mediaType,
                  author_username: authorUsername,
                  fields: fields ?? searchFields,
                  limit,
                  since,
                  until,
                },
              }),
          ),
          insights: query(
            {
              description:
                "Insights for one post. metric is a comma-separated list of views, likes, replies, reposts, quotes, shares.",
              input: object({ postId: id, metric: id }),
            },
            async (_ctx, { postId, metric }) => call(`${node(postId)}/insights`, { search: { metric } }),
          ),
          repost: mutation(
            {
              description: "Repost a post as the connected user.",
              input: object({ postId: id }),
            },
            async (_ctx, { postId }) => call(`${node(postId)}/repost`, { method: "POST" }),
          ),
          delete: mutation(
            {
              description: "Delete one of the connected user's posts or replies.",
              input: object({ postId: id }),
            },
            async (_ctx, { postId }) => call(node(postId), { method: "DELETE" }),
          ),
        },
        { title: "Posts", description: "Read, search, repost and delete posts, and post insights." },
      ),
      publishing: router(
        {
          createContainer: mutation(
            {
              description:
                "Step 1 of publishing: create a media container and return its id. mediaType is TEXT, IMAGE, VIDEO or CAROUSEL. Use imageUrl / videoUrl (public URLs) for media; for a carousel, create each item with isCarouselItem then pass the item container IDs as children (2-20). replyToId makes the post a reply, quotePostId a quote post. replyControl is everyone, accounts_you_follow, mentioned_only, parent_post_author_only or followers_only. Set autoPublishText on a TEXT post to publish immediately.",
              input: object({
                mediaType: id,
                text: string().optional(),
                imageUrl: string().optional(),
                videoUrl: string().optional(),
                isCarouselItem: boolean().optional(),
                children: array(string()).optional(),
                altText: string().optional(),
                replyToId: string().optional(),
                replyControl: string().optional(),
                quotePostId: string().optional(),
                linkAttachment: string().optional(),
                topicTag: string().optional(),
                locationId: string().optional(),
                allowlistedCountryCodes: array(string()).optional(),
                isSpoilerMedia: boolean().optional(),
                isGhostPost: boolean().optional(),
                enableReplyApprovals: boolean().optional(),
                autoPublishText: boolean().optional(),
                crosshareToIg: boolean().optional(),
              }),
            },
            async (
              _ctx,
              {
                mediaType,
                text,
                imageUrl,
                videoUrl,
                isCarouselItem,
                children,
                altText,
                replyToId,
                replyControl,
                quotePostId,
                linkAttachment,
                topicTag,
                locationId,
                allowlistedCountryCodes,
                isSpoilerMedia,
                isGhostPost,
                enableReplyApprovals,
                autoPublishText,
                crosshareToIg,
              },
            ) =>
              call("/me/threads", {
                method: "POST",
                search: {
                  media_type: mediaType,
                  text,
                  image_url: imageUrl,
                  video_url: videoUrl,
                  is_carousel_item: isCarouselItem,
                  children: children?.join(","),
                  alt_text: altText,
                  reply_to_id: replyToId,
                  reply_control: replyControl,
                  quote_post_id: quotePostId,
                  link_attachment: linkAttachment,
                  topic_tag: topicTag,
                  location_id: locationId,
                  allowlisted_country_codes: allowlistedCountryCodes?.join(","),
                  is_spoiler_media: isSpoilerMedia,
                  is_ghost_post: isGhostPost,
                  enable_reply_approvals: enableReplyApprovals,
                  auto_publish_text: autoPublishText,
                  crossreshare_to_ig: crosshareToIg,
                },
              }),
          ),
          getContainerStatus: query(
            {
              description:
                "Check a media container's processing status (IN_PROGRESS, FINISHED, PUBLISHED, ERROR, EXPIRED) and error_message. Wait for FINISHED before publishing; videos take a while.",
              input: object({ containerId: id }),
            },
            async (_ctx, { containerId }) => call(node(containerId), { search: { fields: "id,status,error_message" } }),
          ),
          publish: mutation(
            {
              description: "Step 2 of publishing: publish a finished media container. Returns the new post id.",
              input: object({ containerId: id }),
            },
            async (_ctx, { containerId }) =>
              call("/me/threads_publish", { method: "POST", search: { creation_id: containerId } }),
          ),
          searchLocations: query(
            {
              description:
                "Find locations that can be tagged in a post, by text query or by latitude and longitude (send both). Use the returned id as locationId.",
              input: object({
                query: string().optional(),
                latitude: number().optional(),
                longitude: number().optional(),
                fields,
              }),
            },
            async (_ctx, { query: q, latitude, longitude, fields }) =>
              call("/location_search", {
                search: { query: q, latitude, longitude, fields: fields ?? "id,name,address,city,country,latitude,longitude,postal_code" },
              }),
          ),
        },
        { title: "Publishing", description: "Create, check and publish posts, replies, quotes and carousels." },
      ),
      replies: router(
        {
          list: query(
            {
              description: "List the top-level replies to a post. reverse (default true) orders newest first.",
              input: object({ postId: id, fields, reverse: boolean().optional(), limit, after, before }),
            },
            async (_ctx, { postId, fields, reverse, limit, after, before }) =>
              call(`${node(postId)}/replies`, { search: { fields: fields ?? replyFields, reverse, ...page(limit, after, before) } }),
          ),
          conversation: query(
            {
              description: "List every reply to a post as a flattened list, including nested replies.",
              input: object({ postId: id, fields, reverse: boolean().optional(), limit, after, before }),
            },
            async (_ctx, { postId, fields, reverse, limit, after, before }) =>
              call(`${node(postId)}/conversation`, {
                search: { fields: fields ?? replyFields, reverse, ...page(limit, after, before) },
              }),
          ),
          mine: query(
            {
              description: "List the connected user's own replies on other posts.",
              input: object({ fields, limit, after, before, since, until }),
            },
            async (_ctx, { fields, limit, after, before, since, until }) =>
              call("/me/replies", { search: { fields: fields ?? replyFields, ...page(limit, after, before), since, until } }),
          ),
          setHidden: mutation(
            {
              description: "Hide or unhide a top-level reply on one of the connected user's posts.",
              input: object({ replyId: id, hide: boolean() }),
            },
            async (_ctx, { replyId, hide }) => call(`${node(replyId)}/manage_reply`, { method: "POST", search: { hide } }),
          ),
          listPending: query(
            {
              description: "List replies awaiting approval on a post that has reply approvals enabled.",
              input: object({ postId: id, fields, reverse: boolean().optional(), limit, after, before }),
            },
            async (_ctx, { postId, fields, reverse, limit, after, before }) =>
              call(`${node(postId)}/pending_replies`, {
                search: { fields: fields ?? `${replyFields},reply_approval_status`, reverse, ...page(limit, after, before) },
              }),
          ),
          managePending: mutation(
            {
              description: "Approve or ignore a pending reply.",
              input: object({ replyId: id, approve: boolean() }),
            },
            async (_ctx, { replyId, approve }) =>
              call(`${node(replyId)}/manage_pending_reply`, { method: "POST", search: { approve } }),
          ),
        },
        { title: "Replies", description: "Read and moderate replies and conversations." },
      ),
    },
  );
}

export default defineApp(
  { user: { accounts: { threads: threads.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.threads ?? [],
        (account) =>
          withApprovals(tools(tokenOf(account), fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Threads",
        description:
          "Threads by Meta: publish text, image, video and carousel posts, replies and quotes; read profiles, posts, mentions and conversations; search public posts; moderate replies; and pull insights.",
        instructions:
          "Publishing is two steps: publishing.createContainer, wait until publishing.getContainerStatus reports FINISHED (about 30 seconds is typical for media), then publishing.publish. Text posts can set autoPublishText to skip the second step. Media URLs must be public. List endpoints return paging.cursors.after; pass it as `after` for the next page. Keyword search and insights need the matching permission on the token.",
        icons,
      },
    ),
  }),
);

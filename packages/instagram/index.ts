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

const base = "https://graph.instagram.com/v25.0";

type Account = { method: "token"; fields: { token: string } };

const tokenOf = (account: Account) => account.fields.token;

const instagram = defineProvider({
  name: "Instagram",
  hosts: ["graph.instagram.com"],
  auth: {
    // Generated in the Meta app dashboard (Instagram > API setup with Instagram login) for a professional account.
    token: secrets({
      label: "Instagram user access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me?fields=user_id,username`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}` },
    });
    const me = await decodeJson(response, object({ user_id: string(), username: string() }));
    return {
      accountInfo: {
        externalId: me.user_id,
        username: me.username,
        profileUrl: `https://www.instagram.com/${me.username}/`,
      },
    };
  },
});

type Fetch = typeof fetch;
type CallInit = { method?: string; search?: Record<string, string | number | boolean | undefined>; body?: unknown };

const id = string({ minLength: 1 });
const fields = string().optional();
const limit = number().optional();
const after = string().optional();

const profileFields = "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website";
const mediaFields =
  "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,is_comment_enabled,owner{id,username}";
const commentFields = "id,text,timestamp,username,like_count,hidden,parent_id,from{id,username}";

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: CallInit = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  const node = (value: string) => `/${encodeURIComponent(value)}`;
  const paging = (l: number | undefined, a: string | undefined) => ({ limit: l, after: a });

  return router(
    {
      profile: router(
        {
          get: query(
            {
              description:
                "Get the connected professional account: username, name, account type, biography, follower and media counts, profile picture.",
              input: object({ fields }),
            },
            async (_ctx, { fields }) => call("/me", { search: { fields: fields ?? profileFields } }),
          ),
          getUser: query(
            {
              description:
                "Get a profile by Instagram-scoped ID, such as a user who messaged the account. Fields available depend on the relationship (name, username, profile_pic, follower_count, is_user_follow_business, is_business_follow_user).",
              input: object({ userId: id, fields: string({ minLength: 1 }) }),
            },
            async (_ctx, { userId, fields }) => call(node(userId), { search: { fields } }),
          ),
          insights: query(
            {
              description:
                "Account-level insights, e.g. metric 'reach,views,accounts_engaged,total_interactions,follows_and_unfollows' with period 'day' (or lifetime for 'follower_demographics' / 'engaged_audience_demographics'). metricType 'total_value' returns aggregates; 'time_series' returns daily values. since/until are Unix timestamps or dates.",
              input: object({
                metric: id,
                period: string().optional(),
                metricType: string().optional(),
                breakdown: string().optional(),
                timeframe: string().optional(),
                since: string().optional(),
                until: string().optional(),
              }),
            },
            async (_ctx, { metricType, ...rest }) => call("/me/insights", { search: { ...rest, metric_type: metricType } }),
          ),
          tags: query(
            {
              description: "List media in which the account has been tagged by other users.",
              input: object({ fields, limit, after }),
            },
            async (_ctx, { fields, limit, after }) =>
              call("/me/tags", { search: { fields: fields ?? mediaFields, ...paging(limit, after) } }),
          ),
        },
        { title: "Profile", description: "The connected account's profile, insights and tags." },
      ),
      media: router(
        {
          list: query(
            {
              description: "List the account's media (photos, videos, reels, carousels), newest first.",
              input: object({ fields, limit, after, since: string().optional(), until: string().optional() }),
            },
            async (_ctx, { fields, limit, after, since, until }) =>
              call("/me/media", { search: { fields: fields ?? mediaFields, ...paging(limit, after), since, until } }),
          ),
          get: query(
            {
              description: "Get one media object by ID.",
              input: object({ mediaId: id, fields }),
            },
            async (_ctx, { mediaId, fields }) => call(node(mediaId), { search: { fields: fields ?? mediaFields } }),
          ),
          children: query(
            {
              description: "List the items of a carousel album.",
              input: object({ mediaId: id, fields }),
            },
            async (_ctx, { mediaId, fields }) =>
              call(`${node(mediaId)}/children`, { search: { fields: fields ?? "id,media_type,media_url,permalink,timestamp" } }),
          ),
          stories: query(
            {
              description: "List the account's currently live stories (24 hours).",
              input: object({ fields }),
            },
            async (_ctx, { fields }) => call("/me/stories", { search: { fields: fields ?? mediaFields } }),
          ),
          liveMedia: query(
            {
              description: "List the account's live videos, current or recent.",
              input: object({ fields }),
            },
            async (_ctx, { fields }) => call("/me/live_media", { search: { fields: fields ?? mediaFields } }),
          ),
          insights: query(
            {
              description:
                "Insights for one media object. Metrics include reach, views, likes, comments, shares, saved, total_interactions (feed/reels); stories add replies, navigation. Availability varies by media type.",
              input: object({ mediaId: id, metric: id, period: string().optional(), breakdown: string().optional() }),
            },
            async (_ctx, { mediaId, ...search }) => call(`${node(mediaId)}/insights`, { search }),
          ),
          setCommentsEnabled: mutation(
            {
              description: "Turn comments on or off for a media object.",
              input: object({ mediaId: id, enabled: boolean() }),
            },
            async (_ctx, { mediaId, enabled }) =>
              call(node(mediaId), { method: "POST", search: { comment_enabled: enabled } }),
          ),
        },
        { title: "Media", description: "Read posts, stories, carousels and their insights." },
      ),
      publishing: router(
        {
          createContainer: mutation(
            {
              description:
                "Step 1 of publishing: create a media container. Provide a public imageUrl for a photo, or videoUrl with mediaType 'REELS' or 'STORIES' (or 'VIDEO' for a video story); for a carousel item set isCarouselItem and omit caption; for a carousel set mediaType 'CAROUSEL' and children (container IDs). Returns the container id. Video containers process asynchronously; check getContainerStatus before publishing.",
              input: object({
                mediaType: string().optional(),
                imageUrl: string().optional(),
                videoUrl: string().optional(),
                caption: string().optional(),
                isCarouselItem: boolean().optional(),
                children: array(string()).optional(),
                altText: string().optional(),
                locationId: string().optional(),
                userTags: array(object({ username: string(), x: number().optional(), y: number().optional() })).optional(),
                coverUrl: string().optional(),
                shareToFeed: boolean().optional(),
                thumbOffset: number().optional(),
                collaborators: array(string()).optional(),
              }),
            },
            async (_ctx, input) =>
              call("/me/media", {
                method: "POST",
                body: {
                  media_type: input.mediaType,
                  image_url: input.imageUrl,
                  video_url: input.videoUrl,
                  caption: input.caption,
                  is_carousel_item: input.isCarouselItem,
                  children: input.children?.join(","),
                  alt_text: input.altText,
                  location_id: input.locationId,
                  user_tags: input.userTags,
                  cover_url: input.coverUrl,
                  share_to_feed: input.shareToFeed,
                  thumb_offset: input.thumbOffset,
                  collaborators: input.collaborators,
                },
              }),
          ),
          getContainerStatus: query(
            {
              description:
                "Check a media container: status_code is IN_PROGRESS, FINISHED, ERROR, EXPIRED or PUBLISHED. Wait for FINISHED before publishing.",
              input: object({ containerId: id }),
            },
            async (_ctx, { containerId }) => call(node(containerId), { search: { fields: "id,status,status_code" } }),
          ),
          publish: mutation(
            {
              description: "Step 2 of publishing: publish a FINISHED media container to the account. Returns the new media id.",
              input: object({ containerId: id }),
            },
            async (_ctx, { containerId }) =>
              call("/me/media_publish", { method: "POST", body: { creation_id: containerId } }),
          ),
          getLimit: query(
            {
              description: "Get the account's content publishing usage against the rolling 24-hour limit.",
              input: object({}),
            },
            async () => call("/me/content_publishing_limit", { search: { fields: "quota_usage,config" } }),
          ),
        },
        { title: "Publishing", description: "Publish photos, videos, reels, stories and carousels." },
      ),
      comments: router(
        {
          list: query(
            {
              description: "List top-level comments on a media object.",
              input: object({ mediaId: id, fields, limit, after }),
            },
            async (_ctx, { mediaId, fields, limit, after }) =>
              call(`${node(mediaId)}/comments`, { search: { fields: fields ?? commentFields, ...paging(limit, after) } }),
          ),
          get: query(
            {
              description: "Get one comment by ID.",
              input: object({ commentId: id, fields }),
            },
            async (_ctx, { commentId, fields }) => call(node(commentId), { search: { fields: fields ?? commentFields } }),
          ),
          replies: query(
            {
              description: "List replies to a comment.",
              input: object({ commentId: id, fields, limit, after }),
            },
            async (_ctx, { commentId, fields, limit, after }) =>
              call(`${node(commentId)}/replies`, { search: { fields: fields ?? commentFields, ...paging(limit, after) } }),
          ),
          create: mutation(
            {
              description: "Post a new top-level comment on a media object.",
              input: object({ mediaId: id, message: id }),
            },
            async (_ctx, { mediaId, message }) =>
              call(`${node(mediaId)}/comments`, { method: "POST", body: { message } }),
          ),
          reply: mutation(
            {
              description: "Reply publicly to a comment.",
              input: object({ commentId: id, message: id }),
            },
            async (_ctx, { commentId, message }) =>
              call(`${node(commentId)}/replies`, { method: "POST", body: { message } }),
          ),
          privateReply: mutation(
            {
              description:
                "Send a private direct message in reply to a comment (one per comment, within 7 days of the comment). Requires the messages permission.",
              input: object({ commentId: id, text: id }),
            },
            async (_ctx, { commentId, text }) =>
              call("/me/messages", { method: "POST", body: { recipient: { comment_id: commentId }, message: { text } } }),
          ),
          setHidden: mutation(
            {
              description: "Hide or unhide a comment.",
              input: object({ commentId: id, hide: boolean() }),
            },
            async (_ctx, { commentId, hide }) => call(node(commentId), { method: "POST", search: { hide } }),
          ),
          delete: mutation(
            {
              description: "Delete a comment on one of the account's media.",
              input: object({ commentId: id }),
            },
            async (_ctx, { commentId }) => call(node(commentId), { method: "DELETE" }),
          ),
        },
        { title: "Comments", description: "Read, post, reply to, hide and delete comments." },
      ),
      messages: router(
        {
          listConversations: query(
            {
              description: "List the account's direct message conversations, most recently active first.",
              input: object({ userId: string().optional(), fields, limit, after }),
            },
            async (_ctx, { userId, fields, limit, after }) =>
              call("/me/conversations", {
                search: { platform: "instagram", user_id: userId, fields: fields ?? "id,updated_time,participants", ...paging(limit, after) },
              }),
          ),
          getConversation: query(
            {
              description: "Get a conversation with its most recent messages (IDs, text, sender, time).",
              input: object({ conversationId: id, fields }),
            },
            async (_ctx, { conversationId, fields }) =>
              call(node(conversationId), {
                search: { fields: fields ?? "id,updated_time,participants,messages{id,created_time,from,to,message}" },
              }),
          ),
          getMessage: query(
            {
              description: "Get one message by ID, including attachments and shares.",
              input: object({ messageId: id, fields }),
            },
            async (_ctx, { messageId, fields }) =>
              call(node(messageId), { search: { fields: fields ?? "id,created_time,from,to,message,attachments,shares" } }),
          ),
          send: mutation(
            {
              description:
                "Send a direct message. Provide text, or attachmentUrl with attachmentType (image, video, audio). The recipient must have messaged the account within the last 24 hours. recipientId is the Instagram-scoped user ID.",
              input: object({
                recipientId: id,
                text: string().optional(),
                attachmentType: string().optional(),
                attachmentUrl: string().optional(),
              }),
            },
            async (_ctx, { recipientId, text, attachmentType, attachmentUrl }) =>
              call("/me/messages", {
                method: "POST",
                body: {
                  recipient: { id: recipientId },
                  message: attachmentUrl
                    ? { attachment: { type: attachmentType ?? "image", payload: { url: attachmentUrl } } }
                    : { text },
                },
              }),
          ),
          react: mutation(
            {
              description: "React to a message with an emoji reaction (e.g. 'love') or remove it.",
              input: object({ recipientId: id, messageId: id, reaction: string().optional(), remove: boolean().optional() }),
            },
            async (_ctx, { recipientId, messageId, reaction, remove }) =>
              call("/me/messages", {
                method: "POST",
                body: {
                  recipient: { id: recipientId },
                  sender_action: remove ? "unreact" : "react",
                  payload: { message_id: messageId, reaction },
                },
              }),
          ),
          markSeen: mutation(
            {
              description: "Mark the latest messages from a user as seen.",
              input: object({ recipientId: id }),
            },
            async (_ctx, { recipientId }) =>
              call("/me/messages", { method: "POST", body: { recipient: { id: recipientId }, sender_action: "mark_seen" } }),
          ),
        },
        { title: "Messages", description: "Direct message conversations and replies." },
      ),
    },
  );
}

export default defineApp(
  { user: { accounts: { instagram: instagram.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.instagram ?? [],
        (account) =>
          withApprovals(tools(tokenOf(account), fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Instagram",
        description:
          "Instagram professional (Business and Creator) accounts: profile and insights, media, publishing photos, reels, stories and carousels, comments, and direct messages.",
        instructions:
          "Works only for Instagram Business and Creator accounts, not personal accounts. Publishing is two steps: publishing.createContainer, wait until publishing.getContainerStatus reports FINISHED (videos take a while), then publishing.publish. Media URLs must be public. Direct messages can only be sent within 24 hours of the user's last message. List endpoints return paging.cursors.after; pass it as `after` for the next page.",
        icons,
      },
    ),
  }),
);

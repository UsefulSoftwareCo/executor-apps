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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://graph.facebook.com/v25.0";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const tokenOf = (account: Account) => (account.method === "oauth" ? account.fields.access_token : account.fields.token);

const facebook = defineProvider({
  name: "Facebook",
  hosts: ["graph.facebook.com"],
  auth: {
    // A user, system user or Page access token from the Meta app dashboard / Graph API Explorer.
    token: secrets({
      label: "Facebook access token (user, system user or Page)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Facebook Login with the user's own Meta app (App ID and App Secret).
    oauth: oauth2({
      authorizationUrl: "https://www.facebook.com/v25.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v25.0/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: [
        "public_profile",
        "pages_show_list",
        "pages_read_engagement",
        "pages_read_user_content",
        "pages_manage_posts",
        "pages_manage_engagement",
        "pages_manage_metadata",
        "pages_messaging",
        "read_insights",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me?fields=id,name`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}` },
    });
    const me = await decodeJson(response, object({ id: string(), name: string() }));
    return {
      accountInfo: {
        externalId: me.id,
        username: me.name,
        profileUrl: `https://www.facebook.com/${me.id}`,
      },
    };
  },
});

type Fetch = typeof fetch;
type CallInit = {
  method?: string;
  token?: string;
  search?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const id = string({ minLength: 1 });
const fields = string().optional();
const limit = number().optional();
const after = string().optional();

const pageFields = "id,name,category,about,link,fan_count,followers_count,website,phone,emails,location,verification_status";
const postFields =
  "id,message,created_time,updated_time,permalink_url,full_picture,status_type,is_published,scheduled_publish_time,from,shares,attachments";
const commentFields = "id,message,created_time,from,like_count,comment_count,can_hide,is_hidden,parent{id},permalink_url";

function tools(userToken: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: CallInit = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${init.token ?? userToken}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  const node = (value: string) => `/${encodeURIComponent(value)}`;
  const paging = (l: number | undefined, a: string | undefined) => ({ limit: l, after: a });

  // Page operations need the Page's own access token. A user or system user token can read it from the Page node.
  // A Page token itself has no access_token field on its own node; that case is detected by /me returning the same id.
  const cache = new Map<string, Promise<string>>();
  const pageToken = (pageId: string) => {
    const hit = cache.get(pageId);
    if (hit) return hit;
    const pending = call(node(pageId), { search: { fields: "id,access_token" } }).then(async (page) => {
      const value = (page as { access_token?: unknown } | null)?.access_token;
      if (typeof value === "string" && value.length > 0) return value;
      const me = (await call("/me", { search: { fields: "id" } })) as { id?: unknown } | null;
      if (me?.id === pageId) return userToken;
      throw new Error(
        `Facebook did not return a Page access token for ${pageId}. The connected user needs a role on this Page with the tasks the tool requires (see pages.list), and the token must carry the Pages permissions. If the account holds a Page token, it can only act on its own Page.`,
      );
    });
    cache.set(pageId, pending);
    pending.catch(() => cache.delete(pageId));
    return pending;
  };
  const asPage = async (pageId: string, path: string, init: CallInit = {}) =>
    call(path, { ...init, token: await pageToken(pageId) });

  return router({
    user: router(
      {
        me: query(
          {
            description: "Get the connected Facebook user (or system user): id and name.",
            input: object({ fields }),
          },
          async (_ctx, { fields }) => call("/me", { search: { fields: fields ?? "id,name" } }),
        ),
        permissions: query(
          {
            description: "List the permissions granted to the current token and whether each is granted or declined.",
            input: object({}),
          },
          async () => call("/me/permissions"),
        ),
      },
      { title: "User", description: "The connected user and granted permissions." },
    ),
    pages: router(
      {
        list: query(
          {
            description:
              "List the Pages the connected user manages, with the role tasks granted. Use the returned ids as pageId in the other tools.",
            input: object({ fields, limit, after }),
          },
          async (_ctx, { fields, limit, after }) =>
            call("/me/accounts", { search: { fields: fields ?? "id,name,category,tasks,link", ...paging(limit, after) } }),
        ),
        get: query(
          {
            description: "Get a Page: name, category, about, link, fan and follower counts, contact details.",
            input: object({ pageId: id, fields }),
          },
          async (_ctx, { pageId, fields }) => asPage(pageId, node(pageId), { search: { fields: fields ?? pageFields } }),
        ),
        update: mutation(
          {
            description: "Update a Page's about text, website, phone, emails or description.",
            input: object({
              pageId: id,
              about: string().optional(),
              description: string().optional(),
              website: string().optional(),
              phone: string().optional(),
              emails: array(string()).optional(),
            }),
          },
          async (_ctx, { pageId, ...rest }) => asPage(pageId, node(pageId), { method: "POST", body: rest }),
        ),
        roles: query(
          {
            description: "List the people who have roles on a Page.",
            input: object({ pageId: id, limit, after }),
          },
          async (_ctx, { pageId, limit, after }) =>
            asPage(pageId, `${node(pageId)}/roles`, { search: paging(limit, after) }),
        ),
        insights: query(
          {
            description:
              "Page insights. metric is a comma-separated list such as 'page_media_view,page_total_media_view_unique,page_follows,page_post_engagements,page_views_total'. Meta has deprecated many older metrics (for example page_impressions_unique and page_fans) and returns an invalid metric error for them. period is day, week or days_28 (page_follows is day only); since/until are dates or Unix timestamps.",
            input: object({
              pageId: id,
              metric: id,
              period: string().optional(),
              since: string().optional(),
              until: string().optional(),
              datePreset: string().optional(),
            }),
          },
          async (_ctx, { pageId, datePreset, ...search }) =>
            asPage(pageId, `${node(pageId)}/insights`, { search: { ...search, date_preset: datePreset } }),
        ),
        subscribedApps: query(
          {
            description: "List the apps subscribed to a Page's webhooks and their subscribed fields.",
            input: object({ pageId: id }),
          },
          async (_ctx, { pageId }) => asPage(pageId, `${node(pageId)}/subscribed_apps`),
        ),
      },
      { title: "Pages", description: "Pages managed by the connected user, their details and insights." },
    ),
    posts: router(
      {
        list: query(
          {
            description: "List posts published by a Page, newest first.",
            input: object({ pageId: id, fields, limit, after, since: string().optional(), until: string().optional() }),
          },
          async (_ctx, { pageId, fields, limit, after, since, until }) =>
            asPage(pageId, `${node(pageId)}/posts`, {
              search: { fields: fields ?? postFields, ...paging(limit, after), since, until },
            }),
        ),
        listScheduled: query(
          {
            description: "List a Page's scheduled and unpublished posts.",
            input: object({ pageId: id, fields, limit, after }),
          },
          async (_ctx, { pageId, fields, limit, after }) =>
            asPage(pageId, `${node(pageId)}/scheduled_posts`, { search: { fields: fields ?? postFields, ...paging(limit, after) } }),
        ),
        listVisitorPosts: query(
          {
            description: "List posts made on a Page by other people (visitor posts).",
            input: object({ pageId: id, fields, limit, after }),
          },
          async (_ctx, { pageId, fields, limit, after }) =>
            asPage(pageId, `${node(pageId)}/visitor_posts`, { search: { fields: fields ?? postFields, ...paging(limit, after) } }),
        ),
        get: query(
          {
            description: "Get one post by ID (format pageId_postId).",
            input: object({ pageId: id, postId: id, fields }),
          },
          async (_ctx, { pageId, postId, fields }) =>
            asPage(pageId, node(postId), { search: { fields: fields ?? postFields } }),
        ),
        create: mutation(
          {
            description:
              "Publish a text or link post to a Page feed. To schedule, set published=false and scheduledPublishTime (Unix timestamp 10 minutes to 30 days ahead). Returns the post id.",
            input: object({
              pageId: id,
              message: string().optional(),
              link: string().optional(),
              published: boolean().optional(),
              scheduledPublishTime: number().optional(),
              attachedMediaIds: array(string()).optional(),
              placeId: string().optional(),
            }),
          },
          async (_ctx, { pageId, attachedMediaIds, scheduledPublishTime, placeId, ...rest }) =>
            asPage(pageId, `${node(pageId)}/feed`, {
              method: "POST",
              body: {
                ...rest,
                scheduled_publish_time: scheduledPublishTime,
                place: placeId,
                attached_media: attachedMediaIds?.map((media_fbid) => ({ media_fbid })),
              },
            }),
        ),
        update: mutation(
          {
            description: "Edit a Page post's message, or publish a scheduled post by setting isPublished to true.",
            input: object({ pageId: id, postId: id, message: string().optional(), isPublished: boolean().optional() }),
          },
          async (_ctx, { pageId, postId, message, isPublished }) =>
            asPage(pageId, node(postId), { method: "POST", body: { message, is_published: isPublished } }),
        ),
        delete: mutation(
          {
            description: "Delete a Page post.",
            input: object({ pageId: id, postId: id }),
          },
          async (_ctx, { pageId, postId }) => asPage(pageId, node(postId), { method: "DELETE" }),
        ),
        insights: query(
          {
            description:
              "Insights for one post. metric is comma-separated, e.g. 'post_media_view,post_total_media_view_unique,post_clicks,post_reactions_by_type_total'. post_impressions and post_impressions_unique are deprecated by Meta.",
            input: object({ pageId: id, postId: id, metric: id, period: string().optional() }),
          },
          async (_ctx, { pageId, postId, ...search }) => asPage(pageId, `${node(postId)}/insights`, { search }),
        ),
      },
      { title: "Posts", description: "Read, publish, schedule, edit and delete Page posts." },
    ),
    media: router(
      {
        listPhotos: query(
          {
            description: "List photos on a Page. type is 'uploaded' (default) or 'tagged' or 'profile'.",
            input: object({ pageId: id, type: string().optional(), fields, limit, after }),
          },
          async (_ctx, { pageId, type, fields, limit, after }) =>
            asPage(pageId, `${node(pageId)}/photos`, {
              search: {
                type: type ?? "uploaded",
                fields: fields ?? "id,name,link,images,created_time,from",
                ...paging(limit, after),
              },
            }),
        ),
        uploadPhoto: mutation(
          {
            description:
              "Upload a photo from a public URL. By default it is published to the Page; set published=false to create an unpublished photo whose id can be passed as attachedMediaIds to posts.create.",
            input: object({
              pageId: id,
              url: id,
              caption: string().optional(),
              published: boolean().optional(),
              scheduledPublishTime: number().optional(),
            }),
          },
          async (_ctx, { pageId, scheduledPublishTime, ...rest }) =>
            asPage(pageId, `${node(pageId)}/photos`, {
              method: "POST",
              body: { ...rest, scheduled_publish_time: scheduledPublishTime },
            }),
        ),
        getPhoto: query(
          {
            description: "Get one photo by ID.",
            input: object({ pageId: id, photoId: id, fields }),
          },
          async (_ctx, { pageId, photoId, fields }) =>
            asPage(pageId, node(photoId), { search: { fields: fields ?? "id,name,link,images,created_time,from" } }),
        ),
        deletePhoto: mutation(
          {
            description: "Delete a photo.",
            input: object({ pageId: id, photoId: id }),
          },
          async (_ctx, { pageId, photoId }) => asPage(pageId, node(photoId), { method: "DELETE" }),
        ),
        listVideos: query(
          {
            description: "List videos on a Page.",
            input: object({ pageId: id, fields, limit, after }),
          },
          async (_ctx, { pageId, fields, limit, after }) =>
            asPage(pageId, `${node(pageId)}/videos`, {
              search: { fields: fields ?? "id,title,description,permalink_url,length,created_time,published", ...paging(limit, after) },
            }),
        ),
        uploadVideo: mutation(
          {
            description: "Upload a video to a Page from a public file URL (fileUrl). Processing continues asynchronously.",
            input: object({
              pageId: id,
              fileUrl: id,
              title: string().optional(),
              description: string().optional(),
              published: boolean().optional(),
              scheduledPublishTime: number().optional(),
            }),
          },
          async (_ctx, { pageId, fileUrl, scheduledPublishTime, ...rest }) =>
            asPage(pageId, `${node(pageId)}/videos`, {
              method: "POST",
              body: { ...rest, file_url: fileUrl, scheduled_publish_time: scheduledPublishTime },
            }),
        ),
        getVideo: query(
          {
            description: "Get one video by ID, including processing status.",
            input: object({ pageId: id, videoId: id, fields }),
          },
          async (_ctx, { pageId, videoId, fields }) =>
            asPage(pageId, node(videoId), {
              search: { fields: fields ?? "id,title,description,permalink_url,length,created_time,published,status" },
            }),
        ),
        updateVideo: mutation(
          {
            description: "Edit a video's title or description.",
            input: object({ pageId: id, videoId: id, title: string().optional(), description: string().optional() }),
          },
          async (_ctx, { pageId, videoId, ...rest }) => asPage(pageId, node(videoId), { method: "POST", body: rest }),
        ),
        deleteVideo: mutation(
          {
            description: "Delete a video.",
            input: object({ pageId: id, videoId: id }),
          },
          async (_ctx, { pageId, videoId }) => asPage(pageId, node(videoId), { method: "DELETE" }),
        ),
      },
      { title: "Media", description: "Photos and videos on a Page." },
    ),
    comments: router(
      {
        list: query(
          {
            description: "List comments on a post, photo or video. order is 'chronological' or 'reverse_chronological'; filter is 'toplevel' or 'stream'.",
            input: object({
              pageId: id,
              objectId: id,
              order: string().optional(),
              filter: string().optional(),
              fields,
              limit,
              after,
            }),
          },
          async (_ctx, { pageId, objectId, fields, limit, after, order, filter }) =>
            asPage(pageId, `${node(objectId)}/comments`, {
              search: { fields: fields ?? commentFields, order, filter, ...paging(limit, after) },
            }),
        ),
        get: query(
          {
            description: "Get one comment by ID.",
            input: object({ pageId: id, commentId: id, fields }),
          },
          async (_ctx, { pageId, commentId, fields }) =>
            asPage(pageId, node(commentId), { search: { fields: fields ?? commentFields } }),
        ),
        listReplies: query(
          {
            description: "List replies to a comment.",
            input: object({ pageId: id, commentId: id, fields, limit, after }),
          },
          async (_ctx, { pageId, commentId, fields, limit, after }) =>
            asPage(pageId, `${node(commentId)}/comments`, { search: { fields: fields ?? commentFields, ...paging(limit, after) } }),
        ),
        create: mutation(
          {
            description: "Comment on a post, photo or video as the Page, or reply to a comment by passing the comment id as objectId.",
            input: object({ pageId: id, objectId: id, message: id, attachmentUrl: string().optional() }),
          },
          async (_ctx, { pageId, objectId, message, attachmentUrl }) =>
            asPage(pageId, `${node(objectId)}/comments`, {
              method: "POST",
              body: { message, attachment_url: attachmentUrl },
            }),
        ),
        update: mutation(
          {
            description: "Edit a comment the Page made.",
            input: object({ pageId: id, commentId: id, message: id }),
          },
          async (_ctx, { pageId, commentId, message }) =>
            asPage(pageId, node(commentId), { method: "POST", body: { message } }),
        ),
        setHidden: mutation(
          {
            description: "Hide or unhide a comment on a Page's content.",
            input: object({ pageId: id, commentId: id, hidden: boolean() }),
          },
          async (_ctx, { pageId, commentId, hidden }) =>
            asPage(pageId, node(commentId), { method: "POST", body: { is_hidden: hidden } }),
        ),
        delete: mutation(
          {
            description: "Delete a comment.",
            input: object({ pageId: id, commentId: id }),
          },
          async (_ctx, { pageId, commentId }) => asPage(pageId, node(commentId), { method: "DELETE" }),
        ),
      },
      { title: "Comments", description: "Read, post, edit, hide and delete comments." },
    ),
    reactions: router(
      {
        list: query(
          {
            description: "List reactions (like, love, wow, haha, sad, angry) on a post, photo, video or comment. Pass type to filter, or summary=true for totals.",
            input: object({
              pageId: id,
              objectId: id,
              type: string().optional(),
              summary: boolean().optional(),
              limit,
              after,
            }),
          },
          async (_ctx, { pageId, objectId, type, summary, limit, after }) =>
            asPage(pageId, `${node(objectId)}/reactions`, { search: { type, summary, ...paging(limit, after) } }),
        ),
        like: mutation(
          {
            description: "Like a post, photo, video or comment as the Page.",
            input: object({ pageId: id, objectId: id }),
          },
          async (_ctx, { pageId, objectId }) => asPage(pageId, `${node(objectId)}/likes`, { method: "POST" }),
        ),
        unlike: mutation(
          {
            description: "Remove the Page's like from an object.",
            input: object({ pageId: id, objectId: id }),
          },
          async (_ctx, { pageId, objectId }) => asPage(pageId, `${node(objectId)}/likes`, { method: "DELETE" }),
        ),
      },
      { title: "Reactions", description: "Read and give reactions." },
    ),
    messages: router(
      {
        listConversations: query(
          {
            description: "List a Page's Messenger conversations, most recently active first.",
            input: object({ pageId: id, userId: string().optional(), fields, limit, after }),
          },
          async (_ctx, { pageId, userId, fields, limit, after }) =>
            asPage(pageId, `${node(pageId)}/conversations`, {
              search: {
                platform: "messenger",
                user_id: userId,
                fields: fields ?? "id,updated_time,message_count,unread_count,participants,snippet",
                ...paging(limit, after),
              },
            }),
        ),
        getConversation: query(
          {
            description: "Get a conversation with its most recent messages.",
            input: object({ pageId: id, conversationId: id, fields }),
          },
          async (_ctx, { pageId, conversationId, fields }) =>
            asPage(pageId, node(conversationId), {
              search: { fields: fields ?? "id,updated_time,participants,messages{id,created_time,from,to,message}" },
            }),
        ),
        getMessage: query(
          {
            description: "Get one Messenger message by ID, including attachments.",
            input: object({ pageId: id, messageId: id, fields }),
          },
          async (_ctx, { pageId, messageId, fields }) =>
            asPage(pageId, node(messageId), { search: { fields: fields ?? "id,created_time,from,to,message,attachments" } }),
        ),
        send: mutation(
          {
            description:
              "Send a Messenger message from the Page. Provide text, or attachmentUrl with attachmentType (image, video, audio, file). recipientId is the page-scoped user ID. messagingType is RESPONSE (default, within 24 hours of the user's last message), UPDATE or MESSAGE_TAG (then set tag, e.g. HUMAN_AGENT).",
            input: object({
              pageId: id,
              recipientId: id,
              text: string().optional(),
              attachmentType: string().optional(),
              attachmentUrl: string().optional(),
              messagingType: string().optional(),
              tag: string().optional(),
            }),
          },
          async (_ctx, { pageId, recipientId, text, attachmentType, attachmentUrl, messagingType, tag }) =>
            asPage(pageId, `${node(pageId)}/messages`, {
              method: "POST",
              body: {
                recipient: { id: recipientId },
                messaging_type: messagingType ?? "RESPONSE",
                tag,
                message: attachmentUrl
                  ? { attachment: { type: attachmentType ?? "image", payload: { url: attachmentUrl, is_reusable: true } } }
                  : { text },
              },
            }),
        ),
        senderAction: mutation(
          {
            description: "Send a sender action to a user: mark_seen, typing_on or typing_off.",
            input: object({ pageId: id, recipientId: id, action: id }),
          },
          async (_ctx, { pageId, recipientId, action }) =>
            asPage(pageId, `${node(pageId)}/messages`, {
              method: "POST",
              body: { recipient: { id: recipientId }, sender_action: action },
            }),
        ),
        privateReply: mutation(
          {
            description: "Send a private Messenger message in reply to a comment on the Page (once per comment, within 7 days).",
            input: object({ pageId: id, commentId: id, text: id }),
          },
          async (_ctx, { pageId, commentId, text }) =>
            asPage(pageId, `${node(pageId)}/messages`, {
              method: "POST",
              body: { recipient: { comment_id: commentId }, message: { text } },
            }),
        ),
      },
      { title: "Messages", description: "Messenger conversations and replies for a Page." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { facebook: facebook.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.facebook ?? [],
        (account) =>
          withApprovals(tools(tokenOf(account), fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Facebook",
        description:
          "Facebook Pages: list managed Pages, publish and schedule posts, photos and videos, moderate comments, read reactions and insights, and handle Messenger conversations.",
        instructions:
          "Pages only; personal profiles and groups are not available through the Graph API. Start with pages.list to get Page ids, then pass pageId to every other tool (the Page access token is resolved automatically). List endpoints return paging.cursors.after; pass it as `after` for the next page. Messenger replies must be sent within 24 hours of the user's last message unless a message tag applies.",
        icons,
      },
    ),
  }),
);

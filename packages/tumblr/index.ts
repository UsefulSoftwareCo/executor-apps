import {
  accountRouter,
  array,
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
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.tumblr.com/v2";

const tumblr = defineProvider({
  name: "Tumblr",
  hosts: ["api.tumblr.com"],
  auth: {
    // Register an application at https://www.tumblr.com/oauth/apps and add the redirect URL shown on the connect page.
    oauth: oauth2({
      authorizationUrl: "https://www.tumblr.com/oauth2/authorize",
      tokenUrl: "https://api.tumblr.com/v2/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["basic", "write", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/info`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const body = await decodeJson(response, object({ response: object({ user: object({ name: string() }) }) }));
    return { accountInfo: { externalId: body.response.user.name, username: body.response.user.name } };
  },
});

type Args = Record<string, unknown>;
type Call = (method: string, path: string, search: Args, body: Args | undefined) => Promise<unknown>;

const blogField = { blog: string() };
const blog = object(blogField);
const paging = { limit: number().optional(), offset: number().optional() };

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "Executor",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const parsed = await decodeJson(response, json());
    return (parsed as { response?: unknown }).response ?? parsed;
  };

  const b = (args: Args) => `/blog/${encodeURIComponent(String(args.blog))}`;
  const rest = (args: Args, omit: string[]) =>
    Object.fromEntries(Object.entries(args).filter(([k]) => !omit.includes(k)));

  return router(
    {
      user: router({
        info: query({ description: "The authenticated user, including all their blogs.", input: object({}) }, () =>
          call("GET", "/user/info", {}, undefined),
        ),
        limits: query({ description: "The user's daily limits (posts, uploads, follows) and what remains.", input: object({}) }, () =>
          call("GET", "/user/limits", {}, undefined),
        ),
        dashboard: query(
          {
            description: "Posts from the dashboard (blogs the user follows), newest first. Returns NPF when npf is true.",
            input: object({ ...paging, type: string().optional(), since_id: string().optional(), npf: string().optional() }),
          },
          (_c, a: Args) => call("GET", "/user/dashboard", a, undefined),
        ),
        likes: query(
          { description: "Posts the user has liked.", input: object({ ...paging, before: number().optional(), after: number().optional() }) },
          (_c, a: Args) => call("GET", "/user/likes", a, undefined),
        ),
        following: query({ description: "Blogs the user follows.", input: object(paging) }, (_c, a: Args) =>
          call("GET", "/user/following", a, undefined),
        ),
        filteredTags: query({ description: "Tags the user has filtered out.", input: object({}) }, () =>
          call("GET", "/user/filtered_tags", {}, undefined),
        ),
        follow: mutation(
          { description: "Follow a blog by URL (e.g. staff.tumblr.com) or email.", input: object({ url: string().optional(), email: string().optional() }) },
          (_c, a: Args) => call("POST", "/user/follow", {}, a),
        ),
        unfollow: mutation({ description: "Unfollow a blog by URL.", input: object({ url: string() }) }, (_c, a: Args) =>
          call("POST", "/user/unfollow", {}, a),
        ),
        like: mutation(
          { description: "Like a post. Needs the post id and its reblog_key.", input: object({ id: string(), reblog_key: string() }) },
          (_c, a: Args) => call("POST", "/user/like", {}, a),
        ),
        unlike: mutation(
          { description: "Unlike a post. Needs the post id and its reblog_key.", input: object({ id: string(), reblog_key: string() }) },
          (_c, a: Args) => call("POST", "/user/unlike", {}, a),
        ),
      }),
      blogs: router({
        info: query({ description: "Blog metadata: title, description, post count, avatar.", input: blog }, (_c, a: Args) =>
          call("GET", `${b(a)}/info`, {}, undefined),
        ),
        followers: query({ description: "Followers of a blog you own.", input: object({ ...blogField, ...paging }) }, (_c, a: Args) =>
          call("GET", `${b(a)}/followers`, rest(a, ["blog"]), undefined),
        ),
        following: query({ description: "Blogs a blog you own follows.", input: object({ ...blogField, ...paging }) }, (_c, a: Args) =>
          call("GET", `${b(a)}/following`, rest(a, ["blog"]), undefined),
        ),
        followedBy: query(
          { description: "Whether the named blog follows a blog you own.", input: object({ ...blogField, query: string() }) },
          (_c, a: Args) => call("GET", `${b(a)}/followed_by`, { query: a.query }, undefined),
        ),
        likes: query(
          { description: "Posts a blog has liked (when public).", input: object({ ...blogField, ...paging, before: number().optional(), after: number().optional() }) },
          (_c, a: Args) => call("GET", `${b(a)}/likes`, rest(a, ["blog"]), undefined),
        ),
        notifications: query(
          {
            description: "Activity notifications for a blog you own. Pass before as a timestamp to page; types filters kinds such as like, reblog_naked, follow.",
            input: object({ ...blogField, before: number().optional(), types: array(string()).optional(), rollups: string().optional() }),
          },
          (_c, a: Args) => call("GET", `${b(a)}/notifications`, rest(a, ["blog"]), undefined),
        ),
        blocks: query({ description: "Blogs blocked by a blog you own.", input: object({ ...blogField, ...paging }) }, (_c, a: Args) =>
          call("GET", `${b(a)}/blocks`, rest(a, ["blog"]), undefined),
        ),
        block: mutation(
          { description: "Block a blog, or the sender of an anonymous ask or submission via post_id.", input: object({ ...blogField, blocked_tumblelog: string().optional(), post_id: string().optional() }) },
          (_c, a: Args) => call("POST", `${b(a)}/blocks`, {}, rest(a, ["blog"])),
        ),
        unblock: mutation(
          { description: "Unblock a blog.", input: object({ ...blogField, blocked_tumblelog: string() }) },
          (_c, a: Args) => call("DELETE", `${b(a)}/blocks`, { blocked_tumblelog: a.blocked_tumblelog }, undefined),
        ),
      }),
      posts: router({
        list: query(
          {
            description:
              "Published posts of a blog, newest first. Optional type (text, quote, link, answer, video, audio, photo, chat), id, tag, limit (1-20), offset, before, after. Set npf to true for Neue Post Format.",
            input: object({
              ...blogField,
              ...paging,
              type: string().optional(),
              id: string().optional(),
              tag: string().optional(),
              before: number().optional(),
              after: number().optional(),
              reblog_info: string().optional(),
              notes_info: string().optional(),
              filter: string().optional(),
              npf: string().optional(),
            }),
          },
          (_c, a: Args) => call("GET", `${b(a)}/posts${a.type ? `/${encodeURIComponent(String(a.type))}` : ""}`, rest(a, ["blog", "type"]), undefined),
        ),
        get: query(
          { description: "A single post in Neue Post Format.", input: object({ ...blogField, postId: string() }) },
          (_c, a: Args) => call("GET", `${b(a)}/posts/${encodeURIComponent(String(a.postId))}`, {}, undefined),
        ),
        notes: query(
          { description: "Notes (likes, reblogs, replies) on a post.", input: object({ ...blogField, id: string(), before_timestamp: number().optional(), mode: string().optional() }) },
          (_c, a: Args) => call("GET", `${b(a)}/notes`, rest(a, ["blog"]), undefined),
        ),
        queue: query({ description: "Queued posts of a blog you own.", input: object({ ...blogField, ...paging, filter: string().optional() }) }, (_c, a: Args) =>
          call("GET", `${b(a)}/posts/queue`, rest(a, ["blog"]), undefined),
        ),
        drafts: query(
          { description: "Draft posts of a blog you own.", input: object({ ...blogField, before_id: string().optional(), filter: string().optional() }) },
          (_c, a: Args) => call("GET", `${b(a)}/posts/draft`, rest(a, ["blog"]), undefined),
        ),
        submissions: query(
          { description: "Pending submissions to a blog you own.", input: object({ ...blogField, offset: number().optional(), filter: string().optional() }) },
          (_c, a: Args) => call("GET", `${b(a)}/posts/submission`, rest(a, ["blog"]), undefined),
        ),
        create: mutation(
          {
            description:
              "Create a post in Neue Post Format. content is an array of blocks such as {type:'text',text:'Hello'} or {type:'image',media:[{type:'image/jpeg',url:'https://...'}]}. state is published, draft, queue or private; tags is a comma-separated string.",
            input: object({
              ...blogField,
              content: array(record(json())),
              layout: array(record(json())).optional(),
              state: string().optional(),
              publish_on: string().optional(),
              date: string().optional(),
              tags: string().optional(),
              source_url: string().optional(),
              send_to_twitter: string().optional(),
              is_private: string().optional(),
              slug: string().optional(),
            }),
          },
          (_c, a: Args) => call("POST", `${b(a)}/posts`, {}, rest(a, ["blog"])),
        ),
        reblog: mutation(
          {
            description: "Reblog a post (NPF) with optional added content. Needs parent_tumblelog_uuid, parent_post_id and reblog_key from the original post.",
            input: object({
              ...blogField,
              parent_tumblelog_uuid: string(),
              parent_post_id: string(),
              reblog_key: string(),
              content: array(record(json())).optional(),
              state: string().optional(),
              tags: string().optional(),
              hide_trail: string().optional(),
            }),
          },
          (_c, a: Args) => call("POST", `${b(a)}/posts`, {}, rest(a, ["blog"])),
        ),
        edit: mutation(
          {
            description: "Edit an existing post (NPF). Send the full replacement content, plus any of state, tags, publish_on.",
            input: object({
              ...blogField,
              postId: string(),
              content: array(record(json())).optional(),
              layout: array(record(json())).optional(),
              state: string().optional(),
              tags: string().optional(),
              publish_on: string().optional(),
            }),
          },
          (_c, a: Args) => call("PUT", `${b(a)}/posts/${encodeURIComponent(String(a.postId))}`, {}, rest(a, ["blog", "postId"])),
        ),
        delete: mutation({ description: "Delete a post.", input: object({ ...blogField, id: string() }) }, (_c, a: Args) =>
          call("POST", `${b(a)}/post/delete`, {}, { id: a.id }),
        ),
        reorderQueue: mutation(
          { description: "Move a queued post after another (insert_after 0 moves it to the top).", input: object({ ...blogField, post_id: string(), insert_after: string() }) },
          (_c, a: Args) => call("POST", `${b(a)}/posts/queue/reorder`, {}, rest(a, ["blog"])),
        ),
        shuffleQueue: mutation({ description: "Shuffle the queue of a blog.", input: blog }, (_c, a: Args) =>
          call("POST", `${b(a)}/posts/queue/shuffle`, {}, {}),
        ),
      }),
      tagged: query(
        { description: "Public posts with a tag across Tumblr.", input: object({ tag: string(), before: number().optional(), limit: number().optional(), filter: string().optional() }) },
        (_c, a: Args) => call("GET", "/tagged", a, undefined),
      ),
    },
    {},
  );
}

export default defineApp(
  { user: { accounts: { tumblr: tumblr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tumblr ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tumblr",
        description: "Blogs, posts, queue, drafts, followers, likes, notifications and tags on Tumblr.",
        instructions:
          "Posts are created and edited in Neue Post Format: content is an array of blocks. The blog argument is a blog name, hostname or UUID. Listing endpoints return at most 20 items; page with offset or before.",
        icons,
      },
    ),
  }),
);

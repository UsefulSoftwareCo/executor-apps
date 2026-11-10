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
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://oauth.reddit.com";
// Reddit asks for "<platform>:<app id>:<version> (by /u/<username>)". The app has no fixed owner username, so the
// owner part names Executor; the connected user is identified by the OAuth token instead.
const userAgent = "executor:sh.executor.reddit:1.0 (by /u/executor-app)";

const reddit = defineProvider({
  name: "Reddit",
  hosts: ["oauth.reddit.com", "www.reddit.com"],
  auth: {
    // Reddit offers no client registration: the connect page asks for the client of a "web app" created at reddit.com/prefs/apps.
    oauth: oauth2({
      authorizationUrl: "https://www.reddit.com/api/v1/authorize",
      tokenUrl: "https://www.reddit.com/api/v1/access_token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "identity",
        "read",
        "submit",
        "edit",
        "vote",
        "history",
        "mysubreddits",
        "subscribe",
        "privatemessages",
        "save",
        "report",
        "flair",
      ],
      // "permanent" makes Reddit issue a refresh token.
      authorizationParams: { duration: "permanent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v1/me?raw_json=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, "User-Agent": userAgent },
    });
    const me = await decodeJson(response, object({ id: string(), name: string() }));
    return {
      accountInfo: { externalId: me.id, username: me.name, profileUrl: `https://www.reddit.com/user/${me.name}` },
    };
  },
});

type Fetch = typeof fetch;
type Search = Record<string, string | number | boolean | undefined>;

const sub = string({ minLength: 1 });
const fullname = string({ minLength: 2 });
const limit = number().optional();
const after = string().optional();
const timeFilter = string().optional();

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; search?: Search; form?: Search } = {}) => {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("raw_json", "1");
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const form = new URLSearchParams({ api_type: "json" });
    for (const [key, value] of Object.entries(init.form ?? {})) if (value !== undefined) form.set(key, String(value));
    const post = init.method === "POST";
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent,
        ...(post ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body: post ? form.toString() : undefined,
    });
    const result = await decodeJson(response, json());
    const errors = (result as { json?: { errors?: unknown[] } } | null)?.json?.errors;
    if (Array.isArray(errors) && errors.length > 0) throw new Error(`Reddit rejected the request: ${JSON.stringify(errors)}`);
    return result;
  };
  const listing = { limit, after, before: string().optional(), count: number().optional() };
  const paging = ({ limit, after, before, count }: { limit?: number; after?: string; before?: string; count?: number }) => ({
    limit,
    after,
    before,
    count,
  });

  return router({
    account: router(
      {
        me: query({ description: "The connected Reddit account: name, id, karma, creation date.", input: object({}) }, async () =>
          call("/api/v1/me"),
        ),
        karma: query(
          { description: "Karma the connected account has earned per subreddit.", input: object({}) },
          async () => call("/api/v1/me/karma"),
        ),
        subscriptions: query(
          { description: "Subreddits the connected account is subscribed to.", input: object(listing) },
          async (_ctx, input) => call("/subreddits/mine/subscriber", { search: paging(input) }),
        ),
        moderating: query(
          { description: "Subreddits the connected account moderates.", input: object(listing) },
          async (_ctx, input) => call("/subreddits/mine/moderator", { search: paging(input) }),
        ),
        prefs: query({ description: "Preferences of the connected account.", input: object({}) }, async () =>
          call("/api/v1/me/prefs"),
        ),
      },
      { title: "Account", description: "The connected Reddit account." },
    ),
    subreddits: router(
      {
        about: query(
          { description: "Details of a subreddit: description, subscribers, rules link, type.", input: object({ subreddit: sub }) },
          async (_ctx, { subreddit }) => call(`/r/${encodeURIComponent(subreddit)}/about`),
        ),
        rules: query(
          { description: "Rules of a subreddit.", input: object({ subreddit: sub }) },
          async (_ctx, { subreddit }) => call(`/r/${encodeURIComponent(subreddit)}/about/rules`),
        ),
        search: query(
          { description: "Search subreddits by name and description.", input: object({ q: sub, ...listing }) },
          async (_ctx, { q, ...rest }) => call("/subreddits/search", { search: { q, ...paging(rest) } }),
        ),
        list: query(
          {
            description: "List subreddits. where is popular, new or default.",
            input: object({ where: string().default("popular"), ...listing }),
          },
          async (_ctx, { where, ...rest }) => call(`/subreddits/${encodeURIComponent(where)}`, { search: paging(rest) }),
        ),
        subscribe: mutation(
          { description: "Subscribe to a subreddit.", input: object({ subreddit: sub }) },
          async (_ctx, { subreddit }) =>
            call("/api/subscribe", { method: "POST", form: { action: "sub", sr_name: subreddit } }),
        ),
        unsubscribe: mutation(
          { description: "Unsubscribe from a subreddit.", input: object({ subreddit: sub }) },
          async (_ctx, { subreddit }) =>
            call("/api/subscribe", { method: "POST", form: { action: "unsub", sr_name: subreddit } }),
        ),
        linkFlairs: query(
          {
            description: "Post flairs the account can choose in a subreddit; use a flair_template_id when submitting.",
            input: object({ subreddit: sub }),
          },
          async (_ctx, { subreddit }) => call(`/r/${encodeURIComponent(subreddit)}/api/link_flair_v2`),
        ),
      },
      { title: "Subreddits", description: "Find, inspect, join and leave subreddits." },
    ),
    posts: router(
      {
        list: query(
          {
            description:
              "Posts in a subreddit (or the front page when subreddit is omitted) sorted by hot, new, top, rising, controversial or best. t limits top/controversial to hour, day, week, month, year or all.",
            input: object({ subreddit: string().optional(), sort: string().default("hot"), t: timeFilter, ...listing }),
          },
          async (_ctx, { subreddit, sort, t, ...rest }) =>
            call(`${subreddit ? `/r/${encodeURIComponent(subreddit)}` : ""}/${encodeURIComponent(sort)}`, {
              search: { t, ...paging(rest) },
            }),
        ),
        search: query(
          {
            description:
              "Search posts. Set subreddit and restrictToSubreddit to search within one subreddit. sort is relevance, hot, top, new or comments.",
            input: object({
              q: sub,
              subreddit: string().optional(),
              restrictToSubreddit: boolean().optional(),
              sort: string().optional(),
              t: timeFilter,
              ...listing,
            }),
          },
          async (_ctx, { q, subreddit, restrictToSubreddit, sort, t, ...rest }) =>
            call(`${subreddit ? `/r/${encodeURIComponent(subreddit)}` : ""}/search`, {
              search: { q, sort, t, restrict_sr: subreddit ? (restrictToSubreddit ?? true) : undefined, ...paging(rest) },
            }),
        ),
        get: query(
          {
            description: "Get posts, comments or subreddits by fullname (t3_ post, t1_ comment, t5_ subreddit), comma separated.",
            input: object({ names: sub }),
          },
          async (_ctx, { names }) => call("/api/info", { search: { id: names } }),
        ),
        comments: query(
          {
            description:
              "A post with its comment tree. postId is the base-36 id without the t3_ prefix. Returns [post listing, comment listing].",
            input: object({
              postId: sub,
              subreddit: string().optional(),
              sort: string().optional(),
              depth: number().optional(),
              limit,
              comment: string().optional(),
            }),
          },
          async (_ctx, { postId, subreddit, sort, depth, limit, comment }) =>
            call(`${subreddit ? `/r/${encodeURIComponent(subreddit)}` : ""}/comments/${encodeURIComponent(postId)}`, {
              search: { sort, depth, limit, comment },
            }),
        ),
        moreComments: query(
          {
            description: "Expand collapsed 'more' comment ids from a comment tree. children is a comma-separated list of ids.",
            input: object({ linkId: fullname, children: sub, sort: string().optional() }),
          },
          async (_ctx, { linkId, children, sort }) =>
            call("/api/morechildren", { search: { api_type: "json", link_id: linkId, children, sort } }),
        ),
        submit: mutation(
          {
            description:
              "Submit a post. kind is self (text, set text), link (set url), image, video or videogif. Some subreddits require a flair_id.",
            input: object({
              subreddit: sub,
              title: sub,
              kind: string().default("self"),
              text: string().optional(),
              url: string().optional(),
              flair_id: string().optional(),
              flair_text: string().optional(),
              nsfw: boolean().optional(),
              spoiler: boolean().optional(),
              sendreplies: boolean().optional(),
            }),
          },
          async (_ctx, { subreddit, nsfw, spoiler, sendreplies, ...rest }) =>
            call("/api/submit", {
              method: "POST",
              form: {
                ...rest,
                sr: subreddit,
                resubmit: true,
                nsfw: nsfw || undefined,
                spoiler: spoiler || undefined,
                // Reddit defaults sendreplies to true, so an explicit false must be sent.
                sendreplies,
              },
            }),
        ),
        crosspost: mutation(
          {
            description: "Crosspost an existing post (fullname t3_xxx) to another subreddit.",
            input: object({ subreddit: sub, title: sub, crosspostFullname: fullname }),
          },
          async (_ctx, { subreddit, title, crosspostFullname }) =>
            call("/api/submit", {
              method: "POST",
              form: { sr: subreddit, title, kind: "crosspost", crosspost_fullname: crosspostFullname },
            }),
        ),
        hide: mutation(
          { description: "Hide posts from listings. ids are comma-separated fullnames.", input: object({ ids: sub }) },
          async (_ctx, { ids }) => call("/api/hide", { method: "POST", form: { id: ids } }),
        ),
        unhide: mutation(
          { description: "Unhide posts. ids are comma-separated fullnames.", input: object({ ids: sub }) },
          async (_ctx, { ids }) => call("/api/unhide", { method: "POST", form: { id: ids } }),
        ),
        selectFlair: mutation(
          {
            description: "Set the flair of one of your posts using a flair_template_id from subreddits.linkFlairs.",
            input: object({ subreddit: sub, link: fullname, flair_template_id: sub, text: string().optional() }),
          },
          async (_ctx, { subreddit, ...form }) =>
            call(`/r/${encodeURIComponent(subreddit)}/api/selectflair`, { method: "POST", form }),
        ),
      },
      { title: "Posts", description: "Read, search and submit posts." },
    ),
    comments: router(
      {
        reply: mutation(
          {
            description: "Comment on a post (t3_xxx) or reply to a comment (t1_xxx) or message (t4_xxx). text is markdown.",
            input: object({ parent: fullname, text: sub }),
          },
          async (_ctx, { parent, text }) => call("/api/comment", { method: "POST", form: { thing_id: parent, text } }),
        ),
        edit: mutation(
          {
            description: "Edit the text of one of your posts (self) or comments.",
            input: object({ thing: fullname, text: sub }),
          },
          async (_ctx, { thing, text }) => call("/api/editusertext", { method: "POST", form: { thing_id: thing, text } }),
        ),
        delete: mutation(
          { description: "Delete one of your posts or comments.", input: object({ thing: fullname }) },
          async (_ctx, { thing }) => call("/api/del", { method: "POST", form: { id: thing } }),
        ),
      },
      { title: "Comments", description: "Comment, reply, edit and delete." },
    ),
    actions: router(
      {
        vote: mutation(
          {
            description: "Vote on a post or comment. direction is 1 (upvote), 0 (clear) or -1 (downvote).",
            input: object({ thing: fullname, direction: number() }),
          },
          async (_ctx, { thing, direction }) => call("/api/vote", { method: "POST", form: { id: thing, dir: direction } }),
        ),
        save: mutation(
          { description: "Save a post or comment, optionally into a category.", input: object({ thing: fullname, category: string().optional() }) },
          async (_ctx, { thing, category }) => call("/api/save", { method: "POST", form: { id: thing, category } }),
        ),
        unsave: mutation(
          { description: "Unsave a post or comment.", input: object({ thing: fullname }) },
          async (_ctx, { thing }) => call("/api/unsave", { method: "POST", form: { id: thing } }),
        ),
        report: mutation(
          {
            description: "Report a post or comment to the subreddit moderators.",
            input: object({ thing: fullname, reason: sub }),
          },
          async (_ctx, { thing, reason }) =>
            call("/api/report", { method: "POST", form: { thing_id: thing, reason: "other", other_reason: reason } }),
        ),
      },
      { title: "Actions", description: "Vote, save and report." },
    ),
    users: router(
      {
        about: query(
          { description: "Public profile of a user: karma, created date, trophies flag.", input: object({ username: sub }) },
          async (_ctx, { username }) => call(`/user/${encodeURIComponent(username)}/about`),
        ),
        content: query(
          {
            description:
              "A user's activity. where is overview, submitted, comments, upvoted, downvoted, saved, hidden or gilded; upvoted, downvoted, saved and hidden are only visible for the connected account.",
            input: object({
              username: sub,
              where: string().default("overview"),
              sort: string().optional(),
              t: timeFilter,
              ...listing,
            }),
          },
          async (_ctx, { username, where, sort, t, ...rest }) =>
            call(`/user/${encodeURIComponent(username)}/${encodeURIComponent(where)}`, { search: { sort, t, ...paging(rest) } }),
        ),
        trophies: query(
          { description: "Trophies of a user.", input: object({ username: sub }) },
          async (_ctx, { username }) => call(`/api/v1/user/${encodeURIComponent(username)}/trophies`),
        ),
      },
      { title: "Users", description: "Profiles and activity of Reddit users." },
    ),
    messages: router(
      {
        list: query(
          {
            description: "Private messages. where is inbox, unread, sent or comments (comment replies) or mentions.",
            input: object({ where: string().default("inbox"), ...listing }),
          },
          async (_ctx, { where, ...rest }) => call(`/message/${encodeURIComponent(where)}`, { search: paging(rest) }),
        ),
        send: mutation(
          {
            description: "Send a private message to a user (or a subreddit as r/name).",
            input: object({ to: sub, subject: sub, text: sub }),
          },
          async (_ctx, { to, subject, text }) => call("/api/compose", { method: "POST", form: { to, subject, text } }),
        ),
        markRead: mutation(
          { description: "Mark messages as read. ids are comma-separated fullnames.", input: object({ ids: sub }) },
          async (_ctx, { ids }) => call("/api/read_message", { method: "POST", form: { id: ids } }),
        ),
        markAllRead: mutation(
          { description: "Mark every message in the inbox as read.", input: object({}) },
          async () => call("/api/read_all_messages", { method: "POST" }),
        ),
      },
      { title: "Messages", description: "Inbox and private messages." },
    ),
  });
}

export default defineApp({ user: { accounts: { reddit: reddit.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.reddit ?? [],
      (account) =>
        withApprovals(tools(account.fields.access_token, fetch, signal), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "Reddit",
      description: "Subreddits, posts, comments, users and messages on Reddit: browse, search, submit, reply, vote, save and message.",
      icons,
    },
  ),
}));

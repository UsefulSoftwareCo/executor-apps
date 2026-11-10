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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://disqus.com/api/3.0";

const disqus = defineProvider({
  name: "Disqus",
  hosts: ["disqus.com"],
  auth: {
    // Register an application at https://disqus.com/api/applications/ to get the keys. The
    // access token is the account owner's non-expiring token from the application's page.
    keys: secrets({
      label: "API keys",
      fields: object({
        apiKey: string({ minLength: 1 }),
        apiSecret: string({ minLength: 1 }),
        accessToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/users/details.json`);
    url.searchParams.set("api_key", account.fields.apiKey);
    url.searchParams.set("api_secret", account.fields.apiSecret);
    url.searchParams.set("access_token", account.fields.accessToken);
    const response = await fetch(url.toString(), { signal });
    // users/details needs no authentication: without a valid access token Disqus answers as an
    // anonymous user (isAnonymous true), which must not pass the health check.
    const me = await decodeJson(response, object({ response: object({ id: string(), isAnonymous: boolean() }) }));
    if (me.response.isAnonymous) throw new Error("Disqus treated the access token as anonymous; it is invalid or revoked");
    return { accountInfo: { externalId: me.response.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Keys = { apiKey: string; apiSecret: string; accessToken: string };

// Disqus answers { code, response } with HTTP 200 (code 0) or an error status (400, 401, 403, 404,
// 408, 500, 503; 415 for bad formats). Non-2xx statuses are turned into errors that carry the
// envelope's response message. api_secret goes with every request deliberately: Executor runs
// server-side, which is the flow Disqus allows it for.
function client(keys: Keys, fetcher: Fetch, signal: AbortSignal | undefined) {
  const auth = { api_key: keys.apiKey, api_secret: keys.apiSecret, access_token: keys.accessToken };
  const encode = (params: Params) => {
    const out = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...auth })) {
      if (value === undefined || value === null) continue;
      // Multi-value parameters repeat the key.
      if (Array.isArray(value)) for (const item of value) out.append(key, String(item));
      else out.append(key, String(value));
    }
    return out;
  };
  const finish = async (response: Response) => {
    if (!response.ok) {
      const body = await response.text();
      let reason = body.slice(0, 300);
      try {
        const parsed = JSON.parse(body) as { code?: unknown; response?: unknown };
        if (typeof parsed.response === "string") reason = `code ${String(parsed.code)}: ${parsed.response}`;
      } catch {}
      throw new Error(`Disqus HTTP ${response.status}: ${reason}`);
    }
    return decodeJson(response, json());
  };
  return {
    get: async (path: string, params: Params = {}) =>
      finish(await fetcher(`${base}/${path}.json?${encode(params).toString()}`, { signal })),
    post: async (path: string, params: Params = {}) =>
      finish(
        await fetcher(`${base}/${path}.json`, {
          method: "POST",
          signal,
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: encode(params).toString(),
        }),
      ),
  };
}

type Client = ReturnType<typeof client>;

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const list = () => array(string()).optional();
const req = () => string({ minLength: 1 });

const paging = {
  cursor: optStr(),
  limit: optNum(),
  order: optStr(),
};
const pagingNote = " cursor is the previous response's cursor.next; limit is at most 100; order is asc or desc.";
const filters = array(number()).optional();
const includePost = list();
const postLookups = "since is a Unix timestamp or ISO datetime. include values: unapproved, approved, spam, deleted, flagged, highlighted (default approved). related values: forum, thread. filters are numeric codes 1-18 (1 anonymous, 2 has link, 5 flagged, 7 toxic, 9 shadow banned, 10 has media).";

function build(c: Client) {
  const forums = router(
    {
      details: query(
        { description: "Get a forum by its short name. attach may include counters, forumFeatures, forumPermissions and others.", input: object({ forum: req(), attach: list(), related: list() }) },
        (_x, p) => c.get("forums/details", p),
      ),
      listThreads: query(
        {
          description: "List threads in a forum. include values: open, closed, killed. related values: forum, author." + pagingNote,
          input: object({ forum: req(), since: optStr(), after: optStr(), thread: list(), related: list(), include: list(), ...paging }),
        },
        (_x, p) => c.get("forums/listThreads", p),
      ),
      listPosts: query(
        {
          description: "List posts in a forum. " + postLookups + pagingNote,
          input: object({ forum: req(), since: optStr(), related: list(), include: includePost, filters, query: optStr(), ...paging }),
        },
        (_x, p) => c.get("forums/listPosts", p),
      ),
      listCategories: query(
        { description: "List the categories of a forum." + pagingNote, input: object({ forum: req(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("forums/listCategories", p),
      ),
      listModerators: query(
        { description: "List the moderators of a forum.", input: object({ forum: req() }) },
        (_x, p) => c.get("forums/listModerators", p),
      ),
      listFollowers: query(
        { description: "List the users following a forum (beta)." + pagingNote, input: object({ forum: req(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("forums/listFollowers", p),
      ),
      listUserModerationHistory: query(
        { description: "List the moderation actions taken on a user's posts in a forum." + pagingNote, input: object({ forum: req(), user: req(), cursor: optStr(), limit: optNum() }) },
        (_x, p) => c.get("forums/listUserModerationHistory", p),
      ),
      listMostActiveUsers: query(
        { description: "List the most active commenters in a forum." + pagingNote, input: object({ forum: req(), ...paging }) },
        (_x, p) => c.get("forums/listMostActiveUsers", p),
      ),
      listMostLikedUsers: query(
        { description: "List the most liked commenters in a forum." + pagingNote, input: object({ forum: req(), ...paging }) },
        (_x, p) => c.get("forums/listMostLikedUsers", p),
      ),
      create: mutation(
        {
          description: "Create a forum. category is one of Tech, Living, Style, Business, Entertainment, Celebrity, Sports, Culture, Games, News.",
          input: object({ name: req(), short_name: req(), website: optStr(), category: optStr(), description: optStr(), language: optStr(), guidelines: optStr(), adultContent: optBool(), commentPolicyText: optStr(), commentPolicyLink: optStr(), orgID: optStr() }),
          approval: always(),
        },
        (_x, p) => c.post("forums/create", p),
      ),
      update: mutation(
        {
          description:
            "Update forum settings. Pass only the fields to change. sort: 1 oldest, 2 newest, 4 hot. votingType: 0 detailed, 1 downvote limited, 2 downvote disabled, 3 disabled. colorScheme: auto, dark, light. typeface: auto, serif, sans-serif. settings holds any other documented forums/update fields (for example flaggingEnabled, unapproveLinks, allowAnonPost, validateAllPosts, badgesEnabled, guidelines, adultContent).",
          input: object({ forum: req(), name: optStr(), description: optStr(), website: optStr(), category: optStr(), sort: optNum(), votingType: optNum(), colorScheme: optStr(), typeface: optStr(), linkColor: optStr(), twitterName: optStr(), commentPolicyLink: optStr(), commentPolicyText: optStr(), moderatorBadgeText: optStr(), settings: json().optional() }),
          approval: always(),
        },
        (_x, { settings, ...p }) => c.post("forums/update", { ...(typeof settings === "object" && settings !== null && !Array.isArray(settings) ? settings : {}), ...p }),
      ),
      addModerator: mutation(
        { description: "Make a user a moderator of a forum. user is a user ID.", input: object({ forum: req(), user: req(), canAdminister: optBool(), canEdit: optBool() }), approval: always() },
        (_x, p) => c.post("forums/addModerator", p),
      ),
      removeModerator: mutation(
        { description: "Remove a moderator from a forum, by moderator ID or by forum and user ID.", input: object({ moderator: optStr(), forum: optStr(), user: optStr() }), approval: always() },
        (_x, p) => c.post("forums/removeModerator", p),
      ),
      follow: mutation(
        { description: "Follow a forum as the authenticated user (beta).", input: object({ target: req() }), approval: always() },
        (_x, p) => c.post("forums/follow", p),
      ),
      unfollow: mutation(
        { description: "Unfollow a forum as the authenticated user (beta).", input: object({ target: req() }), approval: always() },
        (_x, p) => c.post("forums/unfollow", p),
      ),
    },
    { title: "Forums", description: "Sites (forums) registered with Disqus, identified by short name." },
  );

  const threads = router(
    {
      details: query(
        { description: "Get a thread by ID. With forum, thread may use the ident: or link: lookup forms (thread:ident, thread:link).", input: object({ thread: req(), forum: optStr(), related: list(), attach: list() }) },
        (_x, p) => c.get("threads/details", p),
      ),
      list: query(
        {
          description: "List threads across forums, categories or authors. include values: open, closed, killed. related values: forum, author, category. author is a user ID." + pagingNote,
          input: object({ forum: list(), category: list(), thread: list(), author: list(), since: optStr(), related: list(), attach: list(), include: list(), ...paging }),
        },
        (_x, p) => c.get("threads/list", p),
      ),
      listPosts: query(
        {
          description: "List the posts of a thread. " + postLookups + pagingNote,
          input: object({ thread: req(), forum: optStr(), since: optStr(), related: list(), include: includePost, filters, query: optStr(), ...paging }),
        },
        (_x, p) => c.get("threads/listPosts", p),
      ),
      listHot: query(
        { description: "List the hottest threads (beta). forum, category and author (user ID) narrow the results. related values: forum, author, category.", input: object({ forum: list(), category: list(), author: list(), limit: optNum(), related: list(), include: list() }) },
        (_x, p) => c.get("threads/listHot", p),
      ),
      listPopular: query(
        { description: "List popular threads (beta). interval: 1h, 6h, 12h, 1d, 3d, 7d (default), 30d, 90d.", input: object({ forum: list(), category: list(), interval: optStr(), limit: optNum(), related: list(), with_top_post: optBool() }) },
        (_x, p) => c.get("threads/listPopular", p),
      ),
      listUsersVotedThread: query(
        { description: "List the users who voted on a thread.", input: object({ thread: req(), forum: optStr(), ...paging }) },
        (_x, p) => c.get("threads/listUsersVotedThread", p),
      ),
      create: mutation(
        {
          description: "Create a thread in a forum (beta). url is at most 500 characters, identifier 300, slug 200.",
          input: object({ forum: req(), title: req(), category: optStr(), url: optStr(), date: optStr(), message: optStr(), identifier: optStr(), slug: optStr() }),
          approval: always(),
        },
        (_x, p) => c.post("threads/create", p),
      ),
      update: mutation(
        {
          description: "Update a thread (beta). Pass only the fields to change. Caller must be the thread author or a moderator.",
          input: object({ thread: req(), forum: optStr(), category: optStr(), title: optStr(), url: optStr(), author: optStr(), message: optStr(), identifier: optStr(), old_identifier: optStr(), slug: optStr(), validateAllPosts: optBool() }),
          approval: always(),
        },
        (_x, p) => c.post("threads/update", p),
      ),
      close: mutation(
        { description: "Close threads so no new comments are accepted. Requires moderator rights.", input: object({ thread: array(string({ minLength: 1 })), forum: optStr() }), approval: always() },
        (_x, p) => c.post("threads/close", p),
      ),
      open: mutation(
        { description: "Reopen closed threads. Requires moderator rights.", input: object({ thread: array(string({ minLength: 1 })), forum: optStr() }), approval: always() },
        (_x, p) => c.post("threads/open", p),
      ),
      remove: mutation(
        { description: "Delete threads. Requires moderator rights.", input: object({ thread: array(string({ minLength: 1 })), forum: optStr() }), approval: always() },
        (_x, p) => c.post("threads/remove", p),
      ),
      restore: mutation(
        { description: "Restore deleted threads. Requires moderator rights.", input: object({ thread: array(string({ minLength: 1 })), forum: optStr() }), approval: always() },
        (_x, p) => c.post("threads/restore", p),
      ),
      vote: mutation(
        { description: "Vote on a thread: vote is -1, 0 or 1.", input: object({ thread: req(), vote: number(), forum: optStr() }), approval: always() },
        (_x, p) => c.post("threads/vote", p),
      ),
      subscribe: mutation(
        { description: "Subscribe the authenticated user to email updates on a thread.", input: object({ thread: req() }), approval: always() },
        (_x, p) => c.post("threads/subscribe", p),
      ),
      unsubscribe: mutation(
        { description: "Unsubscribe the authenticated user from a thread, optionally by email.", input: object({ thread: req(), email: optStr() }), approval: always() },
        (_x, p) => c.post("threads/unsubscribe", p),
      ),
    },
    { title: "Threads", description: "Discussion threads attached to pages." },
  );

  const posts = router(
    {
      details: query(
        { description: "Get a post by ID. related values: forum, thread.", input: object({ post: req(), related: list() }) },
        (_x, p) => c.get("posts/details", p),
      ),
      list: query(
        {
          description:
            "List posts, by default in forums you moderate (use forum ':all' for all forums). sortType is date or priority. isEdited is 1 or 0. " + postLookups + pagingNote,
          input: object({ forum: list(), thread: list(), category: list(), start: optStr(), end: optStr(), since: optStr(), isEdited: optNum(), sortType: optStr(), related: list(), include: includePost, filters, query: optStr(), ...paging }),
        },
        (_x, p) => c.get("posts/list", p),
      ),
      listPopular: query(
        { description: "List popular posts (beta). interval: 30s, 1h, 6h, 12h, 1d, 3d, 7d (default), 30d, 60d, 90d. order is popular or best. forum ':all' covers every forum.", input: object({ forum: list(), thread: list(), category: list(), interval: optStr(), limit: optNum(), include: includePost, related: list(), query: optStr(), organization: optStr(), order: optStr() }) },
        (_x, p) => c.get("posts/listPopular", p),
      ),
      getContext: query(
        { description: "Get a post's ancestor chain (beta). depth is 1-10; order is asc, desc or popular.", input: object({ post: req(), depth: optNum(), order: optStr(), related: list() }) },
        (_x, p) => c.get("posts/getContext", p),
      ),
      listModerationHistory: query(
        { description: "List the moderation actions taken on a post.", input: object({ post: req(), ...paging }) },
        (_x, p) => c.get("posts/listModerationHistory", p),
      ),
      listReporters: query(
        { description: "List the users who reported a post.", input: object({ post: req() }) },
        (_x, p) => c.get("posts/listReporters", p),
      ),
      create: mutation(
        {
          description:
            "Create a comment. With a user access token the comment is posted as that user (do not send author_* then). thread is a thread ID, parent a post ID for replies, rating 1-5. state (unapproved, approved, spam, killed), date and ip_address need moderator rights.",
          input: object({ message: req(), thread: optStr(), parent: optStr(), rating: optNum(), author_email: optStr(), author_name: optStr(), author_url: optStr(), state: optStr(), date: optStr(), ip_address: optStr() }),
          approval: always(),
        },
        (_x, p) => c.post("posts/create", p),
      ),
      update: mutation(
        { description: "Edit a post (beta). Caller must be the author or a moderator.", input: object({ post: req(), message: req(), rating: optNum() }), approval: always() },
        (_x, p) => c.post("posts/update", p),
      ),
      approve: mutation(
        { description: "Approve posts. Requires moderator rights.", input: object({ post: array(string({ minLength: 1 })), newUserPremodBypass: optBool() }), approval: always() },
        (_x, p) => c.post("posts/approve", p),
      ),
      remove: mutation(
        { description: "Delete posts. Requires moderator rights.", input: object({ post: array(string({ minLength: 1 })) }), approval: always() },
        (_x, p) => c.post("posts/remove", p),
      ),
      restore: mutation(
        { description: "Restore deleted posts. Requires moderator rights.", input: object({ post: array(string({ minLength: 1 })) }), approval: always() },
        (_x, p) => c.post("posts/restore", p),
      ),
      spam: mutation(
        { description: "Mark posts as spam. Requires moderator rights.", input: object({ post: array(string({ minLength: 1 })) }), approval: always() },
        (_x, p) => c.post("posts/spam", p),
      ),
      vote: mutation(
        { description: "Vote on a post: vote is -1, 0 or 1.", input: object({ post: req(), vote: number() }), approval: always() },
        (_x, p) => c.post("posts/vote", p),
      ),
      report: mutation(
        { description: "Report a post. reason: 0 harassment, 1 spam, 2 inappropriate content, 3 threat, 4 impersonation, 5 private information, 6 disagree.", input: object({ post: req(), reason: optNum() }), approval: always() },
        (_x, p) => c.post("posts/report", p),
      ),
    },
    { title: "Posts", description: "Comments, their moderation and voting." },
  );

  const users = router(
    {
      details: query(
        { description: "Get a user. Omit user for the authenticated user. user is an ID, or use the username: lookup form.", input: object({ user: optStr(), attach: list() }) },
        (_x, p) => c.get("users/details", p),
      ),
      listPosts: query(
        { description: "List posts by a user (default: the authenticated user). " + postLookups + pagingNote, input: object({ user: optStr(), since: optStr(), related: list(), include: includePost, filters, ...paging }) },
        (_x, p) => c.get("users/listPosts", p),
      ),
      listActivity: query(
        { description: "List a user's activity (beta). include values: user, replies, following.", input: object({ user: optStr(), since: optStr(), related: list(), include: list(), query: optStr(), cursor: optStr(), limit: optNum() }) },
        (_x, p) => c.get("users/listActivity", p),
      ),
      listForums: query(
        { description: "List the forums a user owns (default: the authenticated user)." + pagingNote, input: object({ user: optStr(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("users/listForums", p),
      ),
      listActiveForums: query(
        { description: "List forums where a user is active.", input: object({ user: optStr(), ...paging }) },
        (_x, p) => c.get("users/listActiveForums", p),
      ),
      listFollowers: query(
        { description: "List the followers of a user (beta)." + pagingNote, input: object({ user: optStr(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("users/listFollowers", p),
      ),
      listFollowing: query(
        { description: "List the users a user follows (beta)." + pagingNote, input: object({ user: optStr(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("users/listFollowing", p),
      ),
      listFollowingForums: query(
        { description: "List the forums a user follows (beta)." + pagingNote, input: object({ user: optStr(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("users/listFollowingForums", p),
      ),
      listFollowingChannels: query(
        { description: "List the channels a user follows (beta). user is a user ID or omitted for the authenticated user. attach values: followsForum, forumCanDisableAds, forumForumCategory, counters, forumDaysAlive, forumFeatures, forumIntegration, forumNewPolicy, forumPermissions, channel_categories." + pagingNote, input: object({ user: optStr(), since_id: optStr(), attach: list(), excludeModerated: optBool(), excludeOwned: optBool(), includeFollowedPrimaryForums: optBool(), ...paging }) },
        (_x, p) => c.get("users/listFollowingChannels", p),
      ),
      listModeratedChannels: query(
        { description: "List the channels a user moderates (beta). user is a user ID or omitted for the authenticated user. attach values: followsForum, forumCanDisableAds, forumForumCategory, counters, forumDaysAlive, forumFeatures, forumIntegration, forumNewPolicy, forumPermissions, channel_categories." + pagingNote, input: object({ user: optStr(), since_id: optStr(), attach: list(), excludeOwned: optBool(), ...paging }) },
        (_x, p) => c.get("users/listModeratedChannels", p),
      ),
      listOwnedChannels: query(
        { description: "List the channels a user owns (beta). user is a user ID or omitted for the authenticated user. attach values: followsForum, forumCanDisableAds, forumForumCategory, counters, forumDaysAlive, forumFeatures, forumIntegration, forumNewPolicy, forumPermissions, channel_categories." + pagingNote, input: object({ user: optStr(), since_id: optStr(), attach: list(), ...paging }) },
        (_x, p) => c.get("users/listOwnedChannels", p),
      ),
      listMostActiveForums: query(
        { description: "List the forums where a user comments most (beta).", input: object({ user: optStr(), ...paging }) },
        (_x, p) => c.get("users/listMostActiveForums", p),
      ),
      checkUsername: query(
        { description: "Check whether a username is available.", input: object({ username: req() }) },
        (_x, p) => c.get("users/checkUsername", p),
      ),
      follow: mutation(
        { description: "Follow a user. target is a user ID or the username: lookup form.", input: object({ target: req() }), approval: always() },
        (_x, p) => c.post("users/follow", p),
      ),
      unfollow: mutation(
        { description: "Unfollow a user.", input: object({ target: req() }), approval: always() },
        (_x, p) => c.post("users/unfollow", p),
      ),
      removeFollower: mutation(
        { description: "Remove a follower of the authenticated user.", input: object({ target: req() }), approval: always() },
        (_x, p) => c.post("users/removeFollower", p),
      ),
      updateProfile: mutation(
        { description: "Update the authenticated user's profile. Disqus blanks any field that is not sent, so send all four with their current values. name is 2-30 characters, url at most 200, location at most 255.", input: object({ name: req(), about: req(), location: req(), url: req() }), approval: always() },
        (_x, p) => c.post("users/updateProfile", p),
      ),
      report: mutation(
        { description: "Report a user by ID. reason uses the same codes as posts.report (0-6).", input: object({ user: req(), reason: number() }), approval: always() },
        (_x, p) => c.post("users/report", p),
      ),
    },
    { title: "Users", description: "Commenter profiles, activity and follow relationships." },
  );

  const categories = router(
    {
      list: query(
        { description: "List categories of a forum." + pagingNote, input: object({ forum: req(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("categories/list", p),
      ),
      details: query(
        { description: "Get a category by ID.", input: object({ category: req() }) },
        (_x, p) => c.get("categories/details", p),
      ),
      listThreads: query(
        { description: "List threads in a category." + pagingNote, input: object({ category: req(), since: optStr(), related: list(), ...paging }) },
        (_x, p) => c.get("categories/listThreads", p),
      ),
      listPosts: query(
        { description: "List posts in a category. " + postLookups + pagingNote, input: object({ category: req(), since: optStr(), related: list(), include: includePost, ...paging }) },
        (_x, p) => c.get("categories/listPosts", p),
      ),
      create: mutation(
        { description: "Create a category in a forum. title is at most 50 characters.", input: object({ forum: req(), title: req(), default: optBool() }), approval: always() },
        (_x, p) => c.post("categories/create", p),
      ),
    },
    { title: "Categories", description: "Thread categories within a forum." },
  );

  const moderation = router(
    {
      blacklistList: query(
        { description: "List a forum's blacklist entries. type values: domain, word, ip, user, thread_slug, email." + pagingNote, input: object({ forum: array(string({ minLength: 1 })), type: list(), query: optStr(), since: optStr(), since_id: optStr(), related: list(), ...paging }) },
        (_x, p) => c.get("blacklists/list", p),
      ),
      blacklistAdd: mutation(
        {
          description: "Blacklist domains, words, IPs (CIDR), users or emails in a forum. notes is at most 50 characters. retroactiveAction: 1 kill, 2 spam existing matches.",
          input: object({ forum: req(), domain: list(), word: list(), ip: list(), user: list(), email: list(), notes: optStr(), shadowBan: optBool(), dateExpires: optStr(), retroactiveAction: optNum() }),
          approval: always(),
        },
        (_x, p) => c.post("blacklists/add", p),
      ),
      blacklistRemove: mutation(
        { description: "Remove blacklist entries from a forum, by entry ID or by value.", input: object({ forum: req(), blacklist: list(), domain: list(), word: list(), ip: list(), user: list(), email: list() }), approval: always() },
        (_x, p) => c.post("blacklists/remove", p),
      ),
      whitelistList: query(
        { description: "List a forum's whitelist entries." + pagingNote, input: object({ forum: array(string({ minLength: 1 })), query: optStr(), since_id: optStr(), ...paging }) },
        (_x, p) => c.get("whitelists/list", p),
      ),
      whitelistAdd: mutation(
        { description: "Whitelist users or emails in a forum. notes is at most 50 characters.", input: object({ forum: req(), user: list(), email: list(), notes: optStr() }), approval: always() },
        (_x, p) => c.post("whitelists/add", p),
      ),
      whitelistRemove: mutation(
        { description: "Remove whitelist entries from a forum, by entry id, user or email.", input: object({ forum: req(), id: list(), user: list(), email: list() }), approval: always() },
        (_x, p) => c.post("whitelists/remove", p),
      ),
      trustedDomainList: query(
        { description: "List a forum's trusted domains.", input: object({ forum: req() }) },
        (_x, p) => c.get("forums/trustedDomain/list", p),
      ),
      trustedDomainCreate: mutation(
        { description: "Add a trusted domain to a forum.", input: object({ forum: req(), domainName: req() }), approval: always() },
        (_x, p) => c.post("forums/trustedDomain/create", p),
      ),
      trustedDomainKill: mutation(
        { description: "Remove a trusted domain from a forum.", input: object({ forum: req(), domainName: req() }), approval: always() },
        (_x, p) => c.post("forums/trustedDomain/kill", p),
      ),
    },
    { title: "Moderation", description: "Blacklists, whitelists and trusted domains of a forum." },
  );

  return router({ forums, threads, posts, users, categories, moderation });
}

export default defineApp(
  { user: { accounts: { disqus: disqus.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.disqus ?? [], (account) => build(client(account.fields, fetch, signal)), { signal }),
      {
        title: "Disqus",
        description:
          "Disqus forums, threads, comments, users, categories and moderation lists (blacklists, whitelists, trusted domains) through the Disqus API 3.0.",
        icons,
      },
    ),
  }),
);

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
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.stackexchange.com/2.3";

type Account =
  | { method: "appKey"; fields: { key: string } }
  | { method: "accessToken"; fields: { key: string; token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// The app key (from https://stackapps.com/apps/oauth/register) raises the daily quota; an access token
// authorizes the "me" and write methods. Both travel as request parameters, as the API documents.
function credentials(account: Account): Record<string, string> {
  if (account.method === "appKey") return { key: account.fields.key };
  if (account.method === "accessToken") return { key: account.fields.key, access_token: account.fields.token };
  return { access_token: account.fields.access_token };
}

const stackexchange = defineProvider({
  name: "Stack Exchange",
  hosts: ["api.stackexchange.com"],
  auth: {
    appKey: secrets({
      label: "App key (public data only)",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
    accessToken: secrets({
      label: "App key and access token",
      fields: object({ key: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
    // Stack Exchange has no client registration: the connect page asks for an app's client registered
    // at https://stackapps.com/apps/oauth/register. Authorization and tokens come from stackoverflow.com;
    // the /json token endpoint returns JSON instead of a form-encoded body.
    oauth: oauth2({
      authorizationUrl: "https://stackoverflow.com/oauth",
      tokenUrl: "https://stackoverflow.com/oauth/access_token/json",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["no_expiry", "read_inbox", "write_access", "private_info"],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const params = new URLSearchParams({ ...credentials(account), site: "stackoverflow" });
    if (account.method === "appKey") {
      const response = await fetch(`${base}/info?${params}`, { signal });
      await decodeJson(response, object({ quota_max: number() }));
      return { accountInfo: { externalId: "app-key", displayName: "App key" } };
    }
    const response = await fetch(`${base}/me?${params}`, { signal });
    const me = await decodeJson(
      response,
      object({ items: json() }),
    );
    const user = (me.items as { account_id?: number; display_name?: string; link?: string }[])[0];
    if (user?.account_id === undefined) throw new Error("Stack Exchange returned no user for this token");
    return {
      accountInfo: {
        externalId: String(user.account_id),
        displayName: user.display_name ?? String(user.account_id),
        ...(user.link ? { profileUrl: user.link } : {}),
      },
    };
  },
});

type Params = Record<string, unknown>;

function client(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const auth = credentials(account);
  const seg = (value: string) => encodeURIComponent(value).replace(/%3B/gi, ";");
  const get = async (path: string, params: Params = {}) => {
    const u = new URL(`${base}${path}`);
    for (const [k, v] of Object.entries({ ...params, ...auth })) {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    }
    return decodeJson(await fetcher(u.toString(), { signal }), json());
  };
  const post = async (path: string, params: Params = {}) => {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...auth })) {
      if (v !== undefined && v !== null) body.set(k, String(v));
    }
    return decodeJson(
      await fetcher(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }),
      json(),
    );
  };
  return { seg, get, post };
}

type C = ReturnType<typeof client>;

const opt = () => string().optional();
const optNum = () => number().optional();
const site = string({ minLength: 1 });
const ids = string({ minLength: 1 });

// Pagination, sorting and filtering parameters shared by every collection method.
const listing = {
  site,
  page: optNum(),
  pagesize: optNum(),
  order: opt(),
  sort: opt(),
  min: opt(),
  max: opt(),
  fromdate: optNum(),
  todate: optNum(),
  filter: opt(),
};

const LISTING =
  " Returns a wrapper with items, has_more and quota_remaining. site is an API site parameter such as stackoverflow, serverfault or math. filter selects fields (use 'withbody' for post bodies); order is asc or desc; fromdate/todate are unix seconds.";

/** A GET method with a fixed path and no path parameters. */
function plain(c: C, path: string, description: string, extra: Record<string, ReturnType<typeof opt> | ReturnType<typeof optNum>> = {}) {
  return query(
    { description: description + LISTING, input: object({ ...listing, ...extra }) },
    async (_ctx, input: Params) => c.get(path, input),
  );
}

/** A GET method whose path ends in semicolon-delimited ids (or tags) followed by a suffix. */
function byIds(
  c: C,
  prefix: string,
  suffix: string,
  description: string,
  extra: Record<string, ReturnType<typeof opt> | ReturnType<typeof optNum>> = {},
  idName = "ids",
) {
  return query(
    {
      description: `${description} ${idName} is a semicolon-delimited list (at most 100).${LISTING}`,
      input: object({ ...listing, [idName]: ids, ...extra }),
    },
    async (_ctx, input: Params) => {
      const { [idName]: value, ...rest } = input;
      return c.get(`${prefix}/${c.seg(String(value))}${suffix}`, rest);
    },
  );
}

/** A GET method on the authenticated user ("/me/..."). */
function me(c: C, suffix: string, description: string, extra: Record<string, ReturnType<typeof opt> | ReturnType<typeof optNum>> = {}) {
  return plain(c, `/me${suffix}`, `${description} Requires an access token.`, extra);
}

const writeFields = { site, filter: opt(), preview: boolean().optional() };

function write(c: C, path: (input: Params) => string, description: string, input: Record<string, unknown>) {
  return mutation(
    { description: `${description} Requires an access token with the write_access scope. Accounts using an app key send it too; OAuth accounts send the token alone, which Stack Exchange may reject for apps that require a key.`, input: object({ ...writeFields, ...input } as never), approval: always() },
    async (_ctx, args: any) => {
      const { ...rest } = args;
      return c.post(path(args), rest);
    },
  );
}

function tools(c: C) {
  const idPath = (prefix: string, key: string, suffix: string) => (input: Params) =>
    `${prefix}/${c.seg(String(input[key]))}${suffix}`;
  const strip = (input: Params, key: string) => {
    const { [key]: _removed, ...rest } = input;
    return rest;
  };
  const writeById = (prefix: string, key: string, suffix: string, description: string, input: Record<string, unknown>) =>
    mutation(
      {
        description: `${description} Requires an access token with the write_access scope. Accounts using an app key send it too; OAuth accounts send the token alone, which Stack Exchange may reject for apps that require a key.`,
        input: object({ ...writeFields, [key]: ids, ...input } as never),
        approval: always(),
      },
      async (_ctx, args: any) => c.post(idPath(prefix, key, suffix)(args), strip(args, key)),
    );

  return router({
    site: router({
      info: query(
        {
          description: "Statistics and quota for one Stack Exchange site: question, answer and user counts, API revision.",
          input: object({ site, filter: opt() }),
        },
        async (_ctx, input: Params) => c.get("/info", input),
      ),
      associatedAccounts: query(
        {
          description: "Network accounts (one per site) for the given network account ids (semicolon-delimited, at most 100). Not tied to a single site.",
          input: object({ ids, page: optNum(), pagesize: optNum() }),
        },
        async (_ctx, { ids: value, ...rest }: Params) => c.get(`/users/${c.seg(String(value))}/associated`, rest),
      ),
    }),
    questions: router({
      list: plain(c, "/questions", "All questions on a site. sort: activity, creation, votes, hot, week, month."),
      get: byIds(c, "/questions", "", "Questions by id."),
      answers: byIds(c, "/questions", "/answers", "Answers to the given questions."),
      comments: byIds(c, "/questions", "/comments", "Comments on the given questions."),
      linked: byIds(c, "/questions", "/linked", "Questions that link to the given questions."),
      related: byIds(c, "/questions", "/related", "Questions related to the given questions."),
      timeline: byIds(c, "/questions", "/timeline", "Timeline events of the given questions."),
      featured: plain(c, "/questions/featured", "Questions with an active bounty."),
      unanswered: plain(c, "/questions/unanswered", "Questions with no upvoted or accepted answers.", { tagged: opt() }),
      noAnswers: plain(c, "/questions/no-answers", "Questions with no answers at all."),
      search: plain(c, "/search", "Search question titles and tags. Give tagged and/or intitle.", {
        tagged: opt(),
        nottagged: opt(),
        intitle: opt(),
      }),
      advancedSearch: plain(
        c,
        "/search/advanced",
        "Full search over questions: free-text q, title, body, tagged, nottagged, user, url, answers, views, closed, migrated, wiki, accepted.",
        {
          q: opt(),
          title: opt(),
          body: opt(),
          tagged: opt(),
          nottagged: opt(),
          user: optNum(),
          url: opt(),
          answers: optNum(),
          views: optNum(),
          closed: opt(),
          migrated: opt(),
          wiki: opt(),
          accepted: opt(),
          notice: opt(),
        },
      ),
      excerpts: plain(c, "/search/excerpts", "Search with highlighted excerpts of questions and answers.", {
        q: opt(),
        title: opt(),
        body: opt(),
        tagged: opt(),
        nottagged: opt(),
        user: optNum(),
        accepted: opt(),
        answers: optNum(),
        views: optNum(),
        closed: opt(),
        wiki: opt(),
      }),
      similar: plain(c, "/similar", "Questions similar to a given title. Give title and optionally tagged.", {
        title: opt(),
        tagged: opt(),
        nottagged: opt(),
      }),
      faqsForTags: byIds(c, "/tags", "/faq", "Frequently asked questions for the given tags.", {}, "tags"),
      add: write(c, () => "/questions/add", "Post a new question. title, body (markdown) and tags (semicolon-delimited) are required.", {
        title: string({ minLength: 1 }),
        body: string({ minLength: 1 }),
        tags: string({ minLength: 1 }),
      }),
      edit: writeById("/questions", "id", "/edit", "Edit a question. Send any of title, body, tags, comment.", {
        title: opt(),
        body: opt(),
        tags: opt(),
        comment: opt(),
      }),
      delete: writeById("/questions", "id", "/delete", "Delete a question you own.", {}),
      upvote: writeById("/questions", "id", "/upvote", "Upvote a question.", {}),
      undoUpvote: writeById("/questions", "id", "/upvote/undo", "Retract your upvote on a question.", {}),
      downvote: writeById("/questions", "id", "/downvote", "Downvote a question.", {}),
      undoDownvote: writeById("/questions", "id", "/downvote/undo", "Retract your downvote on a question.", {}),
      favorite: writeById("/questions", "id", "/favorite", "Add a question to your favorites.", {}),
      undoFavorite: writeById("/questions", "id", "/favorite/undo", "Remove a question from your favorites.", {}),
      addComment: writeById("/questions", "id", "/comments/add", "Comment on a question.", { body: string({ minLength: 1 }) }),
      addAnswer: writeById("/questions", "id", "/answers/add", "Post an answer to a question.", { body: string({ minLength: 1 }) }),
    }),
    answers: router({
      list: plain(c, "/answers", "All answers on a site. sort: activity, creation, votes."),
      get: byIds(c, "/answers", "", "Answers by id."),
      comments: byIds(c, "/answers", "/comments", "Comments on the given answers."),
      edit: writeById("/answers", "id", "/edit", "Edit an answer. Send body and optionally comment.", {
        body: string({ minLength: 1 }),
        comment: opt(),
      }),
      delete: writeById("/answers", "id", "/delete", "Delete an answer you own.", {}),
      accept: writeById("/answers", "id", "/accept", "Accept an answer to your question.", {}),
      undoAccept: writeById("/answers", "id", "/accept/undo", "Un-accept an answer to your question.", {}),
      upvote: writeById("/answers", "id", "/upvote", "Upvote an answer.", {}),
      undoUpvote: writeById("/answers", "id", "/upvote/undo", "Retract your upvote on an answer.", {}),
      downvote: writeById("/answers", "id", "/downvote", "Downvote an answer.", {}),
      undoDownvote: writeById("/answers", "id", "/downvote/undo", "Retract your downvote on an answer.", {}),
      addComment: writeById("/answers", "id", "/comments/add", "Comment on an answer.", { body: string({ minLength: 1 }) }),
    }),
    comments: router({
      list: plain(c, "/comments", "All comments on a site. sort: creation, votes."),
      get: byIds(c, "/comments", "", "Comments by id."),
      edit: writeById("/comments", "id", "/edit", "Edit a comment you own.", { body: string({ minLength: 1 }) }),
      delete: writeById("/comments", "id", "/delete", "Delete a comment you own.", {}),
      upvote: writeById("/comments", "id", "/upvote", "Upvote a comment.", {}),
      undoUpvote: writeById("/comments", "id", "/upvote/undo", "Retract your upvote on a comment.", {}),
    }),
    posts: router({
      list: plain(c, "/posts", "All posts (questions and answers) on a site."),
      get: byIds(c, "/posts", "", "Posts (questions or answers) by id."),
      comments: byIds(c, "/posts", "/comments", "Comments on the given posts."),
      revisions: byIds(c, "/posts", "/revisions", "Revision history of the given posts."),
      suggestedEdits: byIds(c, "/posts", "/suggested-edits", "Suggested edits on the given posts."),
      revisionsByGuid: byIds(c, "/revisions", "", "Revisions by revision guid (semicolon-delimited).", {}, "ids"),
    }),
    suggestedEdits: router({
      list: plain(c, "/suggested-edits", "All suggested edits on a site."),
      get: byIds(c, "/suggested-edits", "", "Suggested edits by id."),
    }),
    users: router({
      list: plain(c, "/users", "All users on a site. Filter by inname; sort: reputation, creation, name, modified.", { inname: opt() }),
      get: byIds(c, "/users", "", "Users by id."),
      moderators: plain(c, "/users/moderators", "Moderators of a site."),
      electedModerators: plain(c, "/users/moderators/elected", "Elected moderators of a site."),
      questions: byIds(c, "/users", "/questions", "Questions asked by the given users."),
      answers: byIds(c, "/users", "/answers", "Answers posted by the given users."),
      comments: byIds(c, "/users", "/comments", "Comments written by the given users."),
      favorites: byIds(c, "/users", "/favorites", "Questions the given users have favorited."),
      mentioned: byIds(c, "/users", "/mentioned", "Comments that mention the given users."),
      noAnswerQuestions: byIds(c, "/users", "/questions/no-answers", "Questions by the given users that have no answers."),
      unacceptedQuestions: byIds(c, "/users", "/questions/unaccepted", "Questions by the given users with no accepted answer."),
      unansweredQuestions: byIds(c, "/users", "/questions/unanswered", "Questions by the given users that are unanswered."),
      badges: byIds(c, "/users", "/badges", "Badges earned by the given users."),
      tags: byIds(c, "/users", "/tags", "Tags the given users are active in."),
      reputation: byIds(c, "/users", "/reputation", "Reputation changes of the given users."),
      reputationHistory: byIds(c, "/users", "/reputation-history", "Full reputation history (public) of the given users."),
      timeline: byIds(c, "/users", "/timeline", "Activity timeline of the given users."),
      writePermissions: byIds(c, "/users", "/write-permissions", "Write permissions (rate limits per action) of the given users."),
      privileges: byIds(c, "/users", "/privileges", "Privileges held by the given users."),
    }),
    me: router({
      get: me(c, "", "The authenticated user's profile."),
      questions: me(c, "/questions", "Questions asked by the authenticated user."),
      answers: me(c, "/answers", "Answers posted by the authenticated user."),
      comments: me(c, "/comments", "Comments written by the authenticated user."),
      favorites: me(c, "/favorites", "The authenticated user's favorite questions."),
      badges: me(c, "/badges", "Badges earned by the authenticated user."),
      tags: me(c, "/tags", "Tags the authenticated user is active in."),
      reputation: me(c, "/reputation", "Reputation changes of the authenticated user."),
      reputationHistory: me(c, "/reputation-history/full", "Full private reputation history of the authenticated user."),
      timeline: me(c, "/timeline", "Activity timeline of the authenticated user."),
      mentioned: me(c, "/mentioned", "Comments that mention the authenticated user."),
      associated: me(c, "/associated", "The authenticated user's accounts across the network."),
      merges: me(c, "/merges", "Account merges of the authenticated user."),
      inbox: me(c, "/inbox", "The authenticated user's inbox. Needs the read_inbox scope."),
      unreadInbox: me(c, "/inbox/unread", "Unread items in the inbox. Needs the read_inbox scope."),
      notifications: me(c, "/notifications", "The authenticated user's notifications. Needs the read_inbox scope."),
      unreadNotifications: me(c, "/notifications/unread", "Unread notifications. Needs the read_inbox scope."),
      suggestedEdits: me(c, "/suggested-edits", "Suggested edits made by the authenticated user."),
      privileges: me(c, "/privileges", "Privileges held by the authenticated user."),
      writePermissions: me(c, "/write-permissions", "Write permissions of the authenticated user."),
    }),
    tags: router({
      list: plain(c, "/tags", "All tags on a site. Filter by inname; sort: popular, activity, name.", { inname: opt() }),
      info: byIds(c, "/tags", "/info", "Details of the given tags.", {}, "tags"),
      wikis: byIds(c, "/tags", "/wikis", "Wiki excerpts of the given tags.", {}, "tags"),
      related: byIds(c, "/tags", "/related", "Tags that commonly appear with the given tags.", {}, "tags"),
      synonyms: plain(c, "/tags/synonyms", "All tag synonyms on a site."),
      synonymsFor: byIds(c, "/tags", "/synonyms", "Synonyms of the given tags.", {}, "tags"),
      moderatorOnly: plain(c, "/tags/moderator-only", "Tags only moderators can apply."),
      required: plain(c, "/tags/required", "Tags that must be applied to a question."),
      topAnswerers: query(
        {
          description: `Top answerers for a tag. period is all_time or month.${LISTING}`,
          input: object({ ...listing, tag: ids, period: string({ minLength: 1 }) }),
        },
        async (_ctx, { tag, period, ...rest }: Params) => c.get(`/tags/${c.seg(String(tag))}/top-answerers/${c.seg(String(period))}`, rest),
      ),
      topAskers: query(
        {
          description: `Top askers for a tag. period is all_time or month.${LISTING}`,
          input: object({ ...listing, tag: ids, period: string({ minLength: 1 }) }),
        },
        async (_ctx, { tag, period, ...rest }: Params) => c.get(`/tags/${c.seg(String(tag))}/top-askers/${c.seg(String(period))}`, rest),
      ),
    }),
    badges: router({
      list: plain(c, "/badges", "All badges on a site, sorted by rank, name or type."),
      byName: plain(c, "/badges/name", "All non-tag-based badges, by name."),
      byTag: plain(c, "/badges/tags", "All tag-based badges."),
      get: byIds(c, "/badges", "", "Badges by id."),
      recipients: byIds(c, "/badges", "/recipients", "Recent recipients of the given badges."),
      allRecipients: plain(c, "/badges/recipients", "Recent badge recipients on a site."),
    }),
    network: router({
      sites: query(
        { description: "Every site in the Stack Exchange network with its api_site_parameter.", input: object({ page: optNum(), pagesize: optNum(), filter: opt() }) },
        async (_ctx, input: Params) => c.get("/sites", input),
      ),
      privileges: plain(c, "/privileges", "Privileges on a site and the reputation each needs."),
      events: query(
        {
          description: "Recent site events (new posts, edits, comments). Needs an access token. since is unix seconds.",
          input: object({ site, since: optNum(), pagesize: optNum(), filter: opt() }),
        },
        async (_ctx, input: Params) => c.get("/events", input),
      ),
      errors: query(
        { description: "Describes an API error code by id; useful for testing error handling.", input: object({ id: number() }) },
        async (_ctx, { id }: Params) => c.get(`/errors/${c.seg(String(id))}`),
      ),
      accessTokens: query(
        { description: "Inspect access tokens (semicolon-delimited): scopes, account and expiry.", input: object({ accessTokens: ids }) },
        async (_ctx, { accessTokens }: Params) => c.get(`/access-tokens/${c.seg(String(accessTokens))}`),
      ),
      invalidateTokens: mutation(
        { description: "Invalidate access tokens (semicolon-delimited), revoking them for the app.", input: object({ accessTokens: ids }), approval: always() },
        async (_ctx, { accessTokens }: { accessTokens: string }) => c.get(`/access-tokens/${c.seg(accessTokens)}/invalidate`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { stackexchange: stackexchange.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.stackexchange ?? [], (account) => tools(client(account, fetch, signal)), { signal }),
      {
        title: "Stack Exchange",
        description:
          "Questions, answers, comments, users, tags, badges and search across Stack Overflow and the rest of the Stack Exchange network.",
        icons,
      },
    ),
  }),
);

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

const base = "https://canny.io/api";

const canny = defineProvider({
  name: "Canny",
  hosts: ["canny.io"],
  auth: {
    // Canny has no OAuth for its REST API; the secret key from company settings is the only method.
    apiKey: secrets({
      label: "Secret API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/boards/list`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: account.fields.token }),
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

// Every Canny endpoint is a POST with a JSON body that carries the secret key as `apiKey`.
async function call(fetcher: Fetch, signal: AbortSignal | undefined, apiKey: string, path: string, body: Record<string, unknown>) {
  const response = await fetcher(`${base}${path}`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, apiKey }),
  });
  return decodeJson(response, json());
}

// Schema shorthands: `reqString` is a required string, `requiredId` a required non-empty id, and the
// `opt*` helpers are optional fields. The framework's string() takes no description option, so the
// field names and each tool's description carry the meaning.
const reqString = string();
const requiredId = string({ minLength: 1 });
const optString = string().optional();
const optNumber = number().optional();
const optBool = boolean().optional();
const limit = number().optional();
const cursor = string().optional();

type Spec = { path: string; description: string; kind: "query" | "mutation"; input: Record<string, any> };
const q = (path: string, description: string, input: Record<string, any> = {}): Spec => ({ path, description, kind: "query", input });
const m = (path: string, description: string, input: Record<string, any>): Spec => ({ path, description, kind: "mutation", input });

const groups: Record<string, Record<string, Spec>> = {
  boards: {
    list: q("/v1/boards/list", "List all boards."),
    retrieve: q("/v1/boards/retrieve", "Get a board by id.", { id: requiredId }),
  },
  categories: {
    list: q("/v1/categories/list", "List categories, optionally for one board.", { boardID: optString, limit, skip: optNumber }),
    retrieve: q("/v1/categories/retrieve", "Get a category by id.", { id: requiredId }),
    create: m("/v1/categories/create", "Create a category on a board.", { boardID: requiredId, name: reqString, subscribeAdmins: boolean(), parentID: optString }),
    delete: m("/v1/categories/delete", "Delete a category that has no sub-categories.", { categoryID: requiredId }),
  },
  posts: {
    list: q("/v1/posts/list", "List posts with optional filters (boardID, authorID, companyID, tagIDs, status as a comma separated string, search, sort, limit, skip).", {
      boardID: optString,
      authorID: optString,
      companyID: optString,
      tagIDs: array(string()).optional(),
      status: optString,
      search: optString,
      sort: optString,
      limit,
      skip: optNumber,
    }),
    retrieve: q("/v1/posts/retrieve", "Get a post by id, or by urlName plus boardID.", { id: optString, urlName: optString, boardID: optString }),
    create: m("/v1/posts/create", "Create a post on a board.", {
      authorID: requiredId,
      boardID: requiredId,
      title: reqString,
      details: reqString,
      categoryID: optString,
      imageURLs: array(string()).optional(),
      customFields: json().optional(),
      eta: optString,
      etaPublic: optBool,
      ownerID: optString,
      byID: optString,
      createdAt: optString,
    }),
    update: m("/v1/posts/update", "Update a post. Send changerID whenever ownerID is sent; ownerID null removes the owner.", {
      postID: requiredId,
      title: optString,
      details: optString,
      changerID: optString,
      ownerID: json().optional(),
      eta: json().optional(),
      etaPublic: optBool,
      imageURLs: array(string()).optional(),
      customFields: json().optional(),
    }),
    delete: m("/v1/posts/delete", "Delete a post.", { postID: requiredId }),
    changeBoard: m("/v1/posts/change_board", "Move a post to another board.", { postID: requiredId, boardID: requiredId }),
    changeCategory: m("/v1/posts/change_category", 'Change a post\'s category. Pass categoryID "null" to remove it.', { postID: requiredId, categoryID: optString }),
    changeStatus: m("/v1/posts/change_status", "Change a post's status and optionally notify voters.", {
      postID: requiredId,
      changerID: requiredId,
      status: reqString,
      shouldNotifyVoters: boolean(),
      commentValue: optString,
      commentImageURLs: array(string()).optional(),
    }),
    merge: m("/v1/posts/merge", "Merge one post into another.", { mergePostID: requiredId, intoPostID: requiredId, mergerID: requiredId }),
    addTag: m("/v1/posts/add_tag", "Add a tag to a post.", { postID: requiredId, tagID: requiredId }),
    removeTag: m("/v1/posts/remove_tag", "Remove a tag from a post.", { postID: requiredId, tagID: requiredId }),
    linkJira: m("/v1/posts/link_jira", "Link a Jira issue to a post.", { postID: requiredId, issueKey: reqString }),
    unlinkJira: m("/v1/posts/unlink_jira", "Unlink a Jira issue from a post.", { postID: requiredId, issueKey: reqString }),
  },
  comments: {
    list: q("/v2/comments/list", "List comments (cursor pagination), optionally by post, author, board or company.", {
      postID: optString,
      authorID: optString,
      boardID: optString,
      companyID: optString,
      limit,
      cursor,
    }),
    retrieve: q("/v1/comments/retrieve", "Get a comment by id.", { id: requiredId }),
    create: m("/v1/comments/create", "Create a comment on a post.", {
      authorID: requiredId,
      postID: requiredId,
      value: optString,
      parentID: optString,
      imageURLs: array(string()).optional(),
      internal: optBool,
      shouldNotifyVoters: optBool,
      createdAt: optString,
    }),
    delete: m("/v1/comments/delete", "Delete a comment.", { commentID: requiredId }),
  },
  votes: {
    list: q("/v2/votes/list", "List votes (cursor pagination), optionally by board, company, post or user.", {
      boardID: optString,
      companyID: optString,
      postID: optString,
      userID: optString,
      limit,
      cursor,
    }),
    retrieve: q("/v1/votes/retrieve", "Get a vote by id.", { id: requiredId }),
    create: m("/v1/votes/create", "Vote for a post on behalf of a user.", {
      postID: requiredId,
      voterID: requiredId,
      byID: optString,
      createdAt: optString,
      votePriority: optNumber,
    }),
    delete: m("/v1/votes/delete", "Remove a user's vote from a post.", { postID: requiredId, voterID: requiredId }),
  },
  tags: {
    list: q("/v1/tags/list", "List tags, optionally for one board.", { boardID: optString, limit, skip: optNumber }),
    retrieve: q("/v1/tags/retrieve", "Get a tag by id.", { id: requiredId }),
    create: m("/v1/tags/create", "Create a tag on a board (name 1-30 characters).", { boardID: requiredId, name: reqString }),
  },
  users: {
    list: q("/v2/users/list", "List users (cursor pagination).", { limit, cursor }),
    retrieve: q("/v1/users/retrieve", "Get a user by exactly one of id, userID or email.", { id: optString, userID: optString, email: optString }),
    createOrUpdate: m("/v1/users/create_or_update", "Create a user, or update the one matching id, userID or email.", {
      name: reqString,
      id: optString,
      userID: optString,
      email: optString,
      alias: optString,
      avatarURL: optString,
      created: optString,
      companies: array(json()).optional(),
      customFields: json().optional(),
    }),
    delete: m("/v1/users/delete", "Delete a user by Canny id (the docs' example sends userID; the argument table says id).", { id: requiredId }),
    removeFromCompany: m("/v1/users/remove_user_from_company", "Remove a user from a company.", { id: requiredId, companyID: requiredId }),
  },
  companies: {
    list: q("/v2/companies/list", "List companies (cursor pagination).", { limit, cursor, search: optString, segment: optString }),
    update: m("/v1/companies/update", "Update a company by the identifier you gave it.", {
      id: requiredId,
      name: optString,
      domain: optString,
      monthlySpend: optNumber,
      created: optString,
      customFields: json().optional(),
    }),
    delete: m("/v1/companies/delete", "Delete a company.", { companyID: requiredId }),
  },
  entries: {
    list: q("/v1/entries/list", "List changelog entries.", { labelIDs: array(string()).optional(), limit, skip: optNumber, sort: optString, type: optString }),
    create: m("/v1/entries/create", "Create a changelog entry, optionally publishing it.", {
      title: reqString,
      details: reqString,
      type: optString,
      labelIDs: array(string()).optional(),
      postIDs: array(string()).optional(),
      notify: optBool,
      published: optBool,
      publishedOn: optString,
      scheduledFor: optString,
    }),
  },
  groups: {
    list: q("/v1/groups/list", "List groups (cursor pagination, default 50, max 100).", { cursor, limit }),
    retrieve: q("/v1/groups/retrieve", "Get a group by id or urlName.", { id: optString, urlName: optString }),
  },
  ideas: {
    list: q("/v1/ideas/list", "List ideas (cursor pagination, max 100). filtering is { filters, filtersOperator: all|any }; sort is { field, direction: asc|desc }. search does not paginate or sort.", {
      cursor,
      filtering: json().optional(),
      limit,
      parentID: optString,
      search: optString,
      sort: json().optional(),
    }),
    retrieve: q("/v1/ideas/retrieve", "Get an idea by id or urlName.", { id: optString, urlName: optString }),
    merge: m("/v1/ideas/merge", "Merge one idea into another.", { mergeIdeaID: requiredId, intoIdeaID: requiredId, mergerID: requiredId }),
    delete: m("/v1/ideas/delete", "Delete an idea.", { id: requiredId }),
  },
  insights: {
    list: q("/v1/insights/list", "List insights (cursor pagination, max 100), optionally for one idea.", { cursor, ideaID: optString, limit }),
    retrieve: q("/v1/insights/retrieve", "Get an insight by id.", { id: requiredId }),
  },
  opportunities: {
    list: q("/v1/opportunities/list", "List CRM opportunities (from Salesforce or HubSpot) linked to posts.", { limit, skip: optNumber }),
  },
  statusChanges: {
    list: q("/v2/status_changes/list", "List post status changes (cursor pagination).", { boardID: optString, limit, cursor }),
  },
  autopilot: {
    enqueue: m("/v1/ai/enqueue", "Send a call or conversation transcript to Canny Autopilot for feedback extraction. payload needs id, authorID and text; sourceURL and sourceType are optional.", {
      type: reqString,
      payload: json(),
    }),
  },
};

export default defineApp(
  { user: { accounts: { canny: canny.many() } }, icons },
  async ({ user, signal, fetch }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.canny ?? [],
        (account) => {
          const apiKey = account.fields.token;
          const build = (spec: Spec) => {
            const options = { description: spec.description, input: object(spec.input) };
            const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(fetch, signal, apiKey, spec.path, input);
            return spec.kind === "query" ? query(options, handler as never) : mutation(options, handler as never);
          };
          const tools = Object.fromEntries(
            Object.entries(groups).map(([group, specs]) => [
              group,
              router(Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, build(spec)]))),
            ]),
          );
          return withApprovals(router(tools), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "Canny",
        description: "Boards, posts, comments, votes, tags, categories, users, companies and changelog entries in Canny.",
        icons,
      },
    ),
  }),
);

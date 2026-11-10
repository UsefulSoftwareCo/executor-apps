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

const base = "https://api.getbeamer.com/v0";

const beamer = defineProvider({
  name: "Beamer",
  hosts: ["api.getbeamer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // POST /ping only checks the key and returns the product name.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/ping`, {
      method: "POST",
      signal,
      headers: { "Beamer-Api-Key": account.fields.token },
    });
    const { name } = await decodeJson(response, object({ name: string() }));
    return { accountInfo: { externalId: name, displayName: name } };
  },
});

type Account = { fields: { token: string } };

// Field kinds: s string, n number, b boolean, a array of strings.
type Kind = "s" | "n" | "b" | "a";
type Fields = Record<string, Kind>;

const schemaFor = (kind: Kind) =>
  kind === "s" ? string().optional() : kind === "n" ? number().optional() : kind === "b" ? boolean().optional() : array(string()).optional();

type Op = {
  description: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  pathParams?: string[];
  // wire name -> kind. An input name differing from the wire name is written "input:wire".
  query?: Fields;
  body?: Fields;
  defaults?: Record<string, string | number | boolean>;
  // Query values always sent and never exposed as inputs.
  fixed?: Record<string, string | number | boolean>;
  // GET calls that change server state are mutations and need approval.
  mutates?: boolean;
};

const build = (account: Account, signal: AbortSignal, op: Op) => {
  // Beamer returns IDs as quoted strings, so path IDs are strings (pass numeric IDs as text).
  const required = Object.fromEntries((op.pathParams ?? []).map((name) => [name, string({ minLength: 1 })]));
  const optional = (fields: Fields = {}) =>
    Object.fromEntries(Object.entries(fields).map(([name, kind]) => [name, schemaFor(kind)]));
  const queryNames = Object.keys(op.query ?? {});
  const bodyNames = Object.keys(op.body ?? {});
  // Users PUT matches by query userId/beamerId/userEmail while the body carries the same names.
  const clash = queryNames.filter((name) => bodyNames.includes(name));
  const queryPrefix = (name: string) => (clash.includes(name) ? "match_" : "");
  const input = object({
    ...required,
    ...Object.fromEntries(
      Object.entries(op.query ?? {}).map(([name, kind]) => [queryPrefix(name) + name, schemaFor(kind)]),
    ),
    ...optional(op.body),
  });
  const run = async (
    { fetch }: { fetch: typeof globalThis.fetch },
    args: Record<string, unknown>,
  ) => {
    let path = op.path;
    for (const name of op.pathParams ?? []) path = path.replace(`{${name}}`, encodeURIComponent(String(args[name])));
    const params = new URLSearchParams();
    for (const name of queryNames) {
      const value = op.fixed?.[name] ?? args[queryPrefix(name) + name] ?? op.defaults?.[name];
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) params.append(name, String(item));
      else params.set(name, String(value));
    }
    const body: Record<string, unknown> = {};
    for (const name of bodyNames) if (args[name] !== undefined) body[name] = args[name];
    const query = params.toString();
    const response = await fetch(`${base}${path}${query === "" ? "" : `?${query}`}`, {
      method: op.method,
      signal,
      headers: {
        "Beamer-Api-Key": account.fields.token,
        Accept: "application/json",
        ...(bodyNames.length > 0 ? { "content-type": "application/json" } : {}),
      },
      ...(bodyNames.length > 0 ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const options = { description: op.description, input };
  return op.method === "GET" && op.mutates !== true
    ? query(options, (ctx, args) => run(ctx, args as Record<string, unknown>))
    : mutation({ ...options, approval: always() }, (ctx, args) => run(ctx, args as Record<string, unknown>));
};

const page = { maxResults: "n", page: "n" } as const satisfies Fields;
const viewer = { userId: "s", userEmail: "s", userFirstName: "s", userLastName: "s" } as const satisfies Fields;
const range = { dateFrom: "s", dateTo: "s" } as const satisfies Fields;
const postFilters = { filter: "s", forceFilter: "s", filterUrl: "s", language: "s", category: "s" } as const satisfies Fields;
const reader = { ignoreRequestDetails: true } as const;
const person = { userId: "s", userEmail: "s", userFirstname: "s", userLastname: "s" } as const satisfies Fields;
const postBody = {
  title: "a", content: "a", language: "a", linkUrl: "a", linkText: "a", category: "s", publish: "b", archive: "b", pinned: "b",
  showInWidget: "b", showInStandalone: "b", boostedAnnouncement: "s", fixedBoostedAnnouncement: "b", linksInNewWindow: "b",
  date: "s", dueDate: "s", filter: "s", filterUserId: "s", filterUrl: "s", enableFeedback: "b", enableReactions: "b",
  enableSocialShare: "b", autoOpen: "b", sendPushNotification: "b", userEmail: "s",
} as const satisfies Fields;
const requestBody = {
  title: "a", content: "a", language: "a", visible: "b", category: "s", status: "s", notes: "s", filters: "s",
  votesCount: "n", date: "s", internalUserEmail: "s", ...person,
} as const satisfies Fields;
const userBody = {
  userId: "s", userEmail: "s", userFirstName: "s", userLastName: "s", filter: "s", language: "s", ip: "s", browser: "s",
  os: "s", city: "s", country: "s", latitude: "s", longitude: "s",
} as const satisfies Fields;
const userMatch = { userId: "s", beamerId: "s", userEmail: "s" } as const satisfies Fields;

const ops = {
  ping: { description: "Check that the API key works. Returns the name of your product on Beamer.", method: "POST", path: "/ping" },
  feedUrl: {
    description: "Get the URL of your standalone Beamer feed, optionally in one language (Starter plan and up) or filtered by segment (Pro and up).",
    method: "GET", path: "/url",
    query: { language: "s", filterByUrl: "b", filter: "s", forceFilter: "s", ...viewer, theme: "s" },
  },
  posts: {
    list: {
      description: "List posts (changelog entries) with translations, analytics counts and segmentation. At most 10 per page. Views are never recorded by this tool.",
      method: "GET", path: "/posts",
      query: { ...postFilters, ...range, published: "b", archived: "b", expired: "b", filterByUserId: "b", ...viewer, traceableLinks: "b", ignoreRequestDetails: "b", ...page, ignoreFilters: "b" },
      defaults: reader,
      fixed: { saveViews: false },
    },
    count: {
      description: "Count posts matching the same filters as posts.list.",
      method: "GET", path: "/posts/count",
      query: { filter: "s", forceFilter: "s", filterUrl: "s", ...range, language: "s", category: "s", published: "b", archived: "b", expired: "b", filterByUserId: "b", userId: "s", ignoreFilters: "b" },
    },
    get: {
      description: "Get one post by its ID.",
      method: "GET", path: "/posts/{postId}", pathParams: ["postId"],
      query: { ...viewer, language: "s", traceableLinks: "b", ignoreRequestDetails: "b" },
    },
    create: {
      description: "Create a post. title, content, language, linkUrl and linkText are arrays with one entry per translation, in the same order. Set publish to true to publish it, otherwise it is a draft. Multiple translations need the Starter plan.",
      method: "POST", path: "/posts", body: postBody,
    },
    update: {
      description: "Update a post by ID. Send only the fields to change; array fields keep the translation order rule of posts.create.",
      method: "PUT", path: "/posts/{postId}", pathParams: ["postId"], body: postBody,
    },
    delete: { description: "Delete a post by ID.", method: "DELETE", path: "/posts/{postId}", pathParams: ["postId"] },
    unread: {
      description: "List unread posts for a user identified by userId or userEmail. Read-only: it never marks posts as read or records views. Use posts.markAsRead to do that.",
      method: "GET", path: "/unread",
      query: { ...postFilters, dateFrom: "s", ...viewer, traceableLinks: "b", ignoreRequestDetails: "b", ...page, ignoreFilters: "b" },
      defaults: reader,
      fixed: { saveViews: false, markAsRead: false },
    },
    markAsRead: {
      description: "List unread posts for a user and mark the returned posts as read (and record views when saveViews is true). Changes Beamer state, so it requires approval.",
      method: "GET", path: "/unread", mutates: true,
      query: { ...postFilters, dateFrom: "s", ...viewer, traceableLinks: "b", ignoreRequestDetails: "b", saveViews: "b", ...page, ignoreFilters: "b" },
      defaults: reader,
      fixed: { markAsRead: true },
    },
    unreadCount: {
      description: "Count unread posts for a user identified by userId or userEmail.",
      method: "GET", path: "/unread/count",
      query: { ...postFilters, dateFrom: "s", ...viewer, theme: "s", ignoreFilters: "b" },
    },
    comments: {
      list: {
        description: "List comments on a post.",
        method: "GET", path: "/posts/{postId}/comments", pathParams: ["postId"],
        query: { ...range, language: "s", search: "s", ...page },
      },
      count: {
        description: "Count comments on a post.",
        method: "GET", path: "/posts/{postId}/comments/count", pathParams: ["postId"],
        query: { ...range, language: "s", search: "s" },
      },
      get: { description: "Get one comment on a post.", method: "GET", path: "/posts/{postId}/comments/{commentId}", pathParams: ["postId", "commentId"] },
      create: {
        description: "Add a comment to a post on behalf of a user.",
        method: "POST", path: "/posts/{postId}/comments", pathParams: ["postId"], body: { text: "s", ...person },
      },
      delete: { description: "Delete a comment from a post.", method: "DELETE", path: "/posts/{postId}/comments/{commentId}", pathParams: ["postId", "commentId"] },
    },
    reactions: {
      list: {
        description: "List reactions on a post. reaction filters by type (positive, neutral or negative).",
        method: "GET", path: "/posts/{postId}/reactions", pathParams: ["postId"],
        query: { ...range, reaction: "s", ...page },
      },
      count: {
        description: "Count reactions on a post, optionally by type.",
        method: "GET", path: "/posts/{postId}/reactions/count", pathParams: ["postId"],
        query: { ...range, reaction: "s" },
      },
      get: { description: "Get one reaction on a post.", method: "GET", path: "/posts/{postId}/reactions/{reactionId}", pathParams: ["postId", "reactionId"] },
      create: {
        description: "Add a reaction (positive, neutral or negative) to a post on behalf of a user.",
        method: "POST", path: "/posts/{postId}/reactions", pathParams: ["postId"], body: { reaction: "s", ...person },
      },
      delete: { description: "Delete a reaction from a post.", method: "DELETE", path: "/posts/{postId}/reactions/{reactionId}", pathParams: ["postId", "reactionId"] },
    },
  },
  requests: {
    list: {
      description: "List feature requests. Filter by status, category, visibility or a text search.",
      method: "GET", path: "/requests",
      query: { filters: "s", ...range, language: "s", category: "s", status: "s", visible: "b", search: "s", ...page },
    },
    count: {
      description: "Count feature requests matching the same filters as requests.list.",
      method: "GET", path: "/requests/count",
      query: { filters: "s", ...range, language: "s", category: "s", status: "s", visible: "b", search: "s" },
    },
    get: { description: "Get one feature request by ID.", method: "GET", path: "/requests/{featureRequestId}", pathParams: ["featureRequestId"] },
    create: {
      description: "Create a feature request. title, content and language are arrays with one entry per translation, in the same order.",
      method: "POST", path: "/requests", body: requestBody,
    },
    update: {
      description: "Update a feature request by ID. Send only the fields to change.",
      method: "PUT", path: "/requests/{featureRequestId}", pathParams: ["featureRequestId"], body: requestBody,
    },
    delete: { description: "Delete a feature request by ID.", method: "DELETE", path: "/requests/{featureRequestId}", pathParams: ["featureRequestId"] },
    comments: {
      list: {
        description: "List comments on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/comments", pathParams: ["featureRequestId"],
        query: { ...range, visible: "b", language: "s", search: "s", ...page },
      },
      count: {
        description: "Count comments on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/comments/count", pathParams: ["featureRequestId"],
        query: { ...range, visible: "b", language: "s", search: "s" },
      },
      get: {
        description: "Get one comment on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/comments/{commentId}", pathParams: ["featureRequestId", "commentId"],
      },
      create: {
        description: "Add a comment to a feature request on behalf of a user.",
        method: "POST", path: "/requests/{featureRequestId}/comments", pathParams: ["featureRequestId"],
        body: { text: "s", ...person, visible: "b" },
      },
      delete: {
        description: "Delete a comment from a feature request.",
        method: "DELETE", path: "/requests/{featureRequestId}/comments/{commentId}", pathParams: ["featureRequestId", "commentId"],
      },
    },
    votes: {
      list: {
        description: "List votes on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/votes", pathParams: ["featureRequestId"],
        query: { ...range, ...page },
      },
      count: {
        description: "Count votes on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/votes/count", pathParams: ["featureRequestId"],
      },
      get: {
        description: "Get one vote on a feature request.",
        method: "GET", path: "/requests/{featureRequestId}/votes/{voteId}", pathParams: ["featureRequestId", "voteId"],
      },
      create: {
        description: "Add a vote to a feature request on behalf of a user.",
        method: "POST", path: "/requests/{featureRequestId}/votes", pathParams: ["featureRequestId"], body: person,
      },
      delete: {
        description: "Delete a vote from a feature request.",
        method: "DELETE", path: "/requests/{featureRequestId}/votes/{voteId}", pathParams: ["featureRequestId", "voteId"],
      },
    },
  },
  users: {
    list: {
      description: "List users known to your Beamer Analytics, by userId, beamerId or userEmail. sort names the attribute to order by.",
      method: "GET", path: "/users", query: { ...userMatch, sort: "s", ...page },
    },
    create: { description: "Create a user in Beamer Analytics. filter holds segmentation tags separated by semicolons.", method: "POST", path: "/users", body: userBody },
    update: {
      description: "Update the users matching match_userId, beamerId or match_userEmail (Scale plan) with the body fields. userId and userEmail clash with body fields of the same name, so the matching ones are prefixed match_.",
      method: "PUT", path: "/users", query: userMatch, body: userBody,
    },
    delete: {
      description: "Delete the users matching userId, beamerId or userEmail (Scale plan; multiple values are separated by semicolons).",
      method: "DELETE", path: "/users", query: userMatch,
    },
  },
  nps: {
    list: {
      description: "List NPS responses, filtered by date, score range or feedback text.",
      method: "GET", path: "/nps", query: { ...range, scoreFrom: "n", scoreTo: "n", search: "s", ...page },
    },
    count: {
      description: "Count NPS responses with the same filters as nps.list.",
      method: "GET", path: "/nps/count", query: { ...range, scoreFrom: "n", scoreTo: "n", search: "s" },
    },
    check: {
      description: "Check whether a user meets the conditions to be shown the NPS prompt.",
      method: "GET", path: "/nps/check",
      query: { ...userMatch, userFirstName: "s", userLastName: "s", filter: "s", url: "s", createdAt: "s", language: "s", mobile: "b", multi: "b" },
    },
    sendEmail: { description: "Send an NPS survey email to a user.", method: "POST", path: "/nps/email", body: { userEmail: "s" } },
    link: {
      description: "Generate a single-use NPS survey link for a user. Creates a link on Beamer's side, so it requires approval.",
      method: "GET", path: "/nps/link", mutates: true, query: viewer,
    },
  },
  team: {
    invite: { description: "Invite a member to your Beamer team by email with a role (for example writer).", method: "POST", path: "/team", body: { email: "s", role: "s" } },
    updateRole: { description: "Change the role of a team member.", method: "PUT", path: "/team", body: { email: "s", role: "s" } },
    remove: { description: "Remove a member from your Beamer team.", method: "DELETE", path: "/team", body: { email: "s" } },
  },
  privacy: {
    deleteUserData: {
      description: "Permanently delete all data about the matching users, including their comments, votes and reactions. Identify them by userId, beamerId or userEmail (multiple values separated by semicolons).",
      method: "DELETE", path: "/privacy", query: userMatch,
    },
  },
} as const;

type Tree = { [key: string]: Op | Tree };
const isOp = (node: Op | Tree): node is Op => typeof (node as Op).method === "string";

const mount = (account: Account, signal: AbortSignal, tree: Tree): ReturnType<typeof router> =>
  router(
    Object.fromEntries(
      Object.entries(tree).map(([key, node]) => [key, isOp(node) ? build(account, signal, node) : mount(account, signal, node)]),
    ) as never,
  );

export default defineApp({ user: { accounts: { beamer: beamer.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.beamer ?? [], (account) => mount(account, signal, ops as unknown as Tree), { signal }), {
    title: "Beamer",
    description: "Beamer changelog and notification center: posts, comments, reactions, feature requests, votes, users, NPS surveys and team members.",
    icons,
  }),
}));

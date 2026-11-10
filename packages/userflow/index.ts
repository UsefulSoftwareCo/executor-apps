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

const regions = { apiKey: "https://api.userflow.com", apiKeyEu: "https://api.eu.userflow.com" } as const;
const version = "2020-01-03";

const keyFields = secrets({
  label: "Environment API key",
  fields: object({ token: string({ minLength: 1 }) }),
});

const userflow = defineProvider({
  name: "Userflow",
  hosts: ["api.userflow.com", "api.eu.userflow.com"],
  auth: {
    apiKey: keyFields,
    apiKeyEu: secrets({
      label: "Environment API key (EU region)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Environment API keys are scoped to one environment; listing definitions is the cheapest read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${regions[account.method]}/attribute_definitions?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Userflow-Version": version },
    });
    await decodeJson(response, object({ object: string() }));
  },
});

type Account = { method: keyof typeof regions; fields: { token: string } };

// Field kinds: s string, n number, b boolean, a array of strings, j any JSON.
type Kind = "s" | "n" | "b" | "a" | "j";
type Fields = Record<string, Kind>;

const schemaFor = (kind: Kind) =>
  kind === "s"
    ? string().optional()
    : kind === "n"
      ? number().optional()
      : kind === "b"
        ? boolean().optional()
        : kind === "a"
          ? array(string()).optional()
          : json().optional();

type Op = {
  description: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  pathParams?: string[];
  // Names required in the input even though the schema builders default to optional.
  required?: string[];
  query?: Fields;
  body?: Fields;
};

const build = (account: Account, signal: AbortSignal, op: Op) => {
  const strings = Object.fromEntries(
    [...(op.pathParams ?? []), ...(op.required ?? [])].map((name) => [name, string({ minLength: 1 })]),
  );
  const optional = (fields: Fields = {}) =>
    Object.fromEntries(
      Object.entries(fields)
        .filter(([name]) => !(name in strings))
        .map(([name, kind]) => [name, schemaFor(kind)]),
    );
  const input = object({ ...strings, ...optional(op.query), ...optional(op.body) });
  const queryNames = Object.keys(op.query ?? {});
  const bodyNames = Object.keys(op.body ?? {});
  const run = async ({ fetch }: { fetch: typeof globalThis.fetch }, args: Record<string, unknown>) => {
    let path = op.path;
    for (const name of op.pathParams ?? []) path = path.replace(`:${name}`, encodeURIComponent(String(args[name])));
    const params = new URLSearchParams();
    for (const name of queryNames) {
      const value = args[name];
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) params.append(name, String(item));
      else params.set(name, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const body: Record<string, unknown> = {};
    for (const name of bodyNames) if (args[name] !== undefined) body[name] = args[name];
    const search = params.toString();
    const response = await fetch(`${regions[account.method]}${path}${search === "" ? "" : `?${search}`}`, {
      method: op.method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        "Userflow-Version": version,
        Accept: "application/json",
        ...(bodyNames.length > 0 ? { "content-type": "application/json" } : {}),
      },
      ...(bodyNames.length > 0 ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
  const options = { description: op.description, input };
  return op.method === "GET"
    ? query(options, (ctx, args) => run(ctx, args as Record<string, unknown>))
    : mutation({ ...options, approval: always() }, (ctx, args) => run(ctx, args as Record<string, unknown>));
};

const page = { limit: "n", starting_after: "s", order_by: "s" } as const satisfies Fields;
const pageOnly = { limit: "n", starting_after: "s" } as const satisfies Fields;

const ops = {
  users: {
    list: {
      description:
        "List users. Filter by email, group_id, segment_id or a JSON condition (pass the condition as a JSON string). order_by accepts created_at, attributes.signed_up_at, attributes.last_seen_at, attributes.name, prefixed with - for descending. expand loads memberships, groups, memberships.group.",
      method: "GET", path: "/users",
      query: { ...page, condition: "s", email: "s", group_id: "s", segment_id: "s", expand: "s" },
    },
    get: {
      description: "Get one user by the ID used in your app. expand loads memberships, groups, memberships.group.",
      method: "GET", path: "/users/:user_id", pathParams: ["user_id"], query: { expand: "s" },
    },
    upsert: {
      description:
        "Create a user, or merge attributes into the existing user with the same id. groups and memberships (only one of them) also upsert groups and memberships. Set prune_memberships to remove memberships not listed.",
      method: "POST", path: "/users", required: ["id"],
      body: { id: "s", attributes: "j", groups: "j", memberships: "j", prune_memberships: "b", signature: "s" },
    },
    delete: {
      description: "Permanently delete a user with their attributes, memberships, events and flow history. Groups are kept. Idempotent.",
      method: "DELETE", path: "/users/:user_id", pathParams: ["user_id"],
    },
  },
  groups: {
    list: {
      description: "List groups (companies). Filter by user_id, segment_id or a JSON condition string.",
      method: "GET", path: "/groups", query: { ...page, condition: "s", user_id: "s", segment_id: "s", expand: "s" },
    },
    get: {
      description: "Get one group by the ID used in your app. expand loads memberships, users, memberships.user.",
      method: "GET", path: "/groups/:group_id", pathParams: ["group_id"], query: { expand: "s" },
    },
    upsert: {
      description: "Create a group, or merge attributes into the existing group with the same id.",
      method: "POST", path: "/groups", required: ["id"], body: { id: "s", attributes: "j" },
    },
    delete: {
      description: "Permanently delete a group with its attributes, memberships and events. Member users are kept. Idempotent.",
      method: "DELETE", path: "/groups/:group_id", pathParams: ["group_id"],
    },
    removeUser: {
      description: "Remove a user from a group, leaving both intact. Idempotent.",
      method: "DELETE", path: "/group_memberships", required: ["user_id", "group_id"], query: { user_id: "s", group_id: "s" },
    },
  },
  events: {
    track: {
      description: "Track a custom event for a user, a group or both (at least one of user_id and group_id). name uses letters, digits, underscores, dashes and spaces; time is ISO 8601 and defaults to now.",
      method: "POST", path: "/events", required: ["name"],
      body: { name: "s", user_id: "s", group_id: "s", time: "s", attributes: "j" },
    },
  },
  content: {
    list: {
      description: "List content objects (flows, checklists, launchers, banners, trackers and so on). type filters by kind.",
      method: "GET", path: "/content", query: { ...page, type: "s", expand: "s" },
    },
    get: {
      description: "Get one content object. expand loads draft_version, published_version.",
      method: "GET", path: "/content/:content_id", pathParams: ["content_id"], query: { expand: "s" },
    },
    versions: {
      list: {
        description: "List the versions of one content object.",
        method: "GET", path: "/content_versions", required: ["content_id"],
        query: { ...page, content_id: "s", number: "n", expand: "s" },
      },
      get: {
        description: "Get one content version, including survey questions or checklist tasks (expand questions, tasks).",
        method: "GET", path: "/content_versions/:version_id", pathParams: ["version_id"], query: { expand: "s" },
      },
    },
  },
  sessions: {
    list: {
      description: "List content sessions: one user's journey through one content object, with progress and survey answers (expand answers). Filter by user_id and content_id.",
      method: "GET", path: "/content_sessions", query: { ...page, content_id: "s", user_id: "s", expand: "s" },
    },
    get: {
      description: "Get one content session.",
      method: "GET", path: "/content_sessions/:session_id", pathParams: ["session_id"], query: { expand: "s" },
    },
    end: {
      description: "End an active content session.",
      method: "POST", path: "/content_sessions/:content_session_id/end", pathParams: ["content_session_id"],
    },
    delete: {
      description: "Permanently delete a content session with its progress and survey answers. Idempotent.",
      method: "DELETE", path: "/content_sessions/:content_session_id", pathParams: ["content_session_id"],
    },
  },
  definitions: {
    attributes: {
      description: "List attribute definitions: every user, group, membership and event attribute Userflow has seen, with data type and display name.",
      method: "GET", path: "/attribute_definitions", query: pageOnly,
    },
    events: {
      description: "List event definitions: every event name Userflow has seen, with display name and description.",
      method: "GET", path: "/event_definitions", query: { ...pageOnly, expand: "s" },
    },
  },
  webhooks: {
    list: {
      description: "List webhook subscriptions.",
      method: "GET", path: "/webhook_subscriptions", query: pageOnly,
    },
    get: {
      description: "Get one webhook subscription.",
      method: "GET", path: "/webhook_subscriptions/:webhook_subscription_id", pathParams: ["webhook_subscription_id"],
    },
    create: {
      description: "Create a webhook subscription. topics are such as user, user.created, group, event, event.tracked.<name> or *. The signing secret is only returned in this response.",
      method: "POST", path: "/webhook_subscriptions", required: ["url"], body: { url: "s", topics: "a", api_version: "s" },
    },
    update: {
      description: "Update a webhook subscription: url, topics, or disabled.",
      method: "PATCH", path: "/webhook_subscriptions/:webhook_subscription_id", pathParams: ["webhook_subscription_id"],
      body: { url: "s", topics: "a", disabled: "b", api_version: "s" },
    },
    delete: {
      description: "Delete a webhook subscription.",
      method: "DELETE", path: "/webhook_subscriptions/:webhook_subscription_id", pathParams: ["webhook_subscription_id"],
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

export default defineApp({ user: { accounts: { userflow: userflow.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.userflow ?? [], (account) => mount(account, signal, ops as unknown as Tree), { signal }),
    {
      title: "Userflow",
      description: "Userflow product onboarding: users, groups, events, flows and checklists, content sessions, definitions and webhook subscriptions.",
      icons,
    },
  ),
}));

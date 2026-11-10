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

const base = "https://api.chameleon.io";

const chameleon = defineProvider({
  name: "Chameleon",
  hosts: ["api.chameleon.io"],
  auth: {
    apiKey: secrets({
      label: "Account secret",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API root echoes the account and user the secret belongs to.
  async health({ account, fetch, signal }) {
    const response = await fetch(base, { signal, headers: { "X-Account-Secret": account.fields.token } });
    const { account: found } = await decodeJson(response, object({ account: object({ id: string() }) }));
    return { accountInfo: { externalId: found.id } };
  },
});

type Account = { method: "apiKey"; fields: { token: string } };

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
  // A POST that only reads (search, count): no approval.
  read?: boolean;
  // Name of an object input whose keys are merged into the request body (custom properties).
  spread?: string;
};

const modelKinds: Record<string, string> = { tour: "tours", survey: "surveys", embed: "embeds", launcher: "launchers", tooltip: "tooltips" };

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
  const input = object({
    ...strings,
    ...optional(op.query),
    ...optional(op.body),
    ...(op.spread === undefined ? {} : { [op.spread]: json().optional() }),
  });
  const queryNames = Object.keys(op.query ?? {});
  const bodyNames = Object.keys(op.body ?? {});
  const hasBody = bodyNames.length > 0 || op.spread !== undefined;
  const run = async ({ fetch }: { fetch: typeof globalThis.fetch }, args: Record<string, unknown>) => {
    let path = op.path;
    for (const name of op.pathParams ?? []) {
      const raw = String(args[name]);
      // Chameleon documents singular model kinds but its paths are plural.
      const value = name === "model_kind" ? (modelKinds[raw] ?? raw) : raw;
      path = path.replace(`:${name}`, encodeURIComponent(value));
    }
    const params = new URLSearchParams();
    for (const name of queryNames) {
      const value = args[name];
      if (value === undefined) continue;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Nested objects use Chameleon's bracket form: expand[profile]=all.
        for (const [key, inner] of Object.entries(value)) params.set(`${name}[${key}]`, String(inner));
      } else {
        params.set(name, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
    }
    const body: Record<string, unknown> = {};
    if (op.spread !== undefined && typeof args[op.spread] === "object" && args[op.spread] !== null) {
      Object.assign(body, args[op.spread]);
    }
    for (const name of bodyNames) if (args[name] !== undefined) body[name] = args[name];
    const search = params.toString();
    const response = await fetch(`${base}${path}${search === "" ? "" : `?${search}`}`, {
      method: op.method,
      signal,
      headers: {
        "X-Account-Secret": account.fields.token,
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
  const options = { description: op.description, input };
  return op.method === "GET" || op.read === true
    ? query(options, (ctx, args) => run(ctx, args as Record<string, unknown>))
    : mutation({ ...options, approval: always() }, (ctx, args) => run(ctx, args as Record<string, unknown>));
};

const page = { limit: "n", before: "s", after: "s" } as const satisfies Fields;
const search = { segment_id: "s", filters: "j", filters_op: "s", expand: "j", ...page } as const satisfies Fields;

const experience = (name: string, plural: string) =>
  ({
    list: {
      description: `List ${name}s. Defaults to 50 per page, at most 500; pass the cursor.before from the previous response as before to continue.`,
      method: "GET", path: `/v3/edit/${plural}`, query: page,
    },
    get: {
      description: `Get one ${name} by its Chameleon ID, including stats and the Segments, Tags and Environments it uses.`,
      method: "GET", path: `/v3/edit/${plural}/:id`, pathParams: ["id"],
    },
    update: {
      description: `Update a ${name}. url_group_id and tag_id take an ID prefixed with + to add or - to remove; published_at set to an ISO 8601 time publishes it, and null unpublishes it.`,
      method: "PATCH", path: `/v3/edit/${plural}/:id`, pathParams: ["id"],
      body: { url_group_id: "s", tag_id: "s", published_at: "j" },
    },
  }) as const;

const ops = {
  profiles: {
    search: {
      description:
        "Search user profiles by segment_id or by an array of segmentation filter expressions (filters, combined with filters_op and or or). expand controls related data, for example { profile: 'min', company: 'skip' }.",
      method: "POST", path: "/v3/analyze/profiles", read: true, query: {}, body: search,
    },
    count: {
      description: "Count user profiles matching a segment_id or segmentation filters.",
      method: "POST", path: "/v3/analyze/profiles/count", read: true, body: { segment_id: "s", filters: "j", filters_op: "s" },
    },
    get: {
      description: "Get one user profile by its Chameleon ID.",
      method: "GET", path: "/v3/analyze/profiles/:id", pathParams: ["id"],
    },
    find: {
      description: "Find one user profile by uid (your backend's user ID) or email. Provide one of them.",
      method: "GET", path: "/v3/analyze/profile", query: { uid: "s", email: "s" },
    },
    upsert: {
      description:
        "Create or update a user profile. Identify it with uid, email or the Chameleon id; link a company with company_id or company_uid. properties holds every other attribute to store (names are normalised to snake_case, scalar values up to 768 bytes).",
      method: "POST", path: "/v3/observe/hooks/profiles", body: { id: "s", uid: "s", email: "s", company_id: "s", company_uid: "s" }, spread: "properties",
    },
    delete: {
      description: "Clear (reset) a user profile by its Chameleon ID: resets its properties and removes its survey responses and events, but keeps the profile. This is not permanent erasure; use forget for that.",
      method: "DELETE", path: "/v3/edit/profiles/:id", pathParams: ["id"],
    },
    deleteByUid: {
      description: "Clear (reset) a user profile by uid: resets its properties and removes its survey responses and events, but keeps the profile. This is not permanent erasure; use forgetByUid for that.",
      method: "DELETE", path: "/v3/edit/profiles", required: ["uid"], query: { uid: "s" },
    },
    forget: {
      description: "Erase a user's personal data (privacy request) by Chameleon ID, keeping aggregate statistics.",
      method: "DELETE", path: "/v3/edit/profiles/:id/forget", pathParams: ["id"],
    },
    forgetByUid: {
      description: "Erase a user's personal data (privacy request) by uid, keeping aggregate statistics.",
      method: "DELETE", path: "/v3/edit/profiles/forget", required: ["uid"], query: { uid: "s" },
    },
  },
  companies: {
    search: {
      description: "Search companies by segment_id or by an array of segmentation filter expressions.",
      method: "POST", path: "/v3/analyze/companies", read: true, body: { ...search, sort_by: "s", sort_dir: "s", offset: "n" },
    },
    count: {
      description: "Count companies matching a segment_id or segmentation filters.",
      method: "POST", path: "/v3/analyze/companies/count", read: true, body: { segment_id: "s", filters: "j", filters_op: "s" },
    },
    get: {
      description: "Get one company by its Chameleon ID.",
      method: "GET", path: "/v3/analyze/companies/:id", pathParams: ["id"],
    },
    find: {
      description: "Find one company by uid (your backend's company ID).",
      method: "GET", path: "/v3/analyze/company", required: ["uid"], query: { uid: "s" },
    },
    upsert: {
      description:
        "Create or update a company. Identify it with uid or the Chameleon id; properties holds every other attribute to store.",
      method: "POST", path: "/v3/observe/hooks/companies", body: { id: "s", uid: "s" }, spread: "properties",
    },
    delete: {
      description: "Permanently delete a company by its Chameleon ID. Set cascade to profiles to delete its user profiles too.",
      method: "DELETE", path: "/v3/edit/companies/:id", pathParams: ["id"], query: { cascade: "s" },
    },
    deleteByUid: {
      description: "Permanently delete a company by uid. Set cascade to profiles to delete its user profiles too.",
      method: "DELETE", path: "/v3/edit/company", required: ["uid"], query: { uid: "s", cascade: "s" },
    },
  },
  events: {
    track: {
      description:
        "Track a custom event for a user profile (identify with uid or id). name is the event name; properties holds the event's attributes. Events are processed asynchronously, typically within thirty seconds.",
      method: "POST", path: "/v3/observe/hooks/events", required: ["name"], body: { name: "s", id: "s", uid: "s" }, spread: "properties",
    },
    names: {
      list: {
        description: "List the event names tracked in the account.",
        method: "GET", path: "/v3/edit/event_names", query: page,
      },
      get: {
        description: "Get one event name by its Chameleon ID.",
        method: "GET", path: "/v3/edit/event_names/:id", pathParams: ["id"],
      },
    },
  },
  properties: {
    list: {
      description: "List the custom properties received for user profiles or companies. kind is profile or company.",
      method: "GET", path: "/v3/edit/properties", required: ["kind"], query: { kind: "s", integration: "s", order: "s", ...page },
    },
    create: {
      description: "Create a property definition. kind is profile, event or company.",
      method: "POST", path: "/v3/edit/properties", required: ["name", "kind", "description"], body: { name: "s", description: "s", kind: "s" },
    },
    update: {
      description: "Update a property's display name or description.",
      method: "PATCH", path: "/v3/edit/properties/:id", pathParams: ["id"], body: { name: "s", description: "s" },
    },
  },
  segments: {
    list: {
      description: "List segments with their filter items.",
      method: "GET", path: "/v3/edit/segments", query: page,
    },
    get: {
      description: "Get one segment by its Chameleon ID.",
      method: "GET", path: "/v3/edit/segments/:id", pathParams: ["id"],
    },
    experiences: {
      description: "List the tours, microsurveys or launchers attached to a segment. kind is tour, survey or launcher.",
      method: "GET", path: "/v3/edit/segments/:id/:kind", pathParams: ["id", "kind"],
    },
  },
  tours: {
    ...experience("tour", "tours"),
    interactions: {
      description: "List user interactions with a tour: each user's current view and progress. expand adds profile and company, for example { profile: 'all' }.",
      method: "GET", path: "/v3/analyze/interactions", required: ["id"], query: { id: "s", order: "s", expand: "j", ...page },
    },
  },
  surveys: {
    ...experience("microsurvey", "surveys"),
    responses: {
      description: "List responses to a microsurvey. expand adds profile and company, for example { profile: 'all' }.",
      method: "GET", path: "/v3/analyze/responses", required: ["id"], query: { id: "s", order: "s", expand: "j", ...page },
    },
    deleteResponse: {
      description: "Delete one microsurvey response by its ID.",
      method: "DELETE", path: "/v3/edit/responses/:id", pathParams: ["id"],
    },
  },
  launchers: experience("launcher", "launchers"),
  embeddables: experience("embeddable", "embeds"),
  tooltips: experience("tooltip", "tooltips"),
  deliveries: {
    list: {
      description: "List deliveries, filtered by experience (model_id) or user profile (profile_id).",
      method: "GET", path: "/v3/edit/deliveries", query: { model_id: "s", profile_id: "s", ...page },
    },
    create: {
      description:
        "Trigger a tour or microsurvey for one user. model_kind is tour or survey; identify the user with profile_id, uid or email. Use idempotency_key for at-most-once delivery; options personalises content; from/until bound the delivery window (until also accepts +30d); use_segmentation and once guard who sees it.",
      method: "POST", path: "/v3/edit/deliveries", required: ["model_kind", "model_id"],
      body: {
        model_kind: "s", model_id: "s", profile_id: "s", uid: "s", email: "s", idempotency_key: "s", options: "j",
        from: "s", until: "s", use_segmentation: "b", once: "b", skip_triggers: "b", skip_url_match: "b",
        delivery_ids_limit: "n", delivery_ids_position: "j", delivery_ids_at_limit: "s",
      },
    },
    delete: {
      description: "Remove a delivery.",
      method: "DELETE", path: "/v3/edit/deliveries/:id", pathParams: ["id"],
    },
  },
  tags: {
    list: {
      description: "List tags used to group experiences.",
      method: "GET", path: "/v3/edit/tags", query: page,
    },
    get: {
      description: "Get one tag by its Chameleon ID.",
      method: "GET", path: "/v3/edit/tags/:id", pathParams: ["id"],
    },
    bulk: {
      description:
        "Apply many tag changes at once. updates is an array of objects with model_id, model_type (Campaign, Tooltip or List; microsurveys and embeddables are Campaigns) and one of tag_id or tag_name prefixed with + to add or - to remove, or tag_names to set the exact tag list.",
      method: "POST", path: "/v3/edit/tags/bulk", required: ["updates"], body: { updates: "j" },
    },
  },
  environments: {
    list: {
      description: "List Environments' domains (URLs) where experiences can run.",
      method: "GET", path: "/v3/edit/urls", query: page,
    },
    get: {
      description: "Get one domain by its Chameleon ID.",
      method: "GET", path: "/v3/edit/urls/:id", pathParams: ["id"],
    },
    groups: {
      description: "List Environments (URL groups), the sets of domains that experiences are published to.",
      method: "GET", path: "/v3/edit/url_groups", query: page,
    },
    group: {
      description: "Get one Environment (URL group) by its Chameleon ID.",
      method: "GET", path: "/v3/edit/url_groups/:id", pathParams: ["id"],
    },
  },
  themes: {
    list: {
      description: "List the account's themes.",
      method: "GET", path: "/v3/edit/themes", query: page,
    },
    get: {
      description: "Get one theme by its Chameleon ID.",
      method: "GET", path: "/v3/edit/themes/:id", pathParams: ["id"],
    },
  },
  rateLimitGroups: {
    list: {
      description: "List rate limit groups, which cap how many experiences a user sees per time period.",
      method: "GET", path: "/v3/edit/limit_groups", query: page,
    },
    get: {
      description: "Get one rate limit group by its Chameleon ID.",
      method: "GET", path: "/v3/edit/limit_groups/:id", pathParams: ["id"],
    },
    experiences: {
      description: "List the experiences in a rate limit group.",
      method: "GET", path: "/v3/edit/limit_groups/:id/experiences", pathParams: ["id"],
    },
  },
  alertGroups: {
    list: {
      description: "List alert groups, which notify team members when an experience breaks its alert conditions.",
      method: "GET", path: "/v3/edit/alert_groups", query: page,
    },
    get: {
      description: "Get one alert group by its Chameleon ID.",
      method: "GET", path: "/v3/edit/alert_groups/:id", pathParams: ["id"],
    },
  },
  imports: {
    list: {
      description: "List CSV data imports into user profiles or companies.",
      method: "GET", path: "/v3/edit/imports", query: page,
    },
    get: {
      description: "Get one data import and its status.",
      method: "GET", path: "/v3/edit/imports/:id", pathParams: ["id"],
    },
  },
  changes: {
    list: {
      description: "List the change history of all experiences. Pass filter=published_at to see only publishes.",
      method: "GET", path: "/v3/edit/changes", query: { filter: "s", ...page },
    },
    forModel: {
      description: "List the change history of one experience. model_kind is one of tour, survey, embed, launcher or tooltip (plural forms are also accepted).",
      method: "GET", path: "/v3/edit/:model_kind/:model_id/changes", pathParams: ["model_kind", "model_id"], query: page,
    },
    summary: {
      description: "Summarise the change history of one experience. model_kind is one of tour, survey, embed, launcher or tooltip (plural forms are also accepted).",
      method: "GET", path: "/v3/edit/:model_kind/:model_id/changes/summary", pathParams: ["model_kind", "model_id"],
    },
  },
  webhooks: {
    list: {
      description: "List outgoing webhook subscriptions. kind is webhook or zapier_hook.",
      method: "GET", path: "/v3/edit/webhooks", required: ["kind"], query: { kind: "s" },
    },
    create: {
      description:
        "Create an outgoing webhook subscription. url must be https; topics is a comma-separated list of webhook topics; experience_ids limits it to those tours or microsurveys.",
      method: "POST", path: "/v3/edit/webhooks", required: ["url", "topics"],
      body: { kind: "s", url: "s", topics: "s", experience_id: "s", experience_ids: "a" },
    },
    delete: {
      description: "Delete an outgoing webhook subscription.",
      method: "DELETE", path: "/v3/edit/webhooks/:id", pathParams: ["id"],
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

export default defineApp({ user: { accounts: { chameleon: chameleon.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.chameleon ?? [], (account) => mount(account, signal, ops as unknown as Tree), { signal }),
    {
      title: "Chameleon",
      description:
        "Chameleon product adoption: user profiles, companies, events, tours, microsurveys, launchers, segments, deliveries, tags and webhooks.",
      icons,
    },
  ),
}));

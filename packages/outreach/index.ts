import {
  accountRouter,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.outreach.io/api/v2";

type Account = { method: "oauth"; fields: { access_token: string } };

const outreach = defineProvider({
  name: "Outreach",
  hosts: ["api.outreach.io"],
  auth: {
    // Outreach issues OAuth client credentials from an app created in the developer portal.
    oauth: oauth2({
      authorizationUrl: "https://api.outreach.io/oauth/authorize",
      tokenUrl: "https://api.outreach.io/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "accounts.all",
        "calls.all",
        "mailboxes.all",
        "mailings.all",
        "opportunities.all",
        "personas.all",
        "prospects.all",
        "sequences.all",
        "sequenceStates.all",
        "sequenceSteps.all",
        "stages.all",
        "tasks.all",
        "templates.all",
        "users.all",
        "teams.all",
        "tags.all",
        "snippets.all",
        "events.all",
        "meetings.all",
        "phoneNumbers.all",
        "callDispositions.all",
        "callPurposes.all",
        "opportunityStages.all",
        "sequenceTemplates.all",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users?page[size]=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/vnd.api+json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, init: { query?: Params; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${account.fields.access_token}`,
      Accept: "application/vnd.api+json",
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/vnd.api+json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) {
      throw new Error(`Outreach responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    // DELETE and some actions answer 204 No Content.
    const text = await response.text();
    if (text.trim() === "") return { ok: true };
    return JSON.parse(text) as Record<string, unknown>;
  };
}

const enc = encodeURIComponent;
const id = string({ minLength: 1 });

const ListInput = object({
  filter: json().optional(),
  sort: string().optional(),
  pageSize: number().optional(),
  pageOffset: number().optional(),
  include: string().optional(),
});

const listNote =
  "filter is an object of attribute filters, e.g. { \"email\": \"a@b.com\" } becomes filter[email]=a@b.com (use \"a..b\" for ranges and \"inf\" for open ends); sort is a comma-separated attribute list with a leading - for descending; pageSize is 1-1000 (default 50); pageOffset skips that many records; include is a comma-separated list of relationships to side-load.";

function listQuery(i: {
  filter?: unknown;
  sort?: string | undefined;
  pageSize?: number | undefined;
  pageOffset?: number | undefined;
  include?: string | undefined;
}): Params {
  const params: Params = {
    sort: i.sort,
    include: i.include,
    "page[size]": i.pageSize,
    "page[offset]": i.pageOffset,
  };
  if (i.filter && typeof i.filter === "object") {
    for (const [key, value] of Object.entries(i.filter as Record<string, unknown>)) {
      if (value !== undefined && value !== null) params[`filter[${key}]`] = String(value);
    }
  }
  return params;
}

type Send = ReturnType<typeof client>;

interface Resource {
  /** JSON:API type, camelCase plural, as in the URL path. */
  type: string;
  singular: string;
  title: string;
  description: string;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

const resources: Resource[] = [
  { type: "prospects", singular: "prospect", title: "Prospects", description: "People you sell to: contact details, stage, owner, tags and engagement.", create: true, update: true, delete: true },
  { type: "accounts", singular: "account", title: "Accounts", description: "Companies that prospects and opportunities belong to.", create: true, update: true, delete: true },
  { type: "opportunities", singular: "opportunity", title: "Opportunities", description: "Deals with amount, close date, stage and owner.", create: true, update: true, delete: true },
  { type: "sequences", singular: "sequence", title: "Sequences", description: "Automated multi-step outreach cadences.", create: true, update: true, delete: true },
  { type: "sequenceSteps", singular: "sequence step", title: "Sequence steps", description: "Individual email, call, task or LinkedIn steps inside a sequence.", create: true, update: true, delete: true },
  { type: "sequenceStates", singular: "sequence state", title: "Sequence states", description: "A prospect's enrollment in a sequence and its progress.", create: true, delete: true },
  { type: "sequenceTemplates", singular: "sequence template", title: "Sequence templates", description: "Templates attached to sequence steps.", create: true, update: true, delete: true },
  { type: "mailings", singular: "mailing", title: "Mailings", description: "Emails sent and received, with tracking data.", create: true, update: true, delete: true },
  { type: "mailboxes", singular: "mailbox", title: "Mailboxes", description: "Connected email inboxes and their sending settings.", update: true },
  { type: "calls", singular: "call", title: "Calls", description: "Logged phone calls with disposition, duration and recording.", create: true, update: true, delete: true },
  { type: "callDispositions", singular: "call disposition", title: "Call dispositions", description: "Outcomes a call can be logged with.", create: true, update: true, delete: true },
  { type: "callPurposes", singular: "call purpose", title: "Call purposes", description: "Reasons a call can be made for.", create: true, update: true, delete: true },
  { type: "tasks", singular: "task", title: "Tasks", description: "To-dos for reps: manual, call, email and LinkedIn tasks.", create: true, update: true, delete: true },
  { type: "templates", singular: "template", title: "Templates", description: "Reusable email templates.", create: true, update: true, delete: true },
  { type: "snippets", singular: "snippet", title: "Snippets", description: "Reusable text snippets for emails.", create: true, update: true, delete: true },
  { type: "personas", singular: "persona", title: "Personas", description: "Buyer personas used to classify prospects.", create: true, update: true, delete: true },
  { type: "stages", singular: "stage", title: "Prospect stages", description: "Pipeline stages a prospect can be in." },
  { type: "opportunityStages", singular: "opportunity stage", title: "Opportunity stages", description: "Pipeline stages an opportunity can be in.", create: true, update: true, delete: true },
  { type: "tags", singular: "tag", title: "Tags", description: "Tags applied to prospects and accounts.", create: true, update: true, delete: true },
  { type: "users", singular: "user", title: "Users", description: "Outreach users in your organization.", create: true, update: true },
  { type: "teams", singular: "team", title: "Teams", description: "Teams of users.", create: true, update: true, delete: true },
  { type: "phoneNumbers", singular: "phone number", title: "Phone numbers", description: "Phone numbers attached to prospects and accounts.", create: true, update: true, delete: true },
  { type: "events", singular: "event", title: "Events", description: "Activity events such as email opens, replies and bounces." },
  { type: "meetings", singular: "meeting", title: "Meetings", description: "Scheduled meetings with prospects." },
];

const writeNote =
  "attributes is an object of the resource's attributes; relationships is an optional object in JSON:API form, e.g. { \"account\": { \"data\": { \"type\": \"account\", \"id\": 1 } } }. See https://developers.outreach.io/api/reference/ for each resource's fields.";

// JSON:API resource types are singular: opportunities -> opportunity, mailboxes -> mailbox.
const resourceType = (plural: string) =>
  plural.endsWith("ies") ? `${plural.slice(0, -3)}y` : plural.endsWith("xes") ? plural.slice(0, -2) : plural.replace(/s$/, "");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resourceRouter(send: Send, r: Resource, extra: Record<string, any> = {}) {
  const path = `/${r.type}`;
  const tools: Record<string, any> = {
    list: query(
      { description: `List ${r.title.toLowerCase()}. ${r.description} ${listNote}`, input: ListInput },
      async (_c, i) => send("GET", path, { query: listQuery(i) }),
    ),
    get: query(
      { description: `Get one ${r.singular} by id.`, input: object({ id, include: string().optional() }) },
      async (_c, i) => send("GET", `${path}/${enc(i.id)}`, { query: { include: i.include } }),
    ),
  };
  if (r.create) {
    tools.create = mutation(
      {
        description: `Create a ${r.singular}. ${writeNote}`,
        input: object({ attributes: json(), relationships: json().optional() }),
        approval: always(),
      },
      async (_c, i) =>
        send("POST", path, {
          body: { data: { type: resourceType(r.type), attributes: i.attributes, relationships: i.relationships } },
        }),
    );
  }
  if (r.update) {
    tools.update = mutation(
      {
        description: `Update a ${r.singular}. Only the given attributes and relationships change. ${writeNote}`,
        input: object({ id, attributes: json().optional(), relationships: json().optional() }),
        approval: always(),
      },
      async (_c, i) =>
        send("PATCH", `${path}/${enc(i.id)}`, {
          body: {
            data: {
              type: resourceType(r.type),
              id: /^\d+$/.test(i.id) ? Number(i.id) : i.id,
              attributes: i.attributes,
              relationships: i.relationships,
            },
          },
        }),
    );
  }
  if (r.delete) {
    tools.delete = mutation(
      { description: `Delete a ${r.singular}.`, input: object({ id }), approval: always() },
      async (_c, i) => send("DELETE", `${path}/${enc(i.id)}`),
    );
  }
  return router({ ...tools, ...extra }, { title: r.title, description: r.description });
}

function actions(send: Send): Record<string, Record<string, any>> {
  const action = (path: string, description: string) =>
    mutation({ description, input: object({ id }), approval: always() }, async (_c, i) =>
      send("POST", path.replace(":id", enc(i.id))),
    );
  return {
    sequenceStates: {
      pause: action("/sequenceStates/:id/actions/pause", "Pause a sequence state (a prospect's progress through a sequence)."),
      resume: action("/sequenceStates/:id/actions/resume", "Resume a paused sequence state."),
      finish: action("/sequenceStates/:id/actions/finish", "Finish a sequence state, removing the prospect from the sequence."),
    },
    tasks: {
      markComplete: mutation(
        {
          description: "Mark a task complete. attributes is optional, e.g. { \"note\": \"...\" }.",
          input: object({ id, attributes: json().optional() }),
          approval: always(),
        },
        async (_c, i) =>
          send("POST", `/tasks/${enc(i.id)}/actions/markComplete`, {
            body: i.attributes ? { data: { type: "task", attributes: i.attributes } } : undefined,
          }),
      ),
    },
    mailings: {
      bounce: action("/mailings/:id/actions/bounce", "Mark a mailing as bounced."),
    },
    prospects: {
      finishSequences: action("/prospects/:id/actions/finishSequences", "Finish all active sequence states for a prospect."),
    },
  };
}

function tools(send: Send) {
  const extra = actions(send);
  const tree: Record<string, any> = {};
  for (const r of resources) tree[r.type] = resourceRouter(send, r, extra[r.type]);
  return tree;
}

export default defineApp(
  { user: { accounts: { outreach: outreach.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.outreach ?? [],
        (account) => {
          const send = client(account, fetch, signal);
          return router(tools(send));
        },
        { signal },
      ),
      {
        title: "Outreach",
        description:
          "Sales engagement: prospects, accounts, opportunities, sequences, mailings, calls, tasks, templates and users in Outreach.",
        icons,
      },
    ),
  }),
);

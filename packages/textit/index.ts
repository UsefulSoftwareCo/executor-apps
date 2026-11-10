import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://textit.com/api/v2";

const textit = defineProvider({
  name: "TextIt",
  hosts: ["textit.com"],
  auth: {
    // TextIt offers no OAuth: each workspace creates API tokens under Account > API.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/workspace.json`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    const workspace = await decodeJson(response, object({ uuid: string(), name: string() }));
    return { accountInfo: { externalId: workspace.uuid, displayName: workspace.name } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}/${path}.json`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());

const pagination = " Results are paged: to fetch the next page, pass the query parameters from the `next` URL in the `query` object.";

function list(call: Call, path: string, description: string) {
  return query(
    { description: description + pagination, input: object({ query: filters }) },
    async (_ctx, input: Params) => call("GET", path, input.query as Params | undefined),
  );
}

function get(call: Call, path: string, description: string) {
  return query({ description, input: object({}) }, async () => call("GET", path));
}

// Create and update are both POST; an update selects the object with a `query` filter such as { uuid }.
function post(call: Call, path: string, description: string, selector = false) {
  return mutation(
    {
      description,
      input: object({ ...(selector ? { query: payload } : {}), body: payload }),
    },
    async (_ctx, input: Params) => call("POST", path, (input.query as Params | undefined) ?? {}, input.body as Params),
  );
}

function remove(call: Call, path: string, description: string) {
  return mutation(
    { description, input: object({ query: payload }) },
    async (_ctx, input: Params) => call("DELETE", path, input.query as Params),
  );
}

function build(call: Call) {
  const upd = (noun: string) => `Update an existing ${noun}. \`query\` selects it (usually { uuid } or { name }); \`body\` holds the changed fields.`;
  const del = (noun: string) => `Delete a ${noun}. \`query\` selects it (usually { uuid }).`;
  return {
    workspace: get(call, "workspace", "Show the workspace: uuid, name, country, languages, timezone, date_style, anon."),
    contacts: router({
      list: list(call, "contacts", "List contacts. Filters in query: uuid, urn, group (name or uuid), deleted, before, after."),
      create: post(call, "contacts", "Create a contact. body: name, language, urns (e.g. [\"tel:+250788123123\"]), groups, fields (key to value)."),
      update: post(call, "contacts", upd("contact") + " Selector can also be { urn }.", true),
      delete: remove(call, "contacts", del("contact") + " Selector can also be { urn }."),
      action: post(call, "contact_actions", "Apply a bulk action. body: contacts (uuids/urns), action (add, remove, block, unblock, interrupt, archive, restore, delete), group (for add/remove)."),
    }, { title: "Contacts" }),
    groups: router({
      list: list(call, "groups", "List contact groups. Filters in query: uuid, name."),
      create: post(call, "groups", "Create a group. body: name."),
      update: post(call, "groups", upd("group"), true),
      delete: remove(call, "groups", del("group")),
    }, { title: "Groups" }),
    fields: router({
      list: list(call, "fields", "List contact fields. Filters in query: key."),
      create: post(call, "fields", "Create a contact field. body: label, type (text, number, datetime, state, district, ward)."),
      update: post(call, "fields", upd("field") + " Selector is { key }.", true),
    }, { title: "Contact fields" }),
    flows: router({
      list: list(call, "flows", "List flows. Filters in query: uuid, before, after, archived."),
      startsList: list(call, "flow_starts", "List flow starts. Filters in query: uuid, before, after."),
      start: post(call, "flow_starts", "Start contacts in a flow. body: flow (uuid), contacts, groups, urns, restart_participants, params, exclude."),
    }, { title: "Flows" }),
    runs: router({
      list: list(call, "runs", "List flow runs. Filters in query: id, flow, contact, responded, before, after, reverse."),
    }, { title: "Runs" }),
    messages: router({
      list: list(call, "messages", "List messages. Filters in query: id, broadcast, contact, folder (inbox, flows, archived, outbox, incoming, sent, failed), label, before, after."),
      action: post(call, "message_actions", "Apply a bulk action to messages. body: messages (ids), action (label, unlabel, archive, restore, delete), label (for label/unlabel)."),
    }, { title: "Messages" }),
    broadcasts: router({
      list: list(call, "broadcasts", "List broadcasts. Filters in query: id, before, after."),
      send: post(call, "broadcasts", "Send a message to contacts, groups or URNs. body: text (string or per-language object), contacts, groups, urns, attachments."),
    }, { title: "Broadcasts" }),
    labels: router({
      list: list(call, "labels", "List message labels. Filters in query: uuid, name."),
      create: post(call, "labels", "Create a label. body: name."),
      update: post(call, "labels", upd("label"), true),
      delete: remove(call, "labels", del("label")),
    }, { title: "Labels" }),
    campaigns: router({
      list: list(call, "campaigns", "List campaigns. Filters in query: uuid."),
      create: post(call, "campaigns", "Create a campaign. body: name, group (uuid)."),
      update: post(call, "campaigns", upd("campaign"), true),
      eventsList: list(call, "campaign_events", "List campaign events. Filters in query: uuid, campaign."),
      eventsCreate: post(call, "campaign_events", "Create a campaign event. body: campaign, relative_to, offset, unit, delivery_hour, message or flow."),
      eventsUpdate: post(call, "campaign_events", upd("campaign event"), true),
      eventsDelete: remove(call, "campaign_events", del("campaign event")),
    }, { title: "Campaigns" }),
    tickets: router({
      list: list(call, "tickets", "List tickets. Filters in query: uuid, contact, before, after."),
      action: post(call, "ticket_actions", "Apply a bulk action to tickets. body: tickets (uuids), action (assign, add_note, change_topic, close, reopen), assignee, note, topic."),
      topicsList: list(call, "topics", "List ticket topics. Filters in query: uuid."),
      topicsCreate: post(call, "topics", "Create a ticket topic. body: name."),
      topicsUpdate: post(call, "topics", upd("topic"), true),
    }, { title: "Tickets" }),
    resthooks: router({
      list: list(call, "resthooks", "List resthooks."),
      eventsList: list(call, "resthook_events", "List recent resthook events."),
      subscribersList: list(call, "resthook_subscribers", "List resthook subscribers. Filters in query: id, resthook."),
      subscribersCreate: post(call, "resthook_subscribers", "Subscribe a URL to a resthook. body: resthook, target_url."),
      subscribersDelete: remove(call, "resthook_subscribers", del("resthook subscriber") + " Selector is { id }."),
    }, { title: "Resthooks" }),
    globals: router({
      list: list(call, "globals", "List globals. Filters in query: key."),
      update: post(call, "globals", "Create or update a global. `query` selects it ({ key }); body: value.", true),
    }, { title: "Globals" }),
    channels: list(call, "channels", "List channels. Filters in query: uuid, address."),
    users: list(call, "users", "List user logins in the workspace. Filters in query: group (agents, editors, ...)."),
    archives: list(call, "archives", "List message and run archives. Filters in query: archive_type (message, run), period (day, month), after, before."),
  };
}

export default defineApp(
  { user: { accounts: { textit: textit.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.textit ?? [],
        (account) =>
          withApprovals(router(build(client(account.fields.token, fetch, signal))), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TextIt",
        description: "Run messaging flows in TextIt: contacts, groups, fields, flows, broadcasts, messages, runs, campaigns, tickets and resthooks.",
        icons,
      },
    ),
  }),
);

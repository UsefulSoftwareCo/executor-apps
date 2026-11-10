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
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.aircall.io/v1";

type Account =
  | { method: "apiKey"; fields: { apiId: string; apiToken: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Customers authenticate with HTTP Basic (api_id:api_token); OAuth apps send a bearer token.
const authorization = (account: Account) =>
  account.method === "oauth"
    ? `Bearer ${account.fields.access_token}`
    : `Basic ${btoa(`${account.fields.apiId}:${account.fields.apiToken}`)}`;

const aircall = defineProvider({
  name: "Aircall",
  hosts: ["api.aircall.io"],
  auth: {
    apiKey: secrets({
      label: "API ID and API token",
      fields: object({ apiId: string({ minLength: 1 }), apiToken: string({ minLength: 1 }) }),
    }),
    // OAuth client credentials are issued by Aircall to technology partners.
    oauth: oauth2({
      authorizationUrl: "https://dashboard.aircall.io/oauth/authorize",
      tokenUrl: "https://api.aircall.io/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: ["public_api"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/ping`, { signal, headers: { Authorization: authorization(account) } });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, init: { query?: Params; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: authorization(account) };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) {
      throw new Error(`Aircall responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    // Several endpoints answer 204 No Content.
    const text = await response.text();
    if (text.trim() === "") return { ok: true };
    return JSON.parse(text) as Record<string, unknown>;
  };
  return send;
}

const enc = encodeURIComponent;
const id = string({ minLength: 1 });
const listShape = {
  page: number().optional(),
  perPage: number().optional(),
  order: string().optional(),
};
const List = object(listShape);
const TimedList = object({ ...listShape, from: string().optional(), to: string().optional() });
const listQuery = (i: { page?: number | undefined; perPage?: number | undefined; order?: string | undefined; from?: string | undefined; to?: string | undefined }): Params => ({
  page: i.page,
  per_page: i.perPage,
  order: i.order,
  from: i.from,
  to: i.to,
});
const Body = object({ body: json() });

const pagingNote =
  "page starts at 1; perPage is 1-50 (default 20); order is asc or desc; from and to are UNIX timestamps.";

function build(send: ReturnType<typeof client>) {
  const sub = (path: string, description: string) =>
    query({ description, input: object({ id, ...listShape }) }, async (_c, i) =>
      send("GET", `/${path.replace(":id", enc(i.id))}`, { query: listQuery(i) }),
    );
  return router({
    company: router(
      {
        get: query({ description: "Get the company the credentials belong to.", input: object({}) }, async () => send("GET", "/company")),
        ping: query({ description: "Check that the credentials work (returns pong).", input: object({}) }, async () => send("GET", "/ping")),
      },
      { title: "Company", description: "Company details and credential check." },
    ),
    calls: router(
      {
        list: query(
          {
            description: `List calls, newest first by default. ${pagingNote} Pass fetchContact or fetchShortUrls as "true" to include them.`,
            input: object({ ...listShape, from: string().optional(), to: string().optional(), fetchContact: string().optional(), fetchShortUrls: string().optional() }),
          },
          async (_c, i) => send("GET", "/calls", { query: { ...listQuery(i), fetch_contact: i.fetchContact, fetch_short_urls: i.fetchShortUrls } }),
        ),
        search: query(
          {
            description:
              "Search calls. params is an object of vendor query parameters such as phone_number, user_id, tags, from, to, direction, duration, contact_id, page, per_page, order.",
            input: object({ params: json() }),
          },
          async (_c, i) => send("GET", "/calls/search", { query: i.params as Params }),
        ),
        get: query({ description: "Get one call with its user, number, contact, comments and tags.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}`)),
        transcription: query({ description: "Get the transcription of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/transcription`)),
        summary: query({ description: "Get the AI summary of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/summary`)),
        topics: query({ description: "Get the AI topics of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/topics`)),
        sentiments: query({ description: "Get the AI sentiments of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/sentiments`)),
        actionItems: query({ description: "Get the AI action items of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/action_items`)),
        evaluations: query({ description: "Get the evaluations of a call.", input: object({ id }) }, async (_c, i) => send("GET", `/calls/${enc(i.id)}/evaluations`)),
        comment: mutation(
          { description: "Add a comment to a call. body: { content: string }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/calls/${enc(i.id)}/comments`, { body: i.body }),
        ),
        addTags: mutation(
          { description: "Add tags to a call. body: { tags: string[] } with tag names.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/calls/${enc(i.id)}/tags`, { body: i.body }),
        ),
        transfer: mutation(
          { description: "Transfer a live call. body: { user_id } or { number } or { team_id }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/calls/${enc(i.id)}/transfers`, { body: i.body }),
        ),
        addInsightCards: mutation(
          { description: "Send insight cards to a call in Aircall Workspace. body: { contents: [...] } as documented by Aircall.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/calls/${enc(i.id)}/insight_cards`, { body: i.body }),
        ),
        pauseRecording: mutation({ description: "Pause the recording of a live call.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/calls/${enc(i.id)}/pause_recording`)),
        resumeRecording: mutation({ description: "Resume the recording of a live call.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/calls/${enc(i.id)}/resume_recording`)),
        archive: mutation({ description: "Archive a call.", input: object({ id }), approval: always() }, async (_c, i) => send("PUT", `/calls/${enc(i.id)}/archive`)),
        unarchive: mutation({ description: "Unarchive a call.", input: object({ id }), approval: always() }, async (_c, i) => send("PUT", `/calls/${enc(i.id)}/unarchive`)),
        deleteRecording: mutation({ description: "Delete the recording of a call.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/calls/${enc(i.id)}/recording`)),
        deleteVoicemail: mutation({ description: "Delete the voicemail of a call.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/calls/${enc(i.id)}/voicemail`)),
      },
      { title: "Calls", description: "Call history, AI call insights, comments, tags and live call controls." },
    ),
    users: router(
      {
        list: query({ description: `List users. ${pagingNote}`, input: TimedList }, async (_c, i) => send("GET", "/users", { query: listQuery(i) })),
        get: query({ description: "Get one user.", input: object({ id }) }, async (_c, i) => send("GET", `/users/${enc(i.id)}`)),
        availabilities: query({ description: "List the availability status of every user.", input: object({}) }, async () => send("GET", "/users/availabilities")),
        availability: query({ description: "Get the availability of one user.", input: object({ id }) }, async (_c, i) => send("GET", `/users/${enc(i.id)}/availability`)),
        create: mutation(
          { description: "Invite a user. body: { email, first_name, last_name, availability_status?, language?, time_zone? }.", input: Body, approval: always() },
          async (_c, i) => send("POST", "/users", { body: i.body }),
        ),
        update: mutation(
          { description: "Update a user. body: { name?, available?, availability_status?, language?, time_zone? }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("PUT", `/users/${enc(i.id)}`, { body: i.body }),
        ),
        delete: mutation({ description: "Delete a user.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/users/${enc(i.id)}`)),
        startCall: mutation(
          { description: "Start an outbound call from a user's phone. body: { number_id: number, to: string in E.164 }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/users/${enc(i.id)}/calls`, { body: i.body }),
        ),
        dial: mutation(
          { description: "Fill a user's Aircall Workspace dialer with a number (click to dial). body: { to: string in E.164 }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/users/${enc(i.id)}/dial`, { body: i.body }),
        ),
      },
      { title: "Users", description: "Agents and admins, their availability, and outbound calls." },
    ),
    numbers: router(
      {
        list: query({ description: `List phone numbers. ${pagingNote}`, input: List }, async (_c, i) => send("GET", "/numbers", { query: listQuery(i) })),
        get: query({ description: "Get one number.", input: object({ id }) }, async (_c, i) => send("GET", `/numbers/${enc(i.id)}`)),
        update: mutation(
          { description: "Update a number. body: { name?, priority?, music?, messages? ... } as documented by Aircall.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("PUT", `/numbers/${enc(i.id)}`, { body: i.body }),
        ),
        registrationStatus: query({ description: "Get the SMS registration status of a number.", input: object({ id }) }, async (_c, i) => send("GET", `/numbers/${enc(i.id)}/registration_status`)),
        whatsappStatus: query({ description: "Get the WhatsApp status of a number.", input: object({ id }) }, async (_c, i) => send("GET", `/numbers/${enc(i.id)}/whatsapp_status`)),
        templates: query({ description: "List the message templates of a number.", input: object({ id }) }, async (_c, i) => send("GET", `/numbers/${enc(i.id)}/templates`)),
        getMessagesConfiguration: query({ description: "Get the messaging configuration of a number.", input: object({ id }) }, async (_c, i) => send("GET", `/numbers/${enc(i.id)}/messages/configuration`)),
        setMessagesConfiguration: mutation(
          { description: "Create the messaging configuration of a number. body: { callbackUrl: string } as documented by Aircall.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/numbers/${enc(i.id)}/messages/configuration`, { body: i.body }),
        ),
        deleteMessagesConfiguration: mutation({ description: "Delete the messaging configuration of a number.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/numbers/${enc(i.id)}/messages/configuration`)),
        campaignEligible: query({ description: "List numbers eligible for dialer campaigns.", input: List }, async (_c, i) => send("GET", "/campaign_eligible_numbers", { query: listQuery(i) })),
      },
      { title: "Numbers", description: "Company phone numbers and their messaging configuration." },
    ),
    messages: router(
      {
        send: mutation(
          { description: "Send an SMS or MMS from a number, skipping the Aircall inbox. body: { to: string E.164, body: string } plus optional fields from Aircall's docs.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/numbers/${enc(i.id)}/messages/send`, { body: i.body }),
        ),
        sendNative: mutation(
          { description: "Send a message from a number through the Aircall inbox. body: { to, body } plus optional fields from Aircall's docs.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/numbers/${enc(i.id)}/messages/native/send`, { body: i.body }),
        ),
        sendGroup: mutation(
          { description: "Send a group message from a number, skipping the Aircall inbox. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/numbers/${enc(i.id)}/messages/group/send`, { body: i.body }),
        ),
        sendGroupNative: mutation(
          { description: "Send a group message from a number through the Aircall inbox. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/numbers/${enc(i.id)}/messages/group/native/send`, { body: i.body }),
        ),
        sendWhatsapp: mutation(
          { description: "Send a WhatsApp message, skipping the Aircall inbox. body as documented by Aircall.", input: Body, approval: always() },
          async (_c, i) => send("POST", "/messages/whatsapp/send", { body: i.body }),
        ),
        sendWhatsappNative: mutation(
          { description: "Send a WhatsApp message through the Aircall inbox. body as documented by Aircall.", input: Body, approval: always() },
          async (_c, i) => send("POST", "/messages/send/whatsapp/native", { body: i.body }),
        ),
        smsTemplates: query({ description: "List SMS templates.", input: List }, async (_c, i) => send("GET", "/sms/templates", { query: listQuery(i) })),
      },
      { title: "Messages", description: "Send SMS, MMS and WhatsApp messages from Aircall numbers." },
    ),
    contacts: router(
      {
        list: query({ description: `List shared contacts. ${pagingNote} orderBy is created_at or updated_at.`, input: object({ ...listShape, from: string().optional(), to: string().optional(), orderBy: string().optional() }) }, async (_c, i) => send("GET", "/contacts", { query: { ...listQuery(i), order_by: i.orderBy } })),
        search: query(
          { description: "Search contacts. params is an object of vendor query parameters such as phone_number, email, page, per_page, order, order_by.", input: object({ params: json() }) },
          async (_c, i) => send("GET", "/contacts/search", { query: i.params as Params }),
        ),
        get: query({ description: "Get one contact.", input: object({ id }) }, async (_c, i) => send("GET", `/contacts/${enc(i.id)}`)),
        create: mutation(
          { description: "Create a shared contact. body: { first_name?, last_name?, company_name?, information?, phone_numbers: [{label, value}], emails: [{label, value}] }.", input: Body, approval: always() },
          async (_c, i) => send("POST", "/contacts", { body: i.body }),
        ),
        update: mutation(
          { description: "Update a contact. body: { first_name?, last_name?, company_name?, information? }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/contacts/${enc(i.id)}`, { body: i.body }),
        ),
        delete: mutation({ description: "Delete a contact.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/contacts/${enc(i.id)}`)),
        addPhone: mutation(
          { description: "Add a phone number to a contact. body: { label, value }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/contacts/${enc(i.id)}/phone_details`, { body: i.body }),
        ),
        updatePhone: mutation(
          { description: "Update a phone number of a contact. body: { label?, value? }.", input: object({ id, phoneId: id, body: json() }), approval: always() },
          async (_c, i) => send("PUT", `/contacts/${enc(i.id)}/phone_details/${enc(i.phoneId)}`, { body: i.body }),
        ),
        deletePhone: mutation({ description: "Delete a phone number from a contact.", input: object({ id, phoneId: id }), approval: always() }, async (_c, i) => send("DELETE", `/contacts/${enc(i.id)}/phone_details/${enc(i.phoneId)}`)),
        addEmail: mutation(
          { description: "Add an email to a contact. body: { label, value }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("POST", `/contacts/${enc(i.id)}/email_details`, { body: i.body }),
        ),
        updateEmail: mutation(
          { description: "Update an email of a contact. body: { label?, value? }.", input: object({ id, emailId: id, body: json() }), approval: always() },
          async (_c, i) => send("PUT", `/contacts/${enc(i.id)}/email_details/${enc(i.emailId)}`, { body: i.body }),
        ),
        deleteEmail: mutation({ description: "Delete an email from a contact.", input: object({ id, emailId: id }), approval: always() }, async (_c, i) => send("DELETE", `/contacts/${enc(i.id)}/email_details/${enc(i.emailId)}`)),
      },
      { title: "Contacts", description: "Shared contacts with their phone numbers and emails." },
    ),
    tags: router(
      {
        list: query({ description: `List tags. ${pagingNote}`, input: List }, async (_c, i) => send("GET", "/tags", { query: listQuery(i) })),
        get: query({ description: "Get one tag.", input: object({ id }) }, async (_c, i) => send("GET", `/tags/${enc(i.id)}`)),
        create: mutation({ description: "Create a tag. body: { name, color (hex), description? }.", input: Body, approval: always() }, async (_c, i) => send("POST", "/tags", { body: i.body })),
        update: mutation({ description: "Update a tag. body: { name?, color?, description? }.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("PUT", `/tags/${enc(i.id)}`, { body: i.body })),
        delete: mutation({ description: "Delete a tag.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/tags/${enc(i.id)}`)),
      },
      { title: "Tags", description: "Tags applied to calls." },
    ),
    teams: router(
      {
        list: query({ description: `List teams. ${pagingNote}`, input: List }, async (_c, i) => send("GET", "/teams", { query: listQuery(i) })),
        get: query({ description: "Get one team with its users.", input: object({ id }) }, async (_c, i) => send("GET", `/teams/${enc(i.id)}`)),
        create: mutation({ description: "Create a team. body: { name }.", input: Body, approval: always() }, async (_c, i) => send("POST", "/teams", { body: i.body })),
        delete: mutation({ description: "Delete a team.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/teams/${enc(i.id)}`)),
        addUser: mutation({ description: "Add a user to a team.", input: object({ id, userId: id }), approval: always() }, async (_c, i) => send("POST", `/teams/${enc(i.id)}/users/${enc(i.userId)}`)),
        removeUser: mutation({ description: "Remove a user from a team.", input: object({ id, userId: id }), approval: always() }, async (_c, i) => send("DELETE", `/teams/${enc(i.id)}/users/${enc(i.userId)}`)),
      },
      { title: "Teams", description: "Teams of users." },
    ),
    webhooks: router(
      {
        list: query({ description: `List webhooks. ${pagingNote}`, input: List }, async (_c, i) => send("GET", "/webhooks", { query: listQuery(i) })),
        get: query({ description: "Get one webhook by its webhook_id.", input: object({ id }) }, async (_c, i) => send("GET", `/webhooks/${enc(i.id)}`)),
        create: mutation(
          { description: "Create a webhook. body: { url: string, events: string[] (for example call.created, call.ended), custom_name? }.", input: Body, approval: always() },
          async (_c, i) => send("POST", "/webhooks", { body: i.body }),
        ),
        update: mutation(
          { description: "Update a webhook. body: { url?, events?, active?, custom_name? }.", input: object({ id, body: json() }), approval: always() },
          async (_c, i) => send("PUT", `/webhooks/${enc(i.id)}`, { body: i.body }),
        ),
        delete: mutation({ description: "Delete a webhook.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/webhooks/${enc(i.id)}`)),
      },
      { title: "Webhooks", description: "Subscriptions that push call, number, user and contact events to a URL." },
    ),
    campaigns: router(
      {
        list: query({ description: `List dialer campaigns. ${pagingNote}`, input: List }, async (_c, i) => send("GET", "/campaigns", { query: listQuery(i) })),
        get: query({ description: "Get one campaign.", input: object({ id }) }, async (_c, i) => send("GET", `/campaigns/${enc(i.id)}`)),
        stats: query({ description: "Get campaign statistics.", input: object({ id }) }, async (_c, i) => send("GET", `/campaigns/${enc(i.id)}/stats`)),
        contacts: sub("campaigns/:id/contacts", "List the contacts of a campaign."),
        users: sub("campaigns/:id/users", "List the users assigned to a campaign."),
        teams: sub("campaigns/:id/teams", "List the teams assigned to a campaign."),
        lines: sub("campaigns/:id/lines", "List the lines of a campaign."),
        agents: sub("campaigns/:id/agents", "List the agents of a campaign."),
        queueItems: sub("campaigns/:id/queue_items", "List the queue items of a campaign."),
        callOutcomes: sub("campaigns/:id/call_outcomes", "List the call outcomes of a campaign."),
        create: mutation({ description: "Create a campaign. body as documented by Aircall.", input: Body, approval: always() }, async (_c, i) => send("POST", "/campaigns", { body: i.body })),
        update: mutation({ description: "Update a campaign. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("PUT", `/campaigns/${enc(i.id)}`, { body: i.body })),
        delete: mutation({ description: "Delete a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/campaigns/${enc(i.id)}`)),
        launch: mutation({ description: "Launch a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/launch`)),
        pause: mutation({ description: "Pause a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/pause`)),
        resume: mutation({ description: "Resume a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/resume`)),
        archive: mutation({ description: "Archive a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/archive`)),
        duplicate: mutation({ description: "Duplicate a campaign.", input: object({ id }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/duplicate`)),
        addContacts: mutation({ description: "Add contacts to a campaign. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/contacts`, { body: i.body })),
        removeContact: mutation({ description: "Remove a contact (by phone number) from a campaign.", input: object({ id, phoneNumber: id }), approval: always() }, async (_c, i) => send("DELETE", `/campaigns/${enc(i.id)}/contacts/${enc(i.phoneNumber)}`)),
        addUsers: mutation({ description: "Assign users to a campaign. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/users`, { body: i.body })),
        removeUser: mutation({ description: "Unassign a user from a campaign.", input: object({ id, userId: id }), approval: always() }, async (_c, i) => send("DELETE", `/campaigns/${enc(i.id)}/users/${enc(i.userId)}`)),
        addTeams: mutation({ description: "Assign teams to a campaign. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("POST", `/campaigns/${enc(i.id)}/teams`, { body: i.body })),
        removeTeam: mutation({ description: "Unassign a team from a campaign.", input: object({ id, teamId: id }), approval: always() }, async (_c, i) => send("DELETE", `/campaigns/${enc(i.id)}/teams/${enc(i.teamId)}`)),
        outcomes: query({ description: "List campaign outcomes.", input: List }, async (_c, i) => send("GET", "/campaign_outcomes", { query: listQuery(i) })),
        getOutcome: query({ description: "Get one campaign outcome.", input: object({ id }) }, async (_c, i) => send("GET", `/campaign_outcomes/${enc(i.id)}`)),
        createOutcome: mutation({ description: "Create a campaign outcome. body as documented by Aircall.", input: Body, approval: always() }, async (_c, i) => send("POST", "/campaign_outcomes", { body: i.body })),
        updateOutcome: mutation({ description: "Update a campaign outcome. body as documented by Aircall.", input: object({ id, body: json() }), approval: always() }, async (_c, i) => send("PUT", `/campaign_outcomes/${enc(i.id)}`, { body: i.body })),
        deleteOutcome: mutation({ description: "Delete a campaign outcome.", input: object({ id }), approval: always() }, async (_c, i) => send("DELETE", `/campaign_outcomes/${enc(i.id)}`)),
      },
      { title: "Campaigns", description: "Dialer campaigns, their contacts, assignees, queue and outcomes." },
    ),
    trackers: router(
      {
        list: query({ description: "List conversation intelligence trackers.", input: List }, async (_c, i) => send("GET", "/trackers", { query: listQuery(i) })),
        get: query({ description: "Get one tracker.", input: object({ id }) }, async (_c, i) => send("GET", `/trackers/${enc(i.id)}`)),
      },
      { title: "Trackers", description: "Conversation intelligence trackers." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { aircall: aircall.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.aircall ?? [], (account) => build(client(account, fetch, signal)), { signal }),
      {
        title: "Aircall",
        description:
          "Cloud phone system: calls and AI call insights, users, numbers, contacts, tags, teams, webhooks, SMS and WhatsApp messages, and dialer campaigns.",
        icons,
      },
    ),
  }),
);

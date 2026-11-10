import {
  accountRouter,
  array,
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

const base = "https://api.dailybot.com/v1";

const dailybot = defineProvider({
  name: "Dailybot",
  hosts: ["api.dailybot.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/me/ works with any API key. Keys require a paid Dailybot plan.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me/`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Query = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, options: { query?: Query; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { "X-API-KEY": token, Accept: "application/json", "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    // DELETE endpoints may answer 204 with no body.
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const paging = {
  page: number().optional(),
  page_size: number().optional(),
};
const uuid = (label: string) => string({ minLength: 1 });
const Body = object({ body: json() });

function build(call: ReturnType<typeof client>) {
  return router({
    me: query(
      { description: "The identity (user and organization role) the API key acts as.", input: object({}) },
      async () => call("GET", "/me/"),
    ),
    organization: query(
      { description: "The Dailybot organization the API key belongs to.", input: object({}) },
      async () => call("GET", "/organization/"),
    ),
    users: router(
      {
        list: query(
          {
            description: "List organization members. Page-number pagination ({count, next, previous, results}).",
            input: object({ search: string().optional(), include_email: string().optional(), only_active: string().optional(), ...paging }),
          },
          async (_ctx, input) => call("GET", "/users/", { query: input }),
        ),
        get: query(
          { description: "Retrieve a user by UUID.", input: object({ uuid: uuid("user") }) },
          async (_ctx, { uuid }) => call("GET", `/users/${encodeURIComponent(uuid)}/`),
        ),
      },
      { title: "Users", description: "The organization directory." },
    ),
    teams: router(
      {
        list: query(
          { description: "List teams.", input: object({ ...paging }) },
          async (_ctx, input) => call("GET", "/teams/", { query: input }),
        ),
        get: query(
          { description: "Retrieve a team by UUID.", input: object({ uuid: uuid("team") }) },
          async (_ctx, { uuid }) => call("GET", `/teams/${encodeURIComponent(uuid)}/`),
        ),
        members: query(
          { description: "List the members of a team.", input: object({ team_uuid: uuid("team"), ...paging }) },
          async (_ctx, { team_uuid, ...rest }) =>
            call("GET", `/teams/${encodeURIComponent(team_uuid)}/members/`, { query: rest }),
        ),
        addMember: mutation(
          {
            description: "Add a user to a team. role is 'member' (default) or 'lead'.",
            input: object({ team_uuid: uuid("team"), user_uuid: uuid("user"), role: string().optional() }),
          },
          async (_ctx, { team_uuid, user_uuid, role }) =>
            call("POST", `/teams/${encodeURIComponent(team_uuid)}/member/`, { body: { user_uuid, role } }),
        ),
        removeMember: mutation(
          {
            description: "Remove a user from a team.",
            input: object({ team_uuid: uuid("team"), user_uuid: uuid("user") }),
          },
          async (_ctx, { team_uuid, user_uuid }) =>
            call("DELETE", `/teams/${encodeURIComponent(team_uuid)}/member/${encodeURIComponent(user_uuid)}/`),
        ),
      },
      { title: "Teams", description: "Teams and team membership." },
    ),
    checkins: router(
      {
        list: query(
          {
            description:
              "List check-ins (standups). Filter by search, team_uuid, user_uuid; date (YYYY-MM-DD) gives summary context.",
            input: object({
              search: string().optional(),
              team_uuid: string().optional(),
              user_uuid: string().optional(),
              date: string().optional(),
              include_pending_users: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, input) => call("GET", "/checkins/", { query: input }),
        ),
        get: query(
          {
            description: "Full check-in configuration: schedule, questions, participants and report channels.",
            input: object({ uuid: uuid("check-in") }),
          },
          async (_ctx, { uuid }) => call("GET", `/checkins/${encodeURIComponent(uuid)}/detail/`),
        ),
        create: mutation(
          {
            description:
              "Create a check-in (admin or manager only). Body example: {name, questions: [{type: 'text', label, short_question}], participants: {user_uuids: [...]}} plus optional schedule fields.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/checkins/create/", { body }),
        ),
        update: mutation(
          {
            description: "Update check-in configuration (name, schedule, participants, report channels). Body is a partial config.",
            input: object({ uuid: uuid("check-in"), body: json() }),
          },
          async (_ctx, { uuid, body }) => call("PATCH", `/checkins/${encodeURIComponent(uuid)}/config/`, { body }),
        ),
        archive: mutation(
          { description: "Archive (deactivate) a check-in.", input: object({ uuid: uuid("check-in") }) },
          async (_ctx, { uuid }) => call("DELETE", `/checkins/${encodeURIComponent(uuid)}/archive/`),
        ),
        addQuestion: mutation(
          {
            description: "Add a question to a check-in. Body example: {type: 'text', label, short_question}.",
            input: object({ uuid: uuid("check-in"), body: json() }),
          },
          async (_ctx, { uuid, body }) => call("POST", `/checkins/${encodeURIComponent(uuid)}/questions/`, { body }),
        ),
        updateQuestion: mutation(
          {
            description: "Update a check-in question. Body is the fields to change.",
            input: object({ uuid: uuid("check-in"), question_uuid: uuid("question"), body: json() }),
          },
          async (_ctx, { uuid, question_uuid, body }) =>
            call("PATCH", `/checkins/${encodeURIComponent(uuid)}/questions/${encodeURIComponent(question_uuid)}/`, { body }),
        ),
        deleteQuestion: mutation(
          {
            description: "Delete a check-in question.",
            input: object({ uuid: uuid("check-in"), question_uuid: uuid("question") }),
          },
          async (_ctx, { uuid, question_uuid }) =>
            call("DELETE", `/checkins/${encodeURIComponent(uuid)}/questions/${encodeURIComponent(question_uuid)}/delete/`),
        ),
        responses: query(
          {
            description:
              "List participants' responses to a check-in. Defaults to today; pass start_date and end_date (YYYY-MM-DD). Admins and managers may filter by user (UUID); members only see their own.",
            input: object({
              uuid: uuid("check-in"),
              start_date: string().optional(),
              end_date: string().optional(),
              search: string().optional(),
              user: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, { uuid, ...rest }) =>
            call("GET", `/checkins/${encodeURIComponent(uuid)}/responses/`, { query: rest }),
        ),
        respond: mutation(
          {
            description:
              "Create a check-in response for the key owner. Body maps to the check-in's questions; read the check-in with checkins.get first.",
            input: object({ uuid: uuid("check-in"), body: json() }),
          },
          async (_ctx, { uuid, body }) => call("POST", `/checkins/${encodeURIComponent(uuid)}/responses/`, { body }),
        ),
      },
      { title: "Check-ins", description: "Async standups: check-ins, their questions and responses." },
    ),
    templates: router(
      {
        list: query(
          { description: "List pre-built check-in templates.", input: object({}) },
          async () => call("GET", "/templates/"),
        ),
        get: query(
          { description: "Retrieve a check-in template.", input: object({ id: uuid("template") }) },
          async (_ctx, { id }) => call("GET", `/templates/${encodeURIComponent(id)}/`),
        ),
      },
      { title: "Templates", description: "Pre-built check-in templates." },
    ),
    forms: router(
      {
        list: query(
          {
            description: "List forms. Set include to 'questions' to embed each form's questions.",
            input: object({ include: string().optional(), search: string().optional(), ...paging }),
          },
          async (_ctx, input) => call("GET", "/forms/", { query: input }),
        ),
        get: query(
          { description: "Retrieve a form.", input: object({ uuid: uuid("form") }) },
          async (_ctx, { uuid }) => call("GET", `/forms/${encodeURIComponent(uuid)}/`),
        ),
        create: mutation(
          {
            description:
              "Create a form (admin or manager). Body example: {name, questions: [{type: 'text', label, short_question}]} with at least one question.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/forms/create/", { body }),
        ),
        update: mutation(
          {
            description: "Update form configuration. Body is a partial config.",
            input: object({ uuid: uuid("form"), body: json() }),
          },
          async (_ctx, { uuid, body }) => call("PATCH", `/forms/${encodeURIComponent(uuid)}/config/`, { body }),
        ),
        archive: mutation(
          { description: "Archive (deactivate) a form.", input: object({ uuid: uuid("form") }) },
          async (_ctx, { uuid }) => call("DELETE", `/forms/${encodeURIComponent(uuid)}/archive/`),
        ),
        responses: query(
          {
            description: "List responses to a form. Set all to 'true' to include every participant's responses.",
            input: object({ uuid: uuid("form"), all: string().optional(), ...paging }),
          },
          async (_ctx, { uuid, ...rest }) =>
            call("GET", `/forms/${encodeURIComponent(uuid)}/responses/`, { query: rest }),
        ),
        getResponse: query(
          {
            description: "Retrieve one form response.",
            input: object({ uuid: uuid("form"), response_uuid: uuid("response") }),
          },
          async (_ctx, { uuid, response_uuid }) =>
            call("GET", `/forms/${encodeURIComponent(uuid)}/responses/${encodeURIComponent(response_uuid)}/`),
        ),
        submitResponse: mutation(
          {
            description:
              "Submit a form response. Body: {content: {<question-uuid>: answer}} (scalars or arrays of scalars), optional anonymous, automation, guest_user {full_name, email}, submission_source. Read the form with include=questions for question UUIDs.",
            input: object({ uuid: uuid("form"), body: json() }),
          },
          async (_ctx, { uuid, body }) => call("POST", `/forms/${encodeURIComponent(uuid)}/responses/`, { body }),
        ),
        updateResponse: mutation(
          {
            description: "Update a form response. Body is the fields to change.",
            input: object({ uuid: uuid("form"), response_uuid: uuid("response"), body: json() }),
          },
          async (_ctx, { uuid, response_uuid, body }) =>
            call("PATCH", `/forms/${encodeURIComponent(uuid)}/responses/${encodeURIComponent(response_uuid)}/`, { body }),
        ),
        deleteResponse: mutation(
          {
            description: "Delete a form response.",
            input: object({ uuid: uuid("form"), response_uuid: uuid("response") }),
          },
          async (_ctx, { uuid, response_uuid }) =>
            call("DELETE", `/forms/${encodeURIComponent(uuid)}/responses/${encodeURIComponent(response_uuid)}/`),
        ),
        transitionResponse: mutation(
          {
            description: "Move a form response through the form's workflow or approval states. Body names the transition.",
            input: object({ uuid: uuid("form"), response_uuid: uuid("response"), body: json() }),
          },
          async (_ctx, { uuid, response_uuid, body }) =>
            call(
              "POST",
              `/forms/${encodeURIComponent(uuid)}/responses/${encodeURIComponent(response_uuid)}/transition/`,
              { body },
            ),
        ),
      },
      { title: "Forms", description: "Forms and their responses, including approval workflows." },
    ),
    labels: router(
      {
        list: query(
          { description: "List organization labels.", input: object({ ...paging }) },
          async (_ctx, input) => call("GET", "/labels/", { query: input }),
        ),
        items: query(
          { description: "List the items that carry a label.", input: object({ label_uuid: uuid("label") }) },
          async (_ctx, { label_uuid }) => call("GET", `/labels/${encodeURIComponent(label_uuid)}/items/`),
        ),
        create: mutation(
          { description: "Create a label. Body example: {name, color}.", input: Body },
          async (_ctx, { body }) => call("POST", "/labels/", { body }),
        ),
        update: mutation(
          { description: "Update a label.", input: object({ label_uuid: uuid("label"), body: json() }) },
          async (_ctx, { label_uuid, body }) => call("PATCH", `/labels/${encodeURIComponent(label_uuid)}/`, { body }),
        ),
        archive: mutation(
          { description: "Archive a label.", input: object({ label_uuid: uuid("label") }) },
          async (_ctx, { label_uuid }) => call("POST", `/labels/${encodeURIComponent(label_uuid)}/archive/`),
        ),
        delete: mutation(
          { description: "Permanently delete a label.", input: object({ label_uuid: uuid("label") }) },
          async (_ctx, { label_uuid }) => call("DELETE", `/labels/${encodeURIComponent(label_uuid)}/`),
        ),
      },
      { title: "Labels", description: "Organization labels for check-ins, forms and workflows." },
    ),
    messaging: router(
      {
        sendMessage: mutation(
          {
            description:
              "Send a bot message. Provide at least one of target_users (UUIDs, emails or external IDs), target_channels (IDs, or {id, channel_type?, thread?}) and target_teams (UUIDs), plus message text. Optional buttons (max 25), image_url, metadata, thread_responses, bot_message_id (re-send within 72 hours to edit).",
            input: object({
              target_users: array(string()).optional(),
              target_channels: array(json()).optional(),
              target_teams: array(string()).optional(),
              message: string({ minLength: 1 }),
              image_url: string().optional(),
              bot_message_id: string().optional(),
              buttons: array(json()).optional(),
              thread_responses: array(json()).optional(),
              metadata: json().optional(),
            }),
          },
          async (_ctx, body) => call("POST", "/send-message/", { body }),
        ),
        sendEmail: mutation(
          {
            description: "Send an email through Dailybot. Body example: {to, subject, body}; see Dailybot's messaging docs.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/send-email/", { body }),
        ),
        openConversation: mutation(
          {
            description: "Open a private conversation with one or more users. Body per Dailybot's messaging docs.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/open-conversation/", { body }),
        ),
      },
      { title: "Messaging", description: "Send bot messages and email to users, channels and teams." },
    ),
    kudos: router(
      {
        list: query(
          {
            description:
              "List kudos the key owner can see. filter is 'kudos_received' or 'kudos_given'; dates are YYYY-MM-DD.",
            input: object({
              filter: string().optional(),
              sender_uuid: string().optional(),
              receiver_uuid: string().optional(),
              start_date: string().optional(),
              end_date: string().optional(),
              search: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, input) => call("GET", "/kudos/", { query: input }),
        ),
        listOrganization: query(
          {
            description: "List all kudos in the organization (admin only).",
            input: object({
              filter: string().optional(),
              sender_uuid: string().optional(),
              receiver_uuid: string().optional(),
              start_date: string().optional(),
              end_date: string().optional(),
              search: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, input) => call("GET", "/kudos/organization/", { query: input }),
        ),
        wallOfFame: query(
          { description: "The kudos wall of fame leaderboard.", input: object({}) },
          async () => call("GET", "/kudos/wall-of-fame/"),
        ),
        give: mutation(
          {
            description:
              "Give kudos. receivers are user UUIDs; message is the text. Optional kudo_type_uuid, is_public, team_uuid.",
            input: object({
              receivers: array(string()),
              message: string({ minLength: 1 }),
              kudo_type_uuid: string().optional(),
              team_uuid: string().optional(),
            }),
          },
          async (_ctx, body) => call("POST", "/kudos/", { body }),
        ),
      },
      { title: "Kudos", description: "Give and read kudos." },
    ),
    mood: router(
      {
        track: mutation(
          {
            description: "Record a mood score from 1 (very low) to 5 (excellent) for the key owner. date is YYYY-MM-DD.",
            input: object({ score: number(), note: string().optional(), date: string().optional() }),
          },
          async (_ctx, body) => call("POST", "/mood/track/", { body }),
        ),
      },
      { title: "Mood", description: "Mood tracking." },
    ),
    importantDates: router(
      {
        list: query(
          { description: "List important dates such as birthdays and work anniversaries.", input: object({ ...paging }) },
          async (_ctx, input) => call("GET", "/important-date/", { query: input }),
        ),
        get: query(
          { description: "Retrieve an important date.", input: object({ uuid: uuid("date") }) },
          async (_ctx, { uuid }) => call("GET", `/important-date/${encodeURIComponent(uuid)}/`),
        ),
      },
      { title: "Important dates", description: "Birthdays and anniversaries." },
    ),
    workflows: router(
      {
        list: query(
          { description: "List automations (workflows). Plan-gated.", input: object({ ...paging }) },
          async (_ctx, input) => call("GET", "/workflows/", { query: input }),
        ),
        get: query(
          { description: "Retrieve an automation.", input: object({ uuid: uuid("workflow") }) },
          async (_ctx, { uuid }) => call("GET", `/workflows/${encodeURIComponent(uuid)}/`),
        ),
        create: mutation(
          {
            description:
              "Create an automation. Body: {name, trigger_type ('api_trigger', 'event', 'schedule', 'manual'), trigger_config, steps}.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/workflows/", { body }),
        ),
        update: mutation(
          { description: "Update an automation.", input: object({ uuid: uuid("workflow"), body: json() }) },
          async (_ctx, { uuid, body }) => call("PATCH", `/workflows/${encodeURIComponent(uuid)}/`, { body }),
        ),
        delete: mutation(
          { description: "Delete an automation.", input: object({ uuid: uuid("workflow") }) },
          async (_ctx, { uuid }) => call("DELETE", `/workflows/${encodeURIComponent(uuid)}/`),
        ),
        trigger: mutation(
          {
            description:
              "Fire an active automation whose trigger type is api_trigger. payload is a JSON object up to 8 KiB, exposed to steps as {{trigger.body.*}}.",
            input: object({ uuid: uuid("workflow"), payload: json().optional() }),
          },
          async (_ctx, { uuid, payload }) =>
            call("POST", `/workflows/${encodeURIComponent(uuid)}/trigger/`, { body: payload === undefined ? {} : { payload } }),
        ),
      },
      { title: "Automations", description: "Dailybot workflows, including API-triggered automations." },
    ),
    webhooks: router(
      {
        subscribe: mutation(
          {
            description:
              "Create a webhook subscription so Dailybot posts events to your URL. Body per Dailybot's webhooks docs.",
            input: Body,
          },
          async (_ctx, { body }) => call("POST", "/webhook-subscription/", { body }),
        ),
        sample: mutation(
          { description: "Deliver a sample event to a webhook subscription.", input: Body },
          async (_ctx, { body }) => call("POST", "/webhook-subscription/sample/", { body }),
        ),
      },
      { title: "Webhooks", description: "Event webhook subscriptions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { dailybot: dailybot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dailybot ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dailybot",
        description:
          "Dailybot async standups and team collaboration: check-ins and responses, forms, teams, users, kudos, mood, bot messages, email and automations.",
        icons,
      },
    ),
  }),
);

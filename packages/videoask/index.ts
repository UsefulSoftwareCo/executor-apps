import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
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

const base = "https://api.videoask.com";

const videoask = defineProvider({
  name: "VideoAsk",
  hosts: ["api.videoask.com"],
  auth: {
    // The temporary token from Account > API in the VideoAsk app; it expires, OAuth is the durable method.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Created under Organization Settings > Developer Apps; the connect page asks for that app's client.
    oauth: oauth2({
      authorizationUrl: "https://auth.videoask.com/authorize",
      tokenUrl: "https://auth.videoask.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["openid", "profile", "email", "offline_access"],
      authorizationParams: { audience: "https://api.videoask.com/" },
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${base}/me`, { signal, headers: { Authorization: `Bearer ${token}` } });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params, body: Params | undefined, organizationId: string | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(organizationId === undefined ? {} : { "organization-id": organizationId }),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

// Every tool takes named path ids, optional `query` parameters, optional `organizationId`
// (sent as the organization-id header) and, for writes, a JSON `body`.
const ids = (names: readonly string[]) => Object.fromEntries(names.map((id) => [id, string()]));
const common = { organizationId: string().optional(), query: record(json()).optional() };

function fill(path: string, names: readonly string[], input: Params) {
  let out = path;
  for (const name of names) out = out.replace(`{${name}}`, encodeURIComponent(String(input[name])));
  return out;
}

function read(call: Call, path: string, description: string, names: readonly string[] = []) {
  return query({ description, input: object({ ...ids(names), ...common }) }, async (_ctx, input: Params) =>
    call("GET", fill(path, names, input), (input.query as Params | undefined) ?? {}, undefined, input.organizationId as string | undefined),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, names: readonly string[] = [], body: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        ...ids(names),
        ...common,
        ...(body === "optional" ? { body: record(json()).optional() } : body ? { body: record(json()) } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, names, input), (input.query as Params | undefined) ?? {}, body ? (input.body as Params | undefined) : undefined, input.organizationId as string | undefined),
  );
}

function build(call: Call) {
  return router({
    me: read(call, "/me", "Retrieve the authenticated account."),
    organizations: router(
      {
        list: read(call, "/organizations", "List organizations you belong to."),
        invite: write(call, "POST", "/organizations/{organization_id}/invitations", "Invite a team member. body: email, role.", ["organization_id"]),
        updateSettings: write(call, "PATCH", "/organizations/{organization_id}/settings", "Change default settings for new videoasks. body holds the settings to change.", ["organization_id"]),
        setWorkingSchedule: write(call, "PUT", "/organizations/{organization_id}/working-schedule", "Set working hours. body is the schedule.", ["organization_id"]),
        updateNotifications: write(call, "PATCH", "/organizations/{organization_id}/notifications", "Change notification settings, such as disabling 'Human' notifications.", ["organization_id"]),
      },
      { title: "Organizations", description: "Organizations, team invitations and defaults." },
    ),
    forms: router(
      {
        list: read(call, "/forms", "List forms. Filters in query: limit, offset, with_count."),
        search: read(call, "/search/forms", "Search forms by keyword. query: search, limit."),
        get: read(call, "/forms/{form_id}", "Retrieve a form by id.", ["form_id"]),
        metrics: read(call, "/forms/{form_id}/metrics", "Form metrics. query: interval (daily, weekly, monthly), since, until (YYYY-MM-DD).", ["form_id"]),
        conversations: read(call, "/forms/{form_id}/conversations", "List a form's conversations. Filters in query: limit, offset, only_unread, tag, score_gt, score_lt, message_status, created_at_start_date, created_at_end_date, order_by.", ["form_id"]),
        create: write(call, "POST", "/forms", "Create a form. body: title, folder_id and other form fields."),
        update: write(call, "PATCH", "/forms/{form_id}", "Update a form: title, contact form, close date, end screen. body holds the fields to change.", ["form_id"]),
        duplicate: write(call, "POST", "/forms/{form_id}/duplicate", "Duplicate a form.", ["form_id"], "optional"),
        move: write(call, "POST", "/forms/{form_id}/move", "Move a form to another organization. body: organization_id.", ["form_id"]),
        restore: write(call, "POST", "/forms/{form_id}/restore", "Restore a deleted form.", ["form_id"], "optional"),
        delete: write(call, "DELETE", "/forms/{form_id}", "Delete a form. query: soft_delete=true keeps it restorable.", ["form_id"], false),
      },
      { title: "Forms", description: "Videoasks: create, edit, organize and measure them." },
    ),
    questions: router(
      {
        get: read(call, "/questions/{question_id}", "Retrieve a question (a videoask step).", ["question_id"]),
        answers: read(call, "/questions/{question_id}/answers", "List answers to a question. query: limit, offset.", ["question_id"]),
        insights: read(call, "/questions/{question_id}/insights", "Answer counts and poll option totals for a question.", ["question_id"]),
        create: write(call, "POST", "/questions", "Create a question. body: form_id, media_type, and media (external URL, upload or existing media id)."),
        update: write(call, "PATCH", "/questions/{question_id}", "Update a question: media, notes, script, titles. body holds the fields to change.", ["question_id"]),
        duplicate: write(call, "POST", "/questions/{question_id}/duplicate", "Duplicate a question.", ["question_id"], "optional"),
        trim: write(call, "POST", "/questions/{question_id}/trim", "Trim a question's video. body: start and end.", ["question_id"]),
        delete: write(call, "DELETE", "/questions/{question_id}", "Delete a question.", ["question_id"], false),
      },
      { title: "Questions", description: "The steps of a videoask and their answers." },
    ),
    contacts: router(
      {
        get: read(call, "/forms/{form_id}/contacts/{contact_id}", "Retrieve a contact. query: include_answers, include_messages.", ["form_id", "contact_id"]),
        create: write(call, "POST", "/respondents", "Create a contact. body: form_id, name, email, phone_number."),
        update: write(call, "PATCH", "/respondents/{respondent_id}", "Update a contact. body holds the fields to change.", ["respondent_id"]),
        deleteContact: write(call, "DELETE", "/respondents/{respondent_id}", "Delete a contact.", ["respondent_id"], false),
        deleteResponse: write(call, "DELETE", "/contacts/{contact_id}", "Delete a response. query: form_id is required.", ["contact_id"], false),
        markRead: write(call, "PATCH", "/conversations/{contact_id}/mark-read", "Mark a conversation read or unread. body: read.", ["contact_id"], "optional"),
      },
      { title: "Contacts", description: "Respondents and their responses." },
    ),
    tags: router(
      {
        list: read(call, "/tags", "List tags. query: limit, offset, title."),
        create: write(call, "POST", "/tags", "Create a tag. body: title."),
        update: write(call, "PATCH", "/tags/{tag_id}", "Update a tag. body: title.", ["tag_id"]),
        delete: write(call, "DELETE", "/tags/{tag_id}", "Delete a tag.", ["tag_id"], false),
        addToContact: write(call, "PATCH", "/contacts/{contact_id}/tags/{tag_id}", "Add a tag to a contact or remove it. body: action (add or remove).", ["contact_id", "tag_id"], "optional"),
      },
      { title: "Tags", description: "Labels for organizing contacts." },
    ),
    folders: router(
      {
        create: write(call, "POST", "/folders", "Create a folder. body: name."),
        update: write(call, "PATCH", "/folders/{folder_id}", "Update a folder. body holds the fields to change.", ["folder_id"]),
        delete: write(call, "DELETE", "/folders/{folder_id}", "Delete a folder. query: soft_delete=true keeps it restorable.", ["folder_id"], false),
      },
      { title: "Folders", description: "Folders that group forms." },
    ),
    webhooks: router(
      {
        list: read(call, "/forms/{form_id}/webhooks", "List a form's webhooks.", ["form_id"]),
        get: read(call, "/forms/{form_id}/webhooks/{tag}", "Retrieve a webhook by tag.", ["form_id", "tag"]),
        upsert: write(call, "PUT", "/forms/{form_id}/webhooks/{tag}", "Create or update a webhook. body: url, event_types.", ["form_id", "tag"]),
        delete: write(call, "DELETE", "/forms/{form_id}/webhooks/{tag}", "Delete a webhook.", ["form_id", "tag"], false),
      },
      { title: "Webhooks", description: "Per-form event notifications." },
    ),
    media: router(
      {
        transcript: read(call, "/media/{media_id}", "Retrieve a media item's transcript.", ["media_id"]),
        editCaptions: write(call, "PATCH", "/media/{media_id}", "Edit a media item's captions. body holds the changes.", ["media_id"]),
        createLanguage: write(call, "POST", "/custom-languages", "Create a custom language. body: name and code."),
      },
      { title: "Media", description: "Transcripts, captions and custom languages." },
    ),
    brandings: router(
      {
        list: read(call, "/brandings", "List brands."),
        get: read(call, "/brandings/{branding_id}", "Retrieve a brand.", ["branding_id"]),
        create: write(call, "POST", "/brandings", "Create a brand. body: name, colors, logo and favicon image ids."),
        update: write(call, "PATCH", "/brandings/{branding_id}", "Update a brand. body holds the fields to change.", ["branding_id"]),
      },
      { title: "Brands", description: "Branding applied to videoasks." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { videoask: videoask.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.videoask ?? [],
        (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(build(client(token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "VideoAsk",
        description: "Forms, questions, contacts and responses, tags, webhooks, folders and brands in VideoAsk.",
        icons,
      },
    ),
  }),
);

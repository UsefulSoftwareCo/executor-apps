import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Account = {
  fields: { clientId: string; clientSecret: string; personalAccessToken: string; region: string };
};
type Fetch = typeof fetch;

const regions = {
  us: { api: "https://api.filevineapp.com", identity: "https://identity.filevine.com" },
  ca: { api: "https://api.filevineapp.ca", identity: "https://identity.filevine.ca" },
} as const;

function region(account: Account) {
  const key = account.fields.region.trim().toLowerCase();
  if (key !== "us" && key !== "ca") throw new Error('Filevine region must be "us" or "ca".');
  return regions[key];
}

// Scopes Filevine recommends for the API gateway; the webhooks scope is needed for subscriptions.
// Both are listed in scopes_supported of the identity servers' OpenID discovery documents.
const scope =
  "fv.api.gateway.access tenant filevine.v2.api.* openid email fv.auth.tenant.read filevine.v2.webhooks";

type Session = { headers: Record<string, string>; api: string; orgId: string; userId: string; expiresAt: number };
const sessions = new Map<string, Session>();

// Filevine issues short-lived bearer tokens (about 20 minutes) in exchange for the
// personal access token plus client credentials, and every call also carries the org and user ids.
async function session(account: Account, fetch: Fetch, signal: AbortSignal): Promise<Session> {
  const urls = region(account);
  const cacheKey = `${urls.api}|${account.fields.clientId}|${account.fields.personalAccessToken}`;
  const cached = sessions.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached;

  const tokenResponse = await fetch(`${urls.identity}/connect/token`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "personal_access_token",
      token: account.fields.personalAccessToken,
      scope,
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
    }).toString(),
  });
  const token = await decodeJson(tokenResponse, object({ access_token: string(), expires_in: number() }));
  const bearer = { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" };

  const orgsResponse = await fetch(`${urls.api}/fv-app/v2/utils/GetUserOrgsWithToken`, {
    method: "POST",
    signal,
    headers: bearer,
  });
  const orgs = (await decodeJson(orgsResponse, json())) as Record<string, unknown>;
  // The gateway answers in PascalCase (UserId.Native, Orgs[].OrgId) on some tenants and camelCase on others.
  const userRaw = orgs.UserId ?? orgs.userId;
  const userId = String(typeof userRaw === "object" && userRaw !== null ? (userRaw as { Native?: unknown }).Native : userRaw);
  const orgList = (orgs.Orgs ?? orgs.orgs) as Array<Record<string, unknown>> | undefined;
  const first = orgList?.[0];
  const orgId = first === undefined ? undefined : (first.OrgId ?? first.orgId);
  if (orgId === undefined || userId === "undefined")
    throw new Error("Filevine returned no organization or user for this personal access token.");

  const next: Session = {
    api: urls.api,
    orgId: String(orgId),
    userId,
    expiresAt: Date.now() + token.expires_in * 1000,
    headers: { ...bearer, "x-fv-orgid": String(orgId), "x-fv-userid": userId },
  };
  sessions.set(cacheKey, next);
  return next;
}

const filevine = defineProvider({
  name: "Filevine",
  hosts: ["api.filevineapp.com", "api.filevineapp.ca", "identity.filevine.com", "identity.filevine.ca"],
  auth: {
    apiKey: secrets({
      label: "Personal access token and API client",
      fields: object({
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        personalAccessToken: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting the token and resolving the organization proves all four credentials at once.
  async health({ account, fetch, signal }) {
    const s = await session(account, fetch, signal);
    return { accountInfo: { externalId: `${s.orgId}:${s.userId}`, displayName: `Filevine org ${s.orgId}` } };
  },
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const filevineTools = (account: Account, signal: AbortSignal) => {
  const call = async (fetch: Fetch, method: string, path: string, body?: unknown) => {
    const s = await session(account, fetch, signal);
    const response = await fetch(`${s.api}/fv-app/v2${path}`, {
      method,
      signal,
      headers: body === undefined ? s.headers : { ...s.headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  const page = { offset: number().optional(), limit: number().optional() };
  const id = () => string();
  const bodyDoc = "body is the JSON request body as documented in the Filevine API v2 reference.";

  return router({
    organizations: query(
      {
        description:
          "Return the organization ids and user id this personal access token belongs to (Filevine's GetUserOrgsWithToken). Other tools use the first organization automatically.",
        input: object({}),
      },
      async ({ fetch }) => call(fetch, "POST", "/utils/GetUserOrgsWithToken"),
    ),
    listProjects: query(
      {
        description:
          "List projects (cases/matters), paged with offset and limit. Optionally filter by projectTypeId, phaseName, or modifiedSince (ISO 8601).",
        input: object({
          ...page,
          projectTypeId: number().optional(),
          phaseName: string().optional(),
          modifiedSince: string().optional(),
        }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `/Projects${search(input)}`),
    ),
    getProject: query(
      { description: "Get one project by its numeric id.", input: object({ projectId: id() }) },
      async ({ fetch }, { projectId }) => call(fetch, "GET", `/Projects/${encodeURIComponent(projectId)}`),
    ),
    createProject: mutation(
      {
        description: `Create a project. ${bodyDoc} Typically projectTypeId, projectName and a client contact.`,
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, "POST", "/Projects", body),
    ),
    updateProject: mutation(
      {
        description: `Update fields of a project (PATCH). ${bodyDoc}`,
        input: object({ projectId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { projectId, body }) =>
        call(fetch, "PATCH", `/Projects/${encodeURIComponent(projectId)}`, body),
    ),
    listContacts: query(
      {
        description: "List contacts, paged with offset and limit. q searches by name.",
        input: object({ ...page, q: string().optional() }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `/Contacts${search(input)}`),
    ),
    getContact: query(
      { description: "Get one contact by its numeric id.", input: object({ contactId: id() }) },
      async ({ fetch }, { contactId }) => call(fetch, "GET", `/Contacts/${encodeURIComponent(contactId)}`),
    ),
    createContact: mutation(
      {
        description: `Create a contact. ${bodyDoc} Typically firstName, lastName, emails and phones.`,
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, "POST", "/Contacts", body),
    ),
    addContactToProject: mutation(
      {
        description: `Attach an existing contact to a project. ${bodyDoc} Typically the contactId and the project role.`,
        input: object({ projectId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { projectId, body }) =>
        call(fetch, "POST", `/Projects/${encodeURIComponent(projectId)}/Contacts`, body),
    ),
    listProjectNotes: query(
      {
        description: "List the notes on a project, paged. since filters to notes modified after an ISO 8601 time.",
        input: object({ projectId: id(), ...page, since: string().optional() }),
      },
      async ({ fetch }, { projectId, ...rest }) =>
        call(fetch, "GET", `/Projects/${encodeURIComponent(projectId)}/Notes${search(rest)}`),
    ),
    createNote: mutation(
      {
        description: `Create a note on a project. ${bodyDoc} Typically projectId and body text.`,
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, "POST", "/Notes", body),
    ),
    updateNote: mutation(
      {
        description: `Update a note (PATCH). ${bodyDoc}`,
        input: object({ noteId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { noteId, body }) => call(fetch, "PATCH", `/Notes/${encodeURIComponent(noteId)}`, body),
    ),
    listProjectTasks: query(
      {
        description: "List tasks on a project, paged. Filter by assigneeId or status.",
        input: object({ projectId: id(), ...page, assigneeId: string().optional(), status: string().optional() }),
      },
      async ({ fetch }, { projectId, ...rest }) =>
        call(fetch, "GET", `/projects/${encodeURIComponent(projectId)}/tasks${search(rest)}`),
    ),
    createTask: mutation(
      {
        description: `Create a task on a project. ${bodyDoc} Typically a title, body, dueDate and assigneeId.`,
        input: object({ projectId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { projectId, body }) =>
        call(fetch, "POST", `/projects/${encodeURIComponent(projectId)}/tasks`, body),
    ),
    updateTask: mutation(
      {
        description: `Update a task, for example to complete it (PATCH). ${bodyDoc}`,
        input: object({ taskId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { taskId, body }) => call(fetch, "PATCH", `/tasks/${encodeURIComponent(taskId)}`, body),
    ),
    listProjectDeadlines: query(
      {
        description: "List deadlines on a project, paged. Filter by status and a from/to ISO 8601 date range.",
        input: object({
          projectId: id(),
          ...page,
          status: string().optional(),
          from: string().optional(),
          to: string().optional(),
        }),
      },
      async ({ fetch }, { projectId, ...rest }) =>
        call(fetch, "GET", `/projects/${encodeURIComponent(projectId)}/deadlines${search(rest)}`),
    ),
    createDeadline: mutation(
      {
        description: `Create a deadline on a project. ${bodyDoc} Typically name, dueDate and assigneeId.`,
        input: object({ projectId: id(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { projectId, body }) =>
        call(fetch, "POST", `/projects/${encodeURIComponent(projectId)}/deadlines`, body),
    ),
    listDocuments: query(
      {
        description: "List documents, paged with offset and limit. Pass projectId to restrict to one project.",
        input: object({ ...page, projectId: string().optional() }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `/Documents${search(input)}`),
    ),
    getDocument: query(
      {
        description: "Get a document's metadata by id, including its download details.",
        input: object({ documentId: id() }),
      },
      async ({ fetch }, { documentId }) => call(fetch, "GET", `/Documents/${encodeURIComponent(documentId)}`),
    ),
    listWebhookSubscriptions: query(
      { description: "List webhook subscriptions for the organization.", input: object({}) },
      async ({ fetch }) => call(fetch, "GET", "/webhooks/subscriptions"),
    ),
    createWebhookSubscription: mutation(
      {
        description: `Create a webhook subscription. ${bodyDoc} Typically an endpoint URL and the event names.`,
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, "POST", "/webhooks/subscriptions", body),
    ),
    deleteWebhookSubscription: mutation(
      {
        description: "Delete a webhook subscription by id.",
        input: object({ subscriptionId: id() }),
        approval: always(),
      },
      async ({ fetch }, { subscriptionId }) =>
        call(fetch, "DELETE", `/webhooks/subscriptions/${encodeURIComponent(subscriptionId)}`),
    ),
  });
};

export default defineApp({ user: { accounts: { filevine: filevine.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.filevine ?? [], (account) => filevineTools(account, signal), { signal }), {
    title: "Filevine",
    description: "Projects, contacts, notes, tasks, deadlines, documents and webhooks in Filevine legal case management.",
    icons,
  }),
}));

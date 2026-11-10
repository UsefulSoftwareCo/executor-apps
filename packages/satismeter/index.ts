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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://app.satismeter.com";

const satismeter = defineProvider({
  name: "SatisMeter",
  hosts: ["app.satismeter.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), projectId: string({ minLength: 1 }) }),
    }),
  },
  // Per the apidoc an invalid API key is 403 and an unknown project is 404, so probing the
  // project itself with the account's own project id requires a 2xx.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/v3/projects/${encodeURIComponent(account.fields.projectId)}`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`SatisMeter rejected the API key or project id (${response.status})`);
  },
});

type Account = { fields: { token: string; projectId: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const headers = (account: Account, body = false) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  ...(body ? { "Content-Type": "application/json" } : {}),
});

const enc = encodeURIComponent;

const range = {
  startDate: string().optional(),
  endDate: string().optional(),
};

const paging = {
  pageCursor: string().optional(),
  pageSize: number().optional(),
};

const rangeNote =
  "startDate and endDate are ISO 8601 timestamps (default: the last 30 days). pageSize is 1-100 (default 20); pass page.nextPageCursor from the previous result as pageCursor to fetch the next page.";

const satismeterTools = (account: Account, signal: AbortSignal) =>
  router({
    getProject: query(
      {
        description:
          "Get a project by id (name). Find the project id in SatisMeter under Settings > Integrations > API.",
        input: object({ projectId: string() }),
      },
      async ({ fetch }, { projectId }) =>
        decodeJson(
          await fetch(`${origin}/api/v3/projects/${enc(projectId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listSurveys: query(
      {
        description: "List the surveys (campaigns) of a project with id, name, type (nps, ces, csat, pmf, custom) and state (live, paused, draft).",
        input: object({ projectId: string() }),
      },
      async ({ fetch }, { projectId }) =>
        decodeJson(
          await fetch(`${origin}/api/v3/projects/${enc(projectId)}/campaigns`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getSurvey: query(
      {
        description: "Get one survey by id.",
        input: object({ projectId: string(), surveyId: string() }),
      },
      async ({ fetch }, { projectId, surveyId }) =>
        decodeJson(
          await fetch(`${origin}/api/v3/projects/${enc(projectId)}/campaigns/${enc(surveyId)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listProjectResponses: query(
      {
        description: `List responses across every survey in a project, with answers, user, location, device and method. ${rangeNote}`,
        input: object({ projectId: string(), ...range, ...paging }),
      },
      async ({ fetch }, { projectId, ...params }) =>
        decodeJson(
          await fetch(`${origin}/api/v3/projects/${enc(projectId)}/responses${search(params)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listSurveyResponses: query(
      {
        description: `List responses of one survey, with answers, user, location, device and method. ${rangeNote}`,
        input: object({ projectId: string(), surveyId: string(), ...range, ...paging }),
      },
      async ({ fetch }, { projectId, surveyId, ...params }) =>
        decodeJson(
          await fetch(
            `${origin}/api/v3/projects/${enc(projectId)}/campaigns/${enc(surveyId)}/responses${search(params)}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
    getSurveyStatistics: query(
      {
        description:
          "Get statistics of one survey: response count, display count, response rate and per-question statistics. startDate and endDate are ISO 8601 timestamps (default: the last 30 days).",
        input: object({ projectId: string(), surveyId: string(), ...range }),
      },
      async ({ fetch }, { projectId, surveyId, ...params }) =>
        decodeJson(
          await fetch(
            `${origin}/api/v3/projects/${enc(projectId)}/campaigns/${enc(surveyId)}/statistics${search(params)}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
    listUsers: query(
      {
        description:
          "List the users of a project, or find one user by the userId used in your widget. Each user has an internal id (needed to delete them), userId, traits, lastSeen and unsubscribed.",
        input: object({ projectId: string(), userId: string().optional() }),
      },
      async ({ fetch }, { projectId, userId }) =>
        decodeJson(
          await fetch(`${origin}/api/users${search({ project: projectId, userId })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    upsertUser: mutation(
      {
        description:
          "Create or update a user so surveys can target them. traits is a free-form object (name, email, createdAt, plan...). surveyDate (ISO 8601) changes when the user next sees a survey.",
        input: object({
          projectId: string(),
          userId: string(),
          traits: json().optional(),
          surveyDate: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { projectId, ...body }) =>
        decodeJson(
          await fetch(`${origin}/api/users`, {
            method: "POST",
            signal,
            headers: headers(account, true),
            body: JSON.stringify({ ...body, project: projectId }),
          }),
          json(),
        ),
    ),
    trackEvent: mutation(
      {
        description: "Record a named event for a user; survey targeting rules can react to events.",
        input: object({ projectId: string(), userId: string(), event: string() }),
        approval: always(),
      },
      async ({ fetch }, { projectId, userId, event }) =>
        decodeJson(
          await fetch(`${origin}/api/users`, {
            method: "POST",
            signal,
            headers: headers(account, true),
            body: JSON.stringify({ type: "track", userId, event, project: projectId }),
          }),
          json(),
        ),
    ),
    deleteUser: mutation(
      {
        description:
          "Delete a user and their personal data; their responses are anonymized, not deleted. id is the internal id from listUsers, not the widget userId.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => {
        const response = await fetch(`${origin}/api/users/${enc(id)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        if (!response.ok) throw new Error(`SatisMeter returned ${response.status} deleting user`);
        return { deleted: true };
      },
    ),
    getUnsubscribes: query(
      {
        description: "Get the list of unsubscribed email addresses of a project (data.attributes.emails).",
        input: object({ projectId: string() }),
      },
      async ({ fetch }, { projectId }) =>
        decodeJson(
          await fetch(`${origin}/api/v2/project-unsubscribes/${enc(projectId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    setUnsubscribes: mutation(
      {
        description:
          "Replace the unsubscribed email list of a project with exactly the given emails. Read the current list with getUnsubscribes first and include the existing addresses to keep them.",
        input: object({ projectId: string(), emails: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { projectId, emails }) =>
        decodeJson(
          await fetch(`${origin}/api/v2/project-unsubscribes/${enc(projectId)}`, {
            method: "PATCH",
            signal,
            headers: headers(account, true),
            body: JSON.stringify({ data: { id: projectId, type: "project-unsubscribes", attributes: { emails } } }),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { satismeter: satismeter.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.satismeter ?? [], (account) => satismeterTools(account, signal), { signal }), {
    title: "SatisMeter",
    description:
      "Read SatisMeter surveys, responses and statistics, manage survey users and unsubscribed emails, and track user events.",
    icons,
  }),
}));

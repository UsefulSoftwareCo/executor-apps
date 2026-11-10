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
  plain,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.coassemble.com/api/v1/headless";

const coassemble = defineProvider({
  name: "Coassemble",
  hosts: ["api.coassemble.com"],
  auth: {
    apiKey: secrets({
      label: "Workspace API key",
      fields: object({
        workspaceId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/clients?length=1`, {
      signal,
      headers: { Authorization: authorization(account.fields) },
    });
    await decodeJson(response, array(json()));
  },
});

// Every request sends COASSEMBLE:<workspace id>:<api key> as the whole Authorization value.
function authorization(fields: { workspaceId: string; token: string }) {
  return `COASSEMBLE:${fields.workspaceId}:${fields.token}`;
}

type Params = Record<string, unknown>;

function client(fields: { workspaceId: string; token: string }, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    return target.toString();
  };
  const send = async (method: string, path: string, params: Params = {}, body?: Params) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: {
        Authorization: authorization(fields),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    // Some endpoints (deletes) document no response body.
    const text = await response.text();
    if (!response.ok) throw new Error(`Coassemble returned ${response.status}: ${text.slice(0, 500)}`);
    return text ? JSON.parse(text) : { ok: true };
  };
  return {
    get: (path: string, params?: Params) => send("GET", path, params),
    post: (path: string, body: Params = {}, params?: Params) => send("POST", path, params, body),
    put: (path: string, body: Params) => send("PUT", path, {}, body),
    del: (path: string, params?: Params) => send("DELETE", path, params),
  };
}

type Client = ReturnType<typeof client>;
const id = (value: string) => encodeURIComponent(value);

const owner = {
  identifier: string().optional(),
  clientIdentifier: string().optional(),
};

function tools(c: Client) {
  return router({
    courses: router(
      {
        list: query(
          {
            description:
              "List courses in the workspace. Filter by owner identifier, clientIdentifier or title; deleted=true lists soft-deleted courses. Paged with length (default 100) and page (from 0).",
            input: object({
              ...owner,
              title: string().optional(),
              deleted: boolean().optional(),
              length: number().optional(),
              page: number().optional(),
            }),
          },
          async (_ctx, input) => c.get("/courses", input),
        ),
        get: query(
          {
            description: "Get one course's details by id.",
            input: object({ id: string({ minLength: 1 }), ...owner }),
          },
          async (_ctx, { id: courseId, ...rest }) => c.get(`/courses/${id(courseId)}`, rest),
        ),
        getContent: query(
          {
            description: "Get a course's full content: screens, blocks and questions.",
            input: object({ id: string({ minLength: 1 }), ...owner }),
          },
          async (_ctx, { id: courseId, ...rest }) => c.get(`/course/content/${id(courseId)}`, rest),
        ),
        getScorm: query(
          {
            description:
              "Export a course as a SCORM package (Partner plan). type is dynamic or static; version is 1.2 or 2004.",
            input: object({
              id: string({ minLength: 1 }),
              type: string().optional(),
              version: string().optional(),
            }),
          },
          async (_ctx, { id: courseId, ...rest }) => c.get(`/course/scorm/${id(courseId)}`, rest),
        ),
        getMigration: query(
          {
            description: "Get the status of a batch course migration. Use the batch id returned by a 202 from migrate.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id: batchId }) => c.get(`/course-migrations/${id(batchId)}`),
        ),
        duplicate: mutation(
          {
            description: "Duplicate a course. identifier and clientIdentifier optionally override the copy's owner.",
            input: object({ id: string({ minLength: 1 }), ...owner }),
            approval: always(),
          },
          async (_ctx, { id: courseId, ...body }) => c.post(`/course/${id(courseId)}/duplicate`, body),
        ),
        delete: mutation(
          {
            description: "Soft-delete a course. It can be brought back with restore.",
            input: object({ id: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { id: courseId }) => c.del(`/course/${id(courseId)}`),
        ),
        restore: mutation(
          {
            description: "Restore a soft-deleted course.",
            input: object({ id: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { id: courseId }) => c.post(`/course/${id(courseId)}/restore`),
        ),
        publish: mutation(
          {
            description: "Publish a course's current draft.",
            input: object({ id: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { id: courseId }) => c.post(`/course/${id(courseId)}/publish`),
        ),
        revert: mutation(
          {
            description: "Discard draft changes and revert a course to its published version.",
            input: object({ id: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { id: courseId }) => c.post(`/course/${id(courseId)}/revert`),
        ),
        regenerateThumbnail: mutation(
          {
            description: "Regenerate a course's card thumbnail.",
            input: object({ id: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { id: courseId }) => c.post(`/course/${id(courseId)}/thumbnail`),
        ),
        migrate: mutation(
          {
            description:
              "Migrate legacy courses to the current format (up to 50 ids). One unique course returns the result; two or more return a batch id for getMigration.",
            input: object({ courseIds: array(string({ minLength: 1 })) }),
            approval: always(),
          },
          async (_ctx, { courseIds }) => c.post("/course-migrations", { courseIds }),
        ),
      },
      { title: "Courses", description: "Read, publish, duplicate, delete and export courses." },
    ),
    generate: router(
      {
        courseWithAgent: mutation(
          {
            description:
              "Run Coassemble's create-course agent from a prompt and/or documents ({ name, url, mimeType? }). Returns the finished course; large documents can take minutes. fidelityLevel (verbatim, structured, adaptive) is required when exactly one document is given. assessment is a list of formative, summative, flashcards, none.",
            input: object({
              identifier: string({ minLength: 1 }),
              prompt: string().optional(),
              documents: array(record(json())).optional(),
              fidelityLevel: string().optional(),
              selectedImages: json().optional(),
              assessment: array(string()).optional(),
              audience: string().optional(),
              learningOutcomes: array(string()).optional(),
              language: string().optional(),
              tone: string().optional(),
              timeEstimateMinutes: number().optional(),
              useBrandVoice: boolean().optional(),
              folderId: number().optional(),
              clientIdentifier: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/generate/course/agent", input),
        ),
        course: mutation(
          {
            description: "Generate a course from a prompt. All fields except clientIdentifier are required.",
            input: object({
              identifier: string({ minLength: 1 }),
              prompt: string({ minLength: 1 }),
              audience: string({ minLength: 1 }),
              familiarity: string({ minLength: 1 }),
              tone: string({ minLength: 1 }),
              screenCount: number(),
              clientIdentifier: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/generate/course", input),
        ),
        screen: mutation(
          {
            description:
              "Generate one screen and append it to a course. type is text, process, checklist, flashcards or list; content is source text to summarise.",
            input: object({
              id: string({ minLength: 1 }),
              type: string({ minLength: 1 }),
              title: string().optional(),
              prompt: string().optional(),
              content: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { id: courseId, ...body }) => c.post(`/generate/course/${id(courseId)}/screen`, body),
        ),
        quiz: mutation(
          {
            description:
              "Generate a quiz screen with questions inside a course. questionTypes: multipleChoiceImg, multipleResponse, trueFalse, writeAnswer, dropDown, matchCorresponding, matchSequence. passingGrade is 0 to 100 when scored.",
            input: object({
              id: string({ minLength: 1 }),
              prompt: string().optional(),
              content: string().optional(),
              questionCount: number().optional(),
              questionTypes: array(string()).optional(),
              scored: boolean().optional(),
              passingGrade: number().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { id: courseId, ...body }) => c.post(`/generate/course/${id(courseId)}/quiz`, body),
        ),
      },
      { title: "Generate", description: "Create courses, screens and quizzes with Coassemble's AI." },
    ),
    clients: router(
      {
        list: query(
          {
            description: "List clients (tenants) with their user counts. Paged with length (default 100) and page (from 0).",
            input: object({ length: number().optional(), page: number().optional() }),
          },
          async (_ctx, input) => c.get("/clients", input),
        ),
        get: query(
          {
            description: "Get one client by its clientIdentifier.",
            input: object({ identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { identifier }) => c.get(`/client/${id(identifier)}`),
        ),
        update: mutation(
          {
            description: "Update a client's metadata.",
            input: object({ identifier: string({ minLength: 1 }), metadata: record(json()).optional() }),
            approval: always(),
          },
          async (_ctx, { identifier, ...body }) => c.put(`/client/${id(identifier)}`, body),
        ),
        delete: mutation(
          {
            description: "Delete a client and every object tied to its identifier. Cannot be undone.",
            input: object({ identifier: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { identifier }) => c.del(`/client/${id(identifier)}`),
        ),
      },
      { title: "Clients", description: "Tenants that group users and courses." },
    ),
    users: router(
      {
        list: query(
          {
            description: "List users, optionally for one clientIdentifier. Paged with length (default 100) and page (from 0).",
            input: object({
              clientIdentifier: string().optional(),
              length: number().optional(),
              page: number().optional(),
            }),
          },
          async (_ctx, input) => c.get("/users", input),
        ),
        get: query(
          {
            description: "Get one user by identifier.",
            input: object({ identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { identifier }) => c.get(`/user/${id(identifier)}`),
        ),
        update: mutation(
          {
            description: "Update a user's name, avatar URL, client or metadata.",
            input: object({
              identifier: string({ minLength: 1 }),
              clientIdentifier: string().optional(),
              name: string().optional(),
              avatar: string().optional(),
              metadata: record(json()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, { identifier, ...body }) => c.put(`/user/${id(identifier)}`, body),
        ),
        delete: mutation(
          {
            description:
              "Delete a user. action decides what happens to their courses: reallocate (to reallocateTo), delete, or ignore.",
            input: object({
              identifier: string({ minLength: 1 }),
              clientIdentifier: string().optional(),
              action: string().optional(),
              reallocateTo: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { identifier, ...rest }) => c.del(`/user/${id(identifier)}`, rest),
        ),
      },
      { title: "Users", description: "Course owners identified by your own stable user ids." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { coassemble: coassemble.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.coassemble ?? [], (account) => tools(client(account.fields, fetch, signal)), { signal }),
      {
        title: "Coassemble",
        description:
          "Coassemble training courses: list, publish, duplicate and export courses, generate courses, screens and quizzes with AI, and manage clients and users.",
        icons,
      },
    ),
  }),
);

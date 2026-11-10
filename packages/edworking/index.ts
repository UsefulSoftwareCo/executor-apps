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

const url = "https://gateway.edworking.com/";

const edworking = defineProvider({
  name: "Edworking",
  hosts: ["gateway.edworking.com"],
  auth: {
    // Personal API tokens (edw_pat_...) are created in profile settings > API tokens; there is no OAuth.
    apiKey: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ apiTokenInfo { id name userId teamId } }" }),
    });
    const body = (await decodeJson(response, json())) as { data?: unknown; errors?: Array<{ message?: string }> };
    // The gateway answers bad or missing tokens with HTTP 200 and a GraphQL errors body.
    if (body.errors?.length) throw new Error(body.errors.map((e) => e.message ?? "GraphQL error").join("; "));
    const { data } = await decodeJson(
      new Response(JSON.stringify(body)),
      object({ data: object({ apiTokenInfo: object({ id: string(), name: string(), userId: string(), teamId: string() }) }) }),
    );
    return { accountInfo: { externalId: data.apiTokenInfo.userId, displayName: data.apiTokenInfo.name } };
  },
});

type Vars = Record<string, unknown>;
type Call = (query: string, variables: Vars) => Promise<unknown>;

const page = { after: string().optional(), limit: number().optional() };
const order = { order: string().optional() };
const chat = object({ id: string(), kind: string() });

const taskFields = "id name projectId stateProjectId createdAt updatedAt deadline project { id name } stateProject { id value } users { id firstname lastname profileImg }";
const messageFields = "id body type authorId parentId createdAt updatedAt author { id firstname lastname profileImg } file { id name type size location }";
const fileFields = "id name code type size location shared base64 category duration createdAt updatedAt authorId projectId taskId folderId";

function build(call: Call) {
  const q = <S extends Record<string, unknown>>(description: string, input: ReturnType<typeof object>, doc: string, mapArgs: (args: any) => Vars) =>
    query({ description, input: input as never }, async (_ctx: unknown, args: any) => call(doc, mapArgs(args)));
  const m = (description: string, input: ReturnType<typeof object>, doc: string, mapArgs: (args: any) => Vars) =>
    mutation({ description, input: input as never }, async (_ctx: unknown, args: any) => call(doc, mapArgs(args)));
  const same = (args: Vars) => args;

  return router({
    token: router({
      info: q("Show the current API token: id, name, user, team, scopes and expiry.", object({}), "{ apiTokenInfo { id name userId teamId scopes expiresAt } }", same),
    }),
    projects: router({
      list: q(
        "List projects (50 per page by default, up to 100). Pass the last id as after for the next page. order is ID_ASC, CREATED_DESC or UPDATED_DESC.",
        object({ ...page, ...order }),
        `query($after: ID, $limit: Int, $order: ApiOrder) { apiProjects(after: $after, limit: $limit, order: $order) { id name createdAt updatedAt } }`,
        same,
      ),
      listStates: q(
        "List the task states (columns/statuses) of a project.",
        object({ projectId: string(), ...page }),
        `query($projectId: ID!, $after: ID, $limit: Int) { apiProjectStates(projectId: $projectId, after: $after, limit: $limit) { id value } }`,
        same,
      ),
      create: m(
        "Create a project.",
        object({ name: string(), description: string().optional() }),
        `mutation($name: String!, $description: String) { apiCreateProject(name: $name, description: $description) { id name createdAt updatedAt } }`,
        same,
      ),
    }),
    tasks: router({
      list: q(
        "List tasks, optionally for one project. Pass the last id as after for the next page. order is ID_ASC, CREATED_DESC or UPDATED_DESC.",
        object({ projectId: string().optional(), ...page, ...order }),
        `query($projectId: ID, $after: ID, $limit: Int, $order: ApiOrder) { apiTasks(projectId: $projectId, after: $after, limit: $limit, order: $order) { ${taskFields} } }`,
        same,
      ),
      get: q(
        "Get one task by id (null when it does not exist or is not accessible).",
        object({ id: string() }),
        `query($id: ID!) { apiTask(id: $id) { ${taskFields} } }`,
        same,
      ),
      create: m(
        "Create a task in a project. deadline is an ISO-8601 date-time; stateProjectId picks the initial state; fileIds attach already-uploaded files.",
        object({
          projectId: string(),
          name: string(),
          description: string().optional(),
          deadline: string().optional(),
          stateProjectId: string().optional(),
          fileIds: array(string()).optional(),
        }),
        `mutation($projectId: ID!, $name: String!, $description: String, $deadline: DateTime, $stateProjectId: ID, $fileIds: [ID!]) { apiCreateTask(projectId: $projectId, name: $name, description: $description, deadline: $deadline, stateProjectId: $stateProjectId, fileIds: $fileIds) { ${taskFields} } }`,
        same,
      ),
      rename: m(
        "Rename a task.",
        object({ id: string(), name: string() }),
        `mutation($id: ID!, $name: String!) { apiRenameTask(id: $id, name: $name) { ${taskFields} } }`,
        same,
      ),
      update: m(
        "Update a task's name and/or deadline (ISO-8601). The API cannot change the status of an existing task. deadline cannot be cleared through this tool.",
        object({ id: string(), name: string().optional(), deadline: string().optional() }),
        `mutation($id: ID!, $name: String, $deadline: DateTime) { apiUpdateTask(id: $id, name: $name, deadline: $deadline) { ${taskFields} } }`,
        same,
      ),
    }),
    messages: router({
      list: q(
        "List messages in a chat. chat.kind is project, task, privat or meetingroom and chat.id is that object's id. Pass the last id as after for the next page.",
        object({ chat, ...page, ...order }),
        `query($chat: ChatMessageScope!, $after: ID, $limit: Int, $order: ApiOrder) { apiMessages(chat: $chat, after: $after, limit: $limit, order: $order) { ${messageFields} } }`,
        same,
      ),
      send: m(
        "Send a message to a chat. chat.kind is project, task, privat or meetingroom and chat.id is that object's id.",
        object({ chat, body: string() }),
        `mutation($chat: ChatMessageScope!, $body: String!) { apiSendMessage(chat: $chat, body: $body) { id body authorId createdAt } }`,
        same,
      ),
      listPrivateChats: q(
        "List the token owner's private chats.",
        object({ ...page }),
        `query($after: ID, $limit: Int) { apiPrivateChats(after: $after, limit: $limit) { id name } }`,
        same,
      ),
    }),
    files: router({
      list: q(
        "List files of a project or a task. One of projectId or taskId is required (if both are given the task must belong to the project). Needs the files:read scope.",
        object({ projectId: string().optional(), taskId: string().optional(), ...page, ...order }),
        `query($projectId: ID, $taskId: ID, $after: ID, $limit: Int, $order: ApiOrder) { apiFiles(projectId: $projectId, taskId: $taskId, after: $after, limit: $limit, order: $order) { ${fileFields} } }`,
        same,
      ),
      upload: m(
        "Upload a file by public HTTP(S) URL into a project, task or folder. Limits: max 50 MiB, 30 second download timeout; private addresses, credentials embedded in the URL and unsafe redirects are rejected. Needs the files:write scope.",
        object({
          url: string(),
          projectId: string().optional(),
          taskId: string().optional(),
          folderId: string().optional(),
          name: string().optional(),
        }),
        `mutation($url: String!, $projectId: ID, $taskId: ID, $folderId: ID, $name: String) { apiUploadFile(url: $url, projectId: $projectId, taskId: $taskId, folderId: $folderId, name: $name) { ${fileFields} } }`,
        same,
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { edworking: edworking.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.edworking ?? [],
        (account) => {
          const call: Call = async (doc, variables) => {
            const response = await fetch(url, {
              method: "POST",
              signal,
              headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
              body: JSON.stringify({ query: doc, variables }),
            });
            const body = (await decodeJson(response, json())) as { data?: unknown; errors?: Array<{ message?: string }> };
            // GraphQL errors can arrive with HTTP 200.
            if (body.errors?.length) throw new Error(body.errors.map((e) => e.message ?? "GraphQL error").join("; "));
            return body.data;
          };
          return withApprovals(build(call), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "Edworking",
        description: "Projects, tasks, messages, chats and files in Edworking through its GraphQL API.",
        instructions: "Lists are cursor-paginated: pass the last returned id as after. Tokens are scoped; a tool fails with a GraphQL error if the token lacks its scope. Task status cannot be changed through the API.",
        icons,
      },
    ),
  }),
);

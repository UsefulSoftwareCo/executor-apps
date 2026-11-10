import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://www.pivotaltracker.com/services/v5";

const pivotal = defineProvider({
  name: "Pivotal Tracker",
  hosts: ["www.pivotaltracker.com"],
  auth: {
    // Pivotal Tracker has no OAuth for third parties; the personal API token is the only method.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { "X-TrackerToken": account.fields.token },
    });
    await decodeJson(response, object({ id: number() }));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) url.searchParams.set(key, value.join(","));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-TrackerToken": token,
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

// Every tool takes the path ids named in `ids`, `query` for URL parameters and (writes) a JSON `body`.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), query: filters }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody = true) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, number()])),
        query: filters,
        ...(hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, ids, input), (input.query as Params | undefined) ?? {}, hasBody ? (input.body as Params) : undefined),
  );
}

function fill(path: string, ids: readonly string[], input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function build(c: Call) {
  const p = "/projects/{project_id}";
  const pid = ["project_id"] as const;
  const withId = (id: string) => [...pid, id] as const;

  return router({
    me: query(
      { description: "The authenticated person: id, name, email, projects (with roles), time zone and API token.", input: object({ query: filters }) },
      async (_ctx, input: Params) => c("GET", "/me", (input.query as Params | undefined) ?? {}),
    ),
    accounts: router(
      {
        list: read(c, "/accounts", "List accounts the user belongs to."),
        get: read(c, "/accounts/{account_id}", "Retrieve one account.", ["account_id"]),
        memberships: read(c, "/accounts/{account_id}/memberships", "List members of an account.", ["account_id"]),
        summaries: read(c, "/account_summaries", "List account summaries with the user's account-level permissions."),
        projects: read(c, "/accounts/{account_id}/projects", "List projects in an account.", ["account_id"]),
      },
      { title: "Accounts", description: "Accounts and their members." },
    ),
    projects: router(
      {
        list: read(c, "/projects", "List projects the user can access. Query: account_ids, fields."),
        get: read(c, p, "Retrieve one project. Query: fields (for example `epic_ids,labels`).", pid),
        create: write(c, "POST", "/projects", "Create a project. body: name (required), account_id, iteration_length, week_start_day, point_scale, public, description, ..."),
        update: write(c, "PUT", p, "Update a project. body holds the fields to change.", pid),
        delete: write(c, "DELETE", p, "Delete a project.", pid, false),
        activity: read(c, `${p}/activity`, "Project activity feed. Query: limit, offset, occurred_before, occurred_after, since_version, with_tag.", pid),
        iterations: read(c, `${p}/iterations`, "List iterations. Query: scope (done, current, backlog, current_backlog), offset, limit, label.", pid),
        iteration: read(c, `${p}/iterations/{iteration_number}`, "Retrieve one iteration by number.", withId("iteration_number")),
        search: read(c, `${p}/search`, "Search stories, epics and more within a project. Query: query (required), fields.", pid),
      },
      { title: "Projects", description: "Projects, iterations, activity and search." },
    ),
    stories: router(
      {
        list: read(c, `${p}/stories`, "List stories. Query: filter (Tracker search syntax, e.g. `state:started owner:ABC`), with_state, with_label, after_story_id, before_story_id, limit, offset, fields.", pid),
        get: read(c, `${p}/stories/{story_id}`, "Retrieve one story. Query: fields.", withId("story_id")),
        create: write(c, "POST", `${p}/stories`, "Create a story. body: name (required), story_type (feature, bug, chore, release), description, current_state, estimate, owner_ids, label_ids or labels, requested_by_id, deadline, ...", pid),
        update: write(c, "PUT", `${p}/stories/{story_id}`, "Update a story. body holds the fields to change (current_state, estimate, owner_ids, ...).", withId("story_id")),
        delete: write(c, "DELETE", `${p}/stories/{story_id}`, "Delete a story.", withId("story_id"), false),
        bulkUpdate: write(c, "PUT", `${p}/stories/bulk`, "Bulk update stories. body: story_ids and the fields to change.", pid),
        activity: read(c, `${p}/stories/{story_id}/activity`, "Activity feed for a story.", withId("story_id")),
        history: read(c, `${p}/stories/{story_id}/history`, "Change history for a story.", withId("story_id")),
        owners: read(c, `${p}/stories/{story_id}/owners`, "People who own a story.", withId("story_id")),
        followers: read(c, `${p}/stories/{story_id}/followers`, "People following a story.", withId("story_id")),
        blockers: read(c, `${p}/stories/{story_id}/blockers`, "Blockers on a story.", withId("story_id")),
        createBlocker: write(c, "POST", `${p}/stories/{story_id}/blockers`, "Add a blocker to a story. body: description (required).", withId("story_id")),
        updateBlocker: write(c, "PUT", `${p}/stories/{story_id}/blockers/{blocker_id}`, "Update a blocker (for example resolved: true).", [...withId("story_id"), "blocker_id"]),
        deleteBlocker: write(c, "DELETE", `${p}/stories/{story_id}/blockers/{blocker_id}`, "Delete a blocker.", [...withId("story_id"), "blocker_id"], false),
        reviews: read(c, `${p}/stories/{story_id}/reviews`, "Reviews on a story.", withId("story_id")),
        createReview: write(c, "POST", `${p}/stories/{story_id}/reviews`, "Add a review. body: review_type_id, reviewer_id.", withId("story_id")),
        updateReview: write(c, "PUT", `${p}/stories/{story_id}/reviews/{review_id}`, "Update a review (for example status: pass or revise).", [...withId("story_id"), "review_id"]),
        deleteReview: write(c, "DELETE", `${p}/stories/{story_id}/reviews/{review_id}`, "Delete a review.", [...withId("story_id"), "review_id"], false),
        addLabel: write(c, "POST", `${p}/stories/{story_id}/labels`, "Add a label to a story. body: name or id.", withId("story_id")),
        removeLabel: write(c, "DELETE", `${p}/stories/{story_id}/labels/{label_id}`, "Remove a label from a story.", [...withId("story_id"), "label_id"], false),
        move: write(c, "PUT", `${p}/stories/{story_id}`, "Move a story in the backlog. body: before_id or after_id, or project_id to move it to another project.", withId("story_id")),
      },
      { title: "Stories", description: "Stories, blockers, reviews and story labels." },
    ),
    comments: router(
      {
        list: read(c, `${p}/stories/{story_id}/comments`, "List comments on a story. Query: fields (for example `:default,file_attachments`).", withId("story_id")),
        get: read(c, `${p}/stories/{story_id}/comments/{comment_id}`, "Retrieve one comment.", [...withId("story_id"), "comment_id"]),
        create: write(c, "POST", `${p}/stories/{story_id}/comments`, "Comment on a story. body: text (required).", withId("story_id")),
        update: write(c, "PUT", `${p}/stories/{story_id}/comments/{comment_id}`, "Edit a comment. body: text.", [...withId("story_id"), "comment_id"]),
        delete: write(c, "DELETE", `${p}/stories/{story_id}/comments/{comment_id}`, "Delete a comment.", [...withId("story_id"), "comment_id"], false),
        listEpic: read(c, `${p}/epics/{epic_id}/comments`, "List comments on an epic.", withId("epic_id")),
        createEpic: write(c, "POST", `${p}/epics/{epic_id}/comments`, "Comment on an epic. body: text (required).", withId("epic_id")),
        updateEpic: write(c, "PUT", `${p}/epics/{epic_id}/comments/{comment_id}`, "Edit an epic comment. body: text.", [...withId("epic_id"), "comment_id"]),
        deleteEpic: write(c, "DELETE", `${p}/epics/{epic_id}/comments/{comment_id}`, "Delete an epic comment.", [...withId("epic_id"), "comment_id"], false),
      },
      { title: "Comments", description: "Comments on stories and epics." },
    ),
    tasks: router(
      {
        list: read(c, `${p}/stories/{story_id}/tasks`, "List tasks (checklist items) on a story.", withId("story_id")),
        get: read(c, `${p}/stories/{story_id}/tasks/{task_id}`, "Retrieve one task.", [...withId("story_id"), "task_id"]),
        create: write(c, "POST", `${p}/stories/{story_id}/tasks`, "Add a task to a story. body: description (required), complete, position.", withId("story_id")),
        update: write(c, "PUT", `${p}/stories/{story_id}/tasks/{task_id}`, "Update a task (description, complete, position).", [...withId("story_id"), "task_id"]),
        delete: write(c, "DELETE", `${p}/stories/{story_id}/tasks/{task_id}`, "Delete a task.", [...withId("story_id"), "task_id"], false),
      },
      { title: "Tasks", description: "Story checklist tasks." },
    ),
    epics: router(
      {
        list: read(c, `${p}/epics`, "List epics. Query: filter, fields.", pid),
        get: read(c, `${p}/epics/{epic_id}`, "Retrieve one epic. Query: fields.", withId("epic_id")),
        create: write(c, "POST", `${p}/epics`, "Create an epic. body: name (required), description, label (object with name), target_date.", pid),
        update: write(c, "PUT", `${p}/epics/{epic_id}`, "Update an epic.", withId("epic_id")),
        delete: write(c, "DELETE", `${p}/epics/{epic_id}`, "Delete an epic.", withId("epic_id"), false),
        activity: read(c, `${p}/epics/{epic_id}/activity`, "Activity feed for an epic.", withId("epic_id")),
        followers: read(c, `${p}/epics/{epic_id}/followers`, "People following an epic.", withId("epic_id")),
      },
      { title: "Epics", description: "Epics grouping stories by label." },
    ),
    labels: router(
      {
        list: read(c, `${p}/labels`, "List labels in a project.", pid),
        get: read(c, `${p}/labels/{label_id}`, "Retrieve one label.", withId("label_id")),
        create: write(c, "POST", `${p}/labels`, "Create a label. body: name (required), kind.", pid),
        update: write(c, "PUT", `${p}/labels/{label_id}`, "Rename or update a label.", withId("label_id")),
        delete: write(c, "DELETE", `${p}/labels/{label_id}`, "Delete a label.", withId("label_id"), false),
      },
      { title: "Labels", description: "Project labels." },
    ),
    memberships: router(
      {
        list: read(c, `${p}/memberships`, "List project members and their roles.", pid),
        get: read(c, `${p}/memberships/{membership_id}`, "Retrieve one project membership.", withId("membership_id")),
        create: write(c, "POST", `${p}/memberships`, "Add a person to a project. body: email or person_id, role (owner, member, viewer), name, initials.", pid),
        update: write(c, "PUT", `${p}/memberships/{membership_id}`, "Update a membership (role, project color, wants_comment_notification_emails).", withId("membership_id")),
        delete: write(c, "DELETE", `${p}/memberships/{membership_id}`, "Remove a person from a project.", withId("membership_id"), false),
      },
      { title: "Memberships", description: "Project members and roles." },
    ),
    integrations: router(
      {
        list: read(c, `${p}/integrations`, "List integrations configured on a project.", pid),
        get: read(c, `${p}/integrations/{integration_id}`, "Retrieve one integration.", withId("integration_id")),
        delete: write(c, "DELETE", `${p}/integrations/{integration_id}`, "Delete an integration.", withId("integration_id"), false),
      },
      { title: "Integrations", description: "Project integrations (read and remove)." },
    ),
    webhooks: router(
      {
        list: read(c, `${p}/webhooks`, "List webhooks on a project.", pid),
        get: read(c, `${p}/webhooks/{webhook_id}`, "Retrieve one webhook.", withId("webhook_id")),
        create: write(c, "POST", `${p}/webhooks`, "Create a webhook. body: webhook_url (required), webhook_version (v5).", pid),
        update: write(c, "PUT", `${p}/webhooks/{webhook_id}`, "Update a webhook.", withId("webhook_id")),
        delete: write(c, "DELETE", `${p}/webhooks/{webhook_id}`, "Delete a webhook.", withId("webhook_id"), false),
      },
      { title: "Webhooks", description: "Project webhooks." },
    ),
    workspaces: router(
      {
        list: read(c, "/my/workspaces", "List the user's workspaces."),
        get: read(c, "/my/workspaces/{workspace_id}", "Retrieve one workspace.", ["workspace_id"]),
        create: write(c, "POST", "/my/workspaces", "Create a workspace. body: name (required), project_ids."),
        update: write(c, "PUT", "/my/workspaces/{workspace_id}", "Update a workspace.", ["workspace_id"]),
        delete: write(c, "DELETE", "/my/workspaces/{workspace_id}", "Delete a workspace.", ["workspace_id"], false),
      },
      { title: "Workspaces", description: "Personal workspaces grouping projects." },
    ),
    notifications: router(
      {
        list: read(c, "/my/notifications", "List the user's notifications."),
      },
      { title: "Notifications", description: "The user's notifications." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { pivotal: pivotal.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pivotal ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Pivotal Tracker",
        description:
          "Agile project management: projects, stories, epics, labels, tasks, comments, iterations, memberships and webhooks. Path ids are numbers; URL parameters go in query and request fields in body.",
        icons,
      },
    ),
  }),
);

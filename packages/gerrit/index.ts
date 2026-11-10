import {
  accountRouter,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  ProviderError,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Gerrit server has its own address (https://gerrit.example.com, or https://host/gerrit when served under a
// path). Credentials only ever go to the origin the account names, so the provider declares no static `hosts`.
function baseOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Gerrit server address, for example https://gerrit.example.com.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !loopback)
    throw new Error("The Gerrit server must be reached over https; plain http is accepted only for localhost.");
  if (url.search !== "" || url.hash !== "") throw new Error("Enter only the server address, with no query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

type Account = { fields: { host: string; username: string; password: string } };

const basicHeader = (account: Account) => `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`;

// Gerrit prefixes every JSON response with `)]}'` to defeat cross-site script inclusion.
function parseBody(text: string): unknown {
  const body = text.startsWith(")]}'") ? text.slice(4) : text;
  if (body.trim() === "") return { ok: true };
  try {
    return JSON.parse(body) as unknown;
  } catch {
    // Patches and file contents come back as base64 text.
    return { text: body.trim() };
  }
}

const gerrit = defineProvider({
  name: "Gerrit",
  auth: {
    // HTTP credentials: the username and the "HTTP password" generated under Settings > HTTP Credentials.
    httpPassword: secrets({
      label: "HTTP credentials",
      fields: object({
        host: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = baseOf(account.fields.host);
    const response = await fetch(`${base}/a/accounts/self`, {
      signal,
      headers: { Authorization: basicHeader(account as unknown as Account), Accept: "application/json" },
    });
    if (response.status === 401 || response.status === 403) throw new ProviderError({ reason: "unauthorized", status: response.status });
    if (!response.ok) throw new ProviderError({ reason: response.status >= 500 ? "unavailable" : "rejected", status: response.status });
    const me = parseBody(await response.text()) as { _account_id?: number; name?: string; username?: string; email?: string };
    if (typeof me._account_id !== "number") throw new Error("The server did not return a Gerrit account; check the server address.");
    const text = (value: unknown) => (typeof value === "string" && value !== "" ? value : undefined);
    return {
      accountInfo: {
        externalId: `${new URL(base).host}:${me._account_id}`,
        ...(text(me.name) === undefined ? {} : { displayName: text(me.name)! }),
        ...(text(me.username) === undefined ? {} : { username: text(me.username)! }),
        ...(text(me.email) === undefined ? {} : { email: text(me.email)! }),
      },
    };
  },
});

type Type = "string" | "number" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

// Gerrit's list endpoints page with n (limit) and S (skip); o adds optional fields to each entry.
const options = "options adds fields to each result (comma-separated, e.g. LABELS,CURRENT_REVISION,DETAILED_ACCOUNTS,MESSAGES).";
const pageNote = "n limits the number of results and S skips that many (start offset).";

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const changeId =
  "{id} is a change identifier: the numeric change number, project~number, or project~branch~Change-Id (URL-encode project and branch names that contain slashes; this tool does it for you).";
const rev = "{revision} is a revision: a commit SHA, a patch set number, or current (the default).";
const body = "body is the JSON request entity documented at https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html.";

const rows: Row[] = [
  // Changes
  ["changes", "query", "GET", "/changes/", `Search changes. q is a Gerrit search query such as "status:open project:foo owner:self"; give several q values separated by newlines for multiple queries. ${options} ${pageNote}`, [s("q"), n("n"), n("S"), s("options")]],
  ["changes", "get", "GET", "/changes/{id}", `Retrieve a change. ${changeId} ${options}`, [s("options")]],
  ["changes", "getDetail", "GET", "/changes/{id}/detail", `Retrieve a change with labels, reviewers and messages. ${changeId}`, [s("options")]],
  ["changes", "create", "POST", "/changes/", `Create a new change (project, branch and subject are required). ${body}`, [], true],
  ["changes", "setTopic", "PUT", "/changes/{id}/topic", `Set the topic of a change; body is {"topic": "..."}. ${changeId}`, [], true],
  ["changes", "deleteTopic", "DELETE", "/changes/{id}/topic", `Remove the topic of a change. ${changeId}`, []],
  ["changes", "setMessage", "PUT", "/changes/{id}/message", `Edit a change's commit message; body is {"message": "...", "notify": "NONE"}. ${changeId}`, [], true],
  ["changes", "abandon", "POST", "/changes/{id}/abandon", `Abandon a change; body may hold {"message": "..."}. ${changeId}`, [], true],
  ["changes", "restore", "POST", "/changes/{id}/restore", `Restore an abandoned change; body may hold {"message": "..."}. ${changeId}`, [], true],
  ["changes", "submit", "POST", "/changes/{id}/submit", `Submit (merge) a change. ${changeId}`, [], true],
  ["changes", "rebase", "POST", "/changes/{id}/rebase", `Rebase a change onto its target branch or onto body.base. ${changeId}`, [], true],
  ["changes", "revert", "POST", "/changes/{id}/revert", `Create a change that reverts this one; body may hold {"message": "..."}. ${changeId}`, [], true],
  ["changes", "move", "POST", "/changes/{id}/move", `Move a change to another branch; body is {"destination_branch": "..."}. ${changeId}`, [], true],
  ["changes", "markWorkInProgress", "POST", "/changes/{id}/wip", `Mark a change as work in progress; body may hold {"message": "..."}. ${changeId}`, [], true],
  ["changes", "markReady", "POST", "/changes/{id}/ready", `Mark a change as ready for review; body may hold {"message": "..."}. ${changeId}`, [], true],
  ["changes", "listMessages", "GET", "/changes/{id}/messages", `List the messages on a change. ${changeId}`, []],
  ["changes", "listComments", "GET", "/changes/{id}/comments", `List published comments on a change, keyed by file path. ${changeId}`, []],
  ["changes", "listDrafts", "GET", "/changes/{id}/drafts", `List the caller's draft comments on a change. ${changeId}`, []],
  ["changes", "listRobotComments", "GET", "/changes/{id}/robotcomments", `List robot comments on a change. ${changeId}`, []],
  ["changes", "listReviewers", "GET", "/changes/{id}/reviewers", `List the reviewers of a change. ${changeId}`, []],
  ["changes", "addReviewer", "POST", "/changes/{id}/reviewers", `Add a reviewer or CC; body is {"reviewer": "<account or group>", "state": "REVIEWER"|"CC"}. ${changeId}`, [], true],
  ["changes", "removeReviewer", "POST", "/changes/{id}/reviewers/{account}/delete", `Remove a reviewer from a change. {account} is an account id, username or email. ${changeId}`, [], true],
  ["changes", "suggestReviewers", "GET", "/changes/{id}/suggest_reviewers", `Suggest reviewers; q is the text to match. ${changeId}`, [s("q", true), n("n")]],
  ["changes", "listHashtags", "GET", "/changes/{id}/hashtags", `List the hashtags of a change. ${changeId}`, []],
  ["changes", "setHashtags", "POST", "/changes/{id}/hashtags", `Add or remove hashtags; body is {"add": [...], "remove": [...]}. ${changeId}`, [], true],
  ["changes", "listAttentionSet", "GET", "/changes/{id}/attention", `List the attention set of a change. ${changeId}`, []],
  ["changes", "addAttention", "POST", "/changes/{id}/attention", `Add a user to the attention set; body is {"user": "...", "reason": "..."}. ${changeId}`, [], true],
  ["changes", "removeAttention", "DELETE", "/changes/{id}/attention/{user}", `Remove a user from the attention set. ${changeId}`, [], true],
  ["changes", "listVotes", "GET", "/changes/{id}/reviewers/{account}/votes", `List a reviewer's votes on a change. ${changeId}`, []],
  ["changes", "deleteVote", "POST", "/changes/{id}/reviewers/{account}/votes/{label}/delete", `Delete one reviewer's vote on a label. ${changeId}`, [], true],
  ["changes", "getRelated", "GET", "/changes/{id}/revisions/{revision}/related", `List changes related to a revision (its stack). ${changeId} ${rev}`, []],
  ["changes", "getIncludedIn", "GET", "/changes/{id}/in", `List the branches and tags that include a merged change. ${changeId}`, []],
  ["changes", "checkChange", "GET", "/changes/{id}/check", `Run consistency checks on a change. ${changeId}`, []],
  ["changes", "star", "PUT", "/accounts/self/starred.changes/{id}", `Star a change for the caller. ${changeId}`, []],
  ["changes", "unstar", "DELETE", "/accounts/self/starred.changes/{id}", `Remove the caller's star from a change. ${changeId}`, []],
  ["changes", "delete", "DELETE", "/changes/{id}", `Permanently delete a change (requires the delete permission). ${changeId}`, []],

  // Revisions: reviews, files, diffs
  ["revisions", "setReview", "POST", "/changes/{id}/revisions/{revision}/review", `Post a review: vote on labels, leave a message and publish inline comments. Body is a ReviewInput, e.g. {"message": "...", "labels": {"Code-Review": 1}, "comments": {"path/File.java": [{"line": 3, "message": "..."}]}}. ${changeId} ${rev}`, [], true],
  ["revisions", "submit", "POST", "/changes/{id}/revisions/{revision}/submit", `Submit a revision. ${changeId} ${rev}`, [], true],
  ["revisions", "rebase", "POST", "/changes/{id}/revisions/{revision}/rebase", `Rebase a revision. ${changeId} ${rev}`, [], true],
  ["revisions", "cherryPick", "POST", "/changes/{id}/revisions/{revision}/cherrypick", `Cherry-pick a revision onto another branch; body is {"destination": "...", "message": "..."}. ${changeId} ${rev}`, [], true],
  ["revisions", "getCommit", "GET", "/changes/{id}/revisions/{revision}/commit", `Retrieve the commit of a revision. ${changeId} ${rev}`, []],
  ["revisions", "getDescription", "GET", "/changes/{id}/revisions/{revision}/description", `Retrieve the description of a patch set. ${changeId} ${rev}`, []],
  ["revisions", "listFiles", "GET", "/changes/{id}/revisions/{revision}/files", `List the files modified in a revision. ${changeId} ${rev} Set parent to compare against a parent commit, base to compare against another patch set, q to filter paths.`, [s("base"), n("parent"), s("q")]],
  ["revisions", "getFileContent", "GET", "/changes/{id}/revisions/{revision}/files/{file}/content", `Retrieve a file's content in a revision. The server answers base64; {file} is the file path. ${changeId} ${rev}`, []],
  ["revisions", "getFileDiff", "GET", "/changes/{id}/revisions/{revision}/files/{file}/diff", `Retrieve the diff of one file. Set base to compare to a patch set, intraline to true for word-level changes, whitespace to IGNORE_NONE, IGNORE_TRAILING, IGNORE_LEADING_AND_TRAILING or IGNORE_ALL. ${changeId} ${rev}`, [s("base"), n("parent"), s("whitespace"), s("intraline"), s("context")]],
  ["revisions", "getPatch", "GET", "/changes/{id}/revisions/{revision}/patch", `Retrieve the revision as a patch (base64 by default; set raw to true for plain text). ${changeId} ${rev}`, [s("raw"), s("path"), s("zip")]],
  ["revisions", "getMergeList", "GET", "/changes/{id}/revisions/{revision}/mergelist", `List the commits of a merge commit. ${changeId} ${rev}`, []],
  ["revisions", "listComments", "GET", "/changes/{id}/revisions/{revision}/comments", `List published comments on a revision. ${changeId} ${rev}`, []],
  ["revisions", "listDrafts", "GET", "/changes/{id}/revisions/{revision}/drafts", `List the caller's draft comments on a revision. ${changeId} ${rev}`, []],
  ["revisions", "createDraft", "PUT", "/changes/{id}/revisions/{revision}/drafts", `Create a draft comment; body is {"path": "...", "line": 1, "message": "...", "in_reply_to": "..."}. ${changeId} ${rev}`, [], true],
  ["revisions", "updateDraft", "PUT", "/changes/{id}/revisions/{revision}/drafts/{draft}", `Update a draft comment. ${changeId} ${rev}`, [], true],
  ["revisions", "deleteDraft", "DELETE", "/changes/{id}/revisions/{revision}/drafts/{draft}", `Delete a draft comment. ${changeId} ${rev}`, []],
  ["revisions", "getReview", "GET", "/changes/{id}/revisions/{revision}/review", `Retrieve a revision with its labels and reviewers. ${changeId} ${rev}`, []],
  ["revisions", "setReviewed", "PUT", "/changes/{id}/revisions/{revision}/files/{file}/reviewed", `Mark a file reviewed by the caller. ${changeId} ${rev}`, []],
  ["revisions", "listActions", "GET", "/changes/{id}/revisions/{revision}/actions", `List the actions the caller may take on a revision. ${changeId} ${rev}`, []],

  // Projects
  ["projects", "list", "GET", "/projects/", `List projects visible to the caller. Filter with query (a project query such as "name:foo"), r (regex), m (substring), p (prefix), type (CODE, PERMISSIONS, ALL), d (include description), t (tree), all, state (ACTIVE, READ_ONLY, HIDDEN). ${pageNote}`, [s("query"), s("r"), s("m"), s("p"), s("type"), s("d"), s("t"), s("all"), s("state"), n("n"), n("S")]],
  ["projects", "get", "GET", "/projects/{project}", "Retrieve a project.", []],
  ["projects", "create", "PUT", "/projects/{project}", `Create a project. Body holds options such as {"description": "...", "create_empty_commit": true, "parent": "All-Projects"}.`, [], true],
  ["projects", "getDescription", "GET", "/projects/{project}/description", "Retrieve a project's description.", []],
  ["projects", "setDescription", "PUT", "/projects/{project}/description", `Set a project's description; body is {"description": "...", "commit_message": "..."}.`, [], true],
  ["projects", "getConfig", "GET", "/projects/{project}/config", "Retrieve a project's configuration.", []],
  ["projects", "setConfig", "PUT", "/projects/{project}/config", `Update a project's configuration; body is a ConfigInput.`, [], true],
  ["projects", "getHead", "GET", "/projects/{project}/HEAD", "Retrieve a project's HEAD branch.", []],
  ["projects", "getAccess", "GET", "/projects/{project}/access", "Retrieve a project's access rights and capabilities for the caller.", []],
  ["projects", "listChildren", "GET", "/projects/{project}/children", "List a project's child projects (set recursive to true for all descendants).", [s("recursive")]],
  ["projects", "listBranches", "GET", "/projects/{project}/branches", `List a project's branches. Filter with r (regex) or m (substring). ${pageNote}`, [s("r"), s("m"), n("n"), n("S")]],
  ["projects", "getBranch", "GET", "/projects/{project}/branches/{branch}", "Retrieve a branch.", []],
  ["projects", "createBranch", "PUT", "/projects/{project}/branches/{branch}", `Create a branch; body is {"revision": "<branch or SHA>"}.`, [], true],
  ["projects", "deleteBranch", "DELETE", "/projects/{project}/branches/{branch}", "Delete a branch.", []],
  ["projects", "listTags", "GET", "/projects/{project}/tags", `List a project's tags. ${pageNote}`, [s("r"), s("m"), n("n"), n("S")]],
  ["projects", "getTag", "GET", "/projects/{project}/tags/{tag}", "Retrieve a tag.", []],
  ["projects", "createTag", "PUT", "/projects/{project}/tags/{tag}", `Create a tag; body is {"revision": "...", "message": "..."} (a message makes it annotated).`, [], true],
  ["projects", "deleteTag", "DELETE", "/projects/{project}/tags/{tag}", "Delete a tag.", []],
  ["projects", "getCommit", "GET", "/projects/{project}/commits/{commit}", "Retrieve a commit by SHA.", []],
  ["projects", "getCommitIncludedIn", "GET", "/projects/{project}/commits/{commit}/in", "List the branches and tags that include a commit.", []],
  ["projects", "getBranchFileContent", "GET", "/projects/{project}/branches/{branch}/files/{file}/content", "Retrieve a file's content on a branch (base64).", []],
  ["projects", "listDashboards", "GET", "/projects/{project}/dashboards", "List a project's dashboards.", []],
  ["projects", "listLabels", "GET", "/projects/{project}/labels", "List a project's review labels.", []],

  // Accounts
  ["accounts", "query", "GET", "/accounts/", `Search accounts. q is an account query such as "name:john" or "email:j@x.org". ${pageNote} Set options to DETAILS or ALL for more fields.`, [s("q", true), n("n"), n("S"), s("options")]],
  ["accounts", "get", "GET", "/accounts/{account}", "Retrieve an account. {account} is the numeric id, username, email or self.", []],
  ["accounts", "getSelf", "GET", "/accounts/self", "Retrieve the account of the credentials in use.", []],
  ["accounts", "getDetail", "GET", "/accounts/{account}/detail", "Retrieve an account with registration details.", []],
  ["accounts", "listEmails", "GET", "/accounts/{account}/emails", "List an account's email addresses.", []],
  ["accounts", "listGroups", "GET", "/accounts/{account}/groups", "List the groups an account belongs to.", []],
  ["accounts", "getCapabilities", "GET", "/accounts/{account}/capabilities", "List an account's global capabilities.", []],
  ["accounts", "getStatus", "GET", "/accounts/{account}/status", "Retrieve an account's status message.", []],
  ["accounts", "setStatus", "PUT", "/accounts/{account}/status", `Set the status; body is {"status": "..."}.`, [], true],
  ["accounts", "getAvatar", "GET", "/accounts/{account}/avatar.change.url", "Retrieve the avatar change URL.", []],
  ["accounts", "listStarredChanges", "GET", "/accounts/{account}/starred.changes", "List the changes an account starred.", []],
  ["accounts", "getPreferences", "GET", "/accounts/{account}/preferences", "Retrieve an account's preferences.", []],
  ["accounts", "listWatchedProjects", "GET", "/accounts/{account}/watched.projects", "List an account's project watches.", []],
  ["accounts", "listDrafts", "GET", "/accounts/{account}/drafts", "List an account's draft comments across changes.", []],
  ["accounts", "listDefaultStars", "GET", "/accounts/{account}/stars.changes", "List the changes an account starred with labels.", []],

  // Groups
  ["groups", "list", "GET", "/groups/", `List groups visible to the caller. Filter with query ("name:foo"), r (regex), m (substring), p (prefix), user (groups of a user), owned. ${pageNote}`, [s("query"), s("r"), s("m"), s("p"), s("user"), s("owned"), n("n"), n("S")]],
  ["groups", "get", "GET", "/groups/{group}", "Retrieve a group by UUID, id or name.", []],
  ["groups", "getDetail", "GET", "/groups/{group}/detail", "Retrieve a group with its members and included groups.", []],
  ["groups", "listMembers", "GET", "/groups/{group}/members/", "List a group's members.", []],
  ["groups", "addMember", "PUT", "/groups/{group}/members/{account}", "Add an account to an internal group.", []],
  ["groups", "removeMember", "DELETE", "/groups/{group}/members/{account}", "Remove an account from an internal group.", []],
  ["groups", "listSubgroups", "GET", "/groups/{group}/groups/", "List a group's included groups.", []],
  ["groups", "create", "PUT", "/groups/{name}", `Create an internal group; body is {"description": "...", "visible_to_all": false, "owner_id": "..."}.`, [], true],
  ["groups", "listAuditLog", "GET", "/groups/{group}/log.audit", "List a group's audit log.", []],

  // Server
  ["server", "getVersion", "GET", "/config/server/version", "Retrieve the Gerrit server version.", []],
  ["server", "getInfo", "GET", "/config/server/info", "Retrieve server configuration visible to clients: auth type, change settings, user and gerrit options.", []],
  ["server", "getCapabilities", "GET", "/config/server/capabilities", "List the global capabilities the server defines.", []],
  ["server", "getSummary", "GET", "/config/server/summary", "Retrieve server and JVM summary (requires the administrate-server capability).", []],
  ["server", "listTasks", "GET", "/config/server/tasks/", "List background tasks (requires the view-queue capability).", []],
  ["server", "listCaches", "GET", "/config/server/caches/", "List the server caches (requires the view-caches capability).", []],
  ["server", "listPlugins", "GET", "/plugins/", "List installed plugins (requires the administrate-server capability).", []],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .filter((name) => !extra.some(([known]) => known === name))
    .map((name) => [name, "string", name !== "revision", "path"]);
  const bodyField: Field[] = hasBody === true ? [["body", "json", false, "query"]] : [];
  return [...pathFields, ...extra, ...bodyField];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = baseOf(account.fields.host);
  const authorization = basicHeader(account);

  const call = async (method: string, path: string, fields: Field[], hasBody: boolean, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (where === "path") {
        const text = value === undefined || value === null ? (name === "revision" ? "current" : "") : String(value);
        target = target.replace(`{${name}}`, encodeURIComponent(text));
      } else if (name !== "body" && value !== undefined && value !== null) {
        if (name === "options") for (const option of String(value).split(",")) params.append("o", option.trim());
        else if (name === "q" && path === "/changes/") for (const q of String(value).split("\n")) params.append("q", q);
        else params.set(name, String(value));
      }
    }
    const hasPayload = hasBody && input.body !== undefined && input.body !== null;
    const response = await fetcher(`${base}/a${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(hasPayload ? { "Content-Type": "application/json; charset=UTF-8" } : {}),
      },
      body: hasPayload ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Gerrit answered ${response.status}: ${text.slice(0, 1000)}`);
    return parseBody(text);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, hasBody === true, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { gerrit: gerrit.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gerrit ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gerrit",
        description:
          "Gerrit Code Review: search and manage changes, post reviews and comments, manage reviewers, read files and diffs, and work with projects, branches, tags, accounts and groups.",
        instructions:
          "Searching uses Gerrit query syntax in changes.query q (for example status:open owner:self). A change id is a change number or project~number. Review votes and inline comments go through revisions.setReview. File contents and patches come back base64-encoded. Which tools work depends on the permissions of the account.",
        icons,
      },
    ),
  }),
);

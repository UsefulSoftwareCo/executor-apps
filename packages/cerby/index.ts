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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Cerby workspace lives on its own subdomain: https://<workspace>.cerby.com/api/v1.
const workspacePattern = /^[a-z0-9][a-z0-9-]*$/;

function origin(account: { fields: { workspace: string } }) {
  const workspace = account.fields.workspace
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.cerby\.com.*$/, "");
  if (!workspacePattern.test(workspace))
    throw new Error("Enter your Cerby workspace subdomain, for example my-workspace (from my-workspace.cerby.com).");
  return `https://${workspace}.cerby.com`;
}

const cerby = defineProvider({
  name: "Cerby",
  hosts: ["*.cerby.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        workspace: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Requires a key with the "Read accounts" and "Read items" scopes.
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const url = new URL(`${base}/api/v1/accounts`);
    url.searchParams.set("page[size]", "1");
    const response = await fetch(url.toString(), {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}/api/v1${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/api/v1/"))
      throw new Error("path must stay under /api/v1 on the workspace host");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "x-api-key": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204 || (method === "DELETE" && response.ok)) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Query = record(string());
const paging = { page: number().optional(), pageSize: number().optional() };
const Paged = object({ ...paging, query: Query.optional() });
const pagedParams = (i: { page?: number; pageSize?: number; query?: Record<string, string> }): Params => ({
  "page[number]": i.page,
  "page[size]": i.pageSize,
  ...(i.query ?? {}),
});
const pagingDoc = "page is 1-based (default 1); pageSize defaults to 20, maximum 100.";
const attrs = (attributes: unknown, extra: Record<string, unknown> = {}) => ({ data: { ...extra, attributes } });

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${pagingDoc}`, input: Paged }, (_c, i) => call("GET", path, pagedParams(i)));
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const children = (path: (i: string) => string, description: string) =>
    query({ description: `${description} ${pagingDoc}`, input: object({ id: id(), ...paging }) }, (_c, i) =>
      call("GET", path(i.id), pagedParams(i)),
    );
  const create = (path: string, description: string) =>
    mutation(
      { description: `${description} Pass the fields as attributes.`, input: object({ attributes: json() }) },
      (_c, { attributes }) => call("POST", path, {}, attrs(attributes)),
    );
  const update = (path: (i: string) => string, description: string) =>
    mutation(
      { description: `${description} Pass only the fields to change as attributes.`, input: object({ id: id(), attributes: json() }) },
      (_c, { id: i, attributes }) => call("PATCH", path(i), {}, attrs(attributes)),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const removeMember = (path: (i: string, m: string) => string, description: string, member: string) =>
    mutation({ description, input: object({ id: id(), [member]: id() }) }, (_c, i) =>
      call("DELETE", path(i.id, (i as Record<string, string>)[member]!)),
    );
  const share = (path: (i: string) => string, description: string, roles: string) =>
    mutation(
      {
        description: `${description} role is one of: ${roles}. message is an optional note.`,
        input: object({ id: id(), memberId: id(), role: string(), message: string().optional() }),
      },
      (_c, i) =>
        call("POST", path(i.id), {}, attrs({ role: i.role, ...(i.message ? { message: i.message } : {}) }, { id: i.memberId })),
    );
  const addItem = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id(), itemId: id() }) }, (_c, i) =>
      call("POST", path(i.id), {}, { data: { id: i.itemId } }),
    );

  const accounts = router(
    {
      list: query(
        {
          description: `List accounts you own. filterApplication is a comma-separated list of applications; filterStatus is enabled or disabled. ${pagingDoc}`,
          input: object({ ...paging, filterApplication: string().optional(), filterStatus: string().optional() }),
        },
        (_c, i) =>
          call("GET", "/accounts", {
            ...pagedParams(i),
            "filter[application]": i.filterApplication,
            "filter[status]": i.filterStatus,
          }),
      ),
      get: get((i) => `/accounts/${seg(i)}`, "Get an account by id."),
      update: update((i) => `/accounts/${seg(i)}`, "Update an account (username, label, email, phone, url, status, meta, ...)."),
      password: query(
        {
          description: "Retrieve an account's password. Only works for accounts stored in an AWS KMS vault.",
          input: object({ id: id() }),
        },
        (_c, { id: i }) => call("GET", `/accounts/${seg(i)}/secrets`, { "filter[secretType]": "password" }),
      ),
      totp: get((i) => `/accounts/${seg(i)}/totp-code`, "Retrieve an account's current and next TOTP codes."),
      users: children((i) => `/accounts/${seg(i)}/users`, "List users with access to an account."),
      shareWithUser: share(
        (i) => `/accounts/${seg(i)}/users`,
        "Share an account with a user (memberId is the user id).",
        "account_owner, account_manager, account_collaborator",
      ),
      shareWithTeam: share(
        (i) => `/accounts/${seg(i)}/teams`,
        "Share an account with a team (memberId is the team id).",
        "account_owner, account_manager, account_collaborator",
      ),
      removeUser: removeMember((i, u) => `/accounts/${seg(i)}/users/${seg(u)}`, "Remove a user's access to an account.", "userId"),
      removeTeam: removeMember((i, t) => `/accounts/${seg(i)}/teams/${seg(t)}`, "Remove a team's access to an account.", "teamId"),
    },
    { title: "Accounts", description: "Third-party accounts managed in Cerby." },
  );

  const secretMembers = (kind: "users" | "teams") =>
    mutation(
      {
        description: `Share a secret with a ${kind === "users" ? "user" : "team"} (memberId). role is secret_owner or secret_collaborator.`,
        input: object({ id: id(), memberId: id(), role: string(), message: string().optional() }),
      },
      (_c, i) =>
        call(
          "POST",
          `/secrets/${seg(i.id)}/members/${kind}`,
          {},
          {
            data: {
              id: i.memberId,
              type: kind,
              attributes: { role: i.role, ...(i.message ? { message: i.message } : {}) },
            },
          },
        ),
    );

  const secretsRouter = router(
    {
      list: list("/secrets", "List secrets (without bodies)."),
      get: get((i) => `/secrets/${seg(i)}`, "Get a secret including its body."),
      create: create(
        "/secrets",
        "Create a secret. Attributes: vaultId, title, requiresIdentityChallenge (bool), body {type: \"plaintext\", value}, category (\"text\"), optional expiresAt (ISO 8601).",
      ),
      users: query(
        { description: `List users a secret is shared with. ${pagingDoc}`, input: object({ id: id(), ...paging }) },
        (_c, i) => call("GET", `/secrets/${seg(i.id)}/members/users`, pagedParams(i)),
      ),
      teams: query(
        { description: `List teams a secret is shared with. ${pagingDoc}`, input: object({ id: id(), ...paging }) },
        (_c, i) => call("GET", `/secrets/${seg(i.id)}/members/teams`, pagedParams(i)),
      ),
      shareWithUser: secretMembers("users"),
      shareWithTeam: secretMembers("teams"),
      removeUser: removeMember((i, u) => `/secrets/${seg(i)}/members/users/${seg(u)}`, "Remove a user's access to a secret.", "userId"),
      removeTeam: removeMember((i, t) => `/secrets/${seg(i)}/members/teams/${seg(t)}`, "Remove a team's access to a secret.", "teamId"),
      delete: remove((i) => `/secrets/${seg(i)}`, "Delete a secret, revoking all sharing and deleting its attachments."),
    },
    { title: "Secrets", description: "Secrets stored in Cerby cloud vaults." },
  );

  const collections = router(
    {
      list: list("/collections", "List collections."),
      get: get((i) => `/collections/${seg(i)}`, "Get a collection by id."),
      accounts: children((i) => `/collections/${seg(i)}/accounts`, "List accounts in a collection."),
      secrets: children((i) => `/collections/${seg(i)}/secrets`, "List secrets in a collection."),
      subcollections: children((i) => `/collections/${seg(i)}/collections`, "List subcollections of a collection."),
      users: children((i) => `/collections/${seg(i)}/users`, "List users with access to a collection."),
      teams: children((i) => `/collections/${seg(i)}/teams`, "List teams with access to a collection."),
      create: create("/collections", "Create a collection. Attributes: name, optional parent_collection_id for a subcollection."),
      update: update((i) => `/collections/${seg(i)}`, "Rename a collection (attributes: name)."),
      addAccount: addItem((i) => `/collections/${seg(i)}/accounts`, "Add an account (itemId) to a collection."),
      addSecret: addItem((i) => `/collections/${seg(i)}/secrets`, "Add a secret (itemId) to a collection."),
      shareWithUser: share(
        (i) => `/collections/${seg(i)}/users`,
        "Share a collection with a user (memberId is the user id).",
        "collection_owner, collection_collaborator",
      ),
      shareWithTeam: share(
        (i) => `/collections/${seg(i)}/teams`,
        "Share a collection with a team (memberId is the team id).",
        "collection_owner, collection_collaborator",
      ),
      removeAccount: removeMember((i, a) => `/collections/${seg(i)}/accounts/${seg(a)}`, "Remove an account from a collection.", "accountId"),
      removeSecret: removeMember((i, s) => `/collections/${seg(i)}/secrets/${seg(s)}`, "Remove a secret from a collection.", "secretId"),
      removeUser: removeMember((i, u) => `/collections/${seg(i)}/users/${seg(u)}`, "Remove a user's access to a collection.", "userId"),
      removeTeam: removeMember((i, t) => `/collections/${seg(i)}/teams/${seg(t)}`, "Remove a team's access to a collection.", "teamId"),
      delete: remove((i) => `/collections/${seg(i)}`, "Delete a collection; its items stay in the workspace."),
    },
    { title: "Collections", description: "Collections group accounts and secrets for sharing." },
  );

  const users = router(
    {
      list: query(
        {
          description: `List users. filter matches full name or email; filterIsGuest limits to guests (true/false). ${pagingDoc}`,
          input: object({ ...paging, filter: string().optional(), filterIsGuest: string().optional() }),
        },
        (_c, i) => call("GET", "/users", { ...pagedParams(i), filter: i.filter, "filter[isGuest]": i.filterIsGuest }),
      ),
      get: get((i) => `/users/${seg(i)}`, "Get a user by id."),
      create: create("/users", "Add a user and send an invitation. Attributes: email, firstName, lastName, optional isGuest."),
      update: update((i) => `/users/${seg(i)}`, "Update a user (firstName, lastName, status live or disabled)."),
      delete: remove((i) => `/users/${seg(i)}`, "Delete a user."),
      accounts: children((i) => `/users/${seg(i)}/accounts`, "List accounts a user can access."),
      secrets: children((i) => `/users/${seg(i)}/secrets`, "List secrets a user can access."),
      collections: children((i) => `/users/${seg(i)}/collections`, "List collections a user can access."),
      teams: children((i) => `/users/${seg(i)}/teams`, "List teams a user belongs to."),
    },
    { title: "Users", description: "Workspace users. Needs the Admin, Super Admin or Owner role." },
  );

  const teams = router(
    {
      list: list("/teams", "List teams."),
      get: get((i) => `/teams/${seg(i)}`, "Get a team by id."),
      create: create("/teams", "Create a self-managed team (attributes: name)."),
      update: update((i) => `/teams/${seg(i)}`, "Rename a team (attributes: name)."),
      delete: remove((i) => `/teams/${seg(i)}`, "Delete a self-managed team."),
      accounts: children((i) => `/teams/${seg(i)}/accounts`, "List accounts shared with a team."),
      secrets: children((i) => `/teams/${seg(i)}/secrets`, "List secrets shared with a team."),
      collections: children((i) => `/teams/${seg(i)}/collections`, "List collections shared with a team."),
      members: children((i) => `/teams/${seg(i)}/members`, "List team members."),
      addMember: mutation(
        {
          description: "Add a user to a team. role is member or admin.",
          input: object({ id: id(), memberId: id(), role: string() }),
        },
        (_c, i) => call("POST", `/teams/${seg(i.id)}/members`, {}, attrs({ memberId: i.memberId, memberType: "user", role: i.role })),
      ),
      removeMember: removeMember((i, m) => `/teams/${seg(i)}/members/${seg(m)}`, "Remove a member from a team.", "memberId"),
      removeAccount: removeMember((i, a) => `/teams/${seg(i)}/accounts/${seg(a)}`, "Remove an account from a team.", "accountId"),
    },
    { title: "Teams", description: "User teams and their members." },
  );

  return router({
    accounts,
    secrets: secretsRouter,
    collections,
    users,
    teams,
    request: mutation(
      {
        description:
          "Call any Cerby v1 endpoint not covered by the other tools (integrations, assets, entitlements, jobs, vaults, remaining sharing endpoints). path starts with / and is relative to /api/v1, for example /vaults or /jobs/{id}. Body, if any, is sent as JSON, typically {\"data\": {\"attributes\": {...}}}. Query keys are passed as-is, for example {\"page[size]\": \"50\"}.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: Query.optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#"))
          throw new Error("path must start with / and stay under /api/v1");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { cerby: cerby.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cerby ?? [],
        (account) =>
          withApprovals(build(client(origin(account), account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cerby",
        description: "Accounts, secrets, collections, users, teams, integrations, jobs and vaults in a Cerby workspace.",
        icons,
        instructions:
          "Create and update tools take an attributes object that is wrapped as {data: {attributes}}. List tools take page (1-based) and pageSize (max 100). The request tool reaches endpoints without a dedicated tool, such as integrations, jobs and vaults. Keys only return items where the key's user is Owner.",
      },
    ),
  }),
);

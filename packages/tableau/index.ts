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

const tableau = defineProvider({
  name: "Tableau",
  // Tableau Cloud pods only. The token secret is a handle that Executor substitutes on requests to
  // these hosts; a Tableau Server (or any other) `server` value is refused with NetworkRefused
  // instead of receiving the secret.
  hosts: ["*.online.tableau.com"],
  auth: {
    personalAccessToken: secrets({
      label: "Personal access token",
      fields: object({
        server: plain(string({ minLength: 1 })),
        site: plain(string()),
        apiVersion: plain(string({ minLength: 1 })),
        tokenName: plain(string({ minLength: 1 })),
        tokenSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const session = await signIn(fetch, account.fields, signal);
    sessions.delete(sessionKey(account.fields));
    // A PAT allows one session; sign out so the health check does not leave a dangling one.
    await fetch(`${base(account.fields)}/auth/signout`, {
      method: "POST",
      ...(signal === undefined ? {} : { signal }),
      headers: { "x-tableau-auth": session.token },
    }).catch(() => undefined);
    return { accountInfo: { externalId: session.userId, displayName: session.siteContentUrl || "Default site" } };
  },
});

type Fields = {
  server: string;
  site: string;
  apiVersion: string;
  tokenName: string;
  tokenSecret: string;
};
type Fetch = typeof fetch;
type Session = { token: string; siteId: string; userId: string; siteContentUrl: string };

// A personal access token supports one session at a time, so concurrent tool calls share one
// sign-in; a 401 drops it and the call signs in again once.
const sessions = new Map<string, Promise<Session>>();
const sessionKey = (f: Fields) => `${f.server}|${f.site}|${f.tokenName}`;
const base = (f: Fields) => {
  const server = /^https?:\/\//i.test(f.server) ? f.server : `https://${f.server}`;
  return `${server.replace(/\/+$/, "")}/api/${f.apiVersion}`;
};

async function signIn(fetchFn: Fetch, f: Fields, signal: AbortSignal | undefined): Promise<Session> {
  const response = await fetchFn(`${base(f)}/auth/signin`, {
    method: "POST",
    ...(signal === undefined ? {} : { signal }),
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      credentials: {
        personalAccessTokenName: f.tokenName,
        personalAccessTokenSecret: f.tokenSecret,
        site: { contentUrl: f.site },
      },
    }),
  });
  const { credentials } = await decodeJson(
    response,
    object({
      credentials: object({
        token: string(),
        site: object({ id: string(), contentUrl: string() }),
        user: object({ id: string() }),
      }),
    }),
  );
  return {
    token: credentials.token,
    siteId: credentials.site.id,
    userId: credentials.user.id,
    siteContentUrl: credentials.site.contentUrl,
  };
}

type Options = {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  as?: "json" | "text" | "base64";
  // Use the server root (`/api/metadata/graphql`) instead of the versioned REST base.
  root?: boolean;
};

function client(f: Fields, fetchFn: Fetch, signal: AbortSignal | undefined) {
  const session = () => {
    const key = sessionKey(f);
    let existing = sessions.get(key);
    if (existing === undefined) {
      existing = signIn(fetchFn, f, signal);
      sessions.set(key, existing);
      existing.catch(() => sessions.delete(key));
    }
    return existing;
  };
  // `{site}` in a path becomes the signed-in site's id; `{user}` the signed-in user's id.
  const call = async (method: string, path: string, options: Options = {}, retry = true): Promise<unknown> => {
    const s = await session();
    const url = new URL(
      `${options.root === true ? base(f).replace(/\/api\/[^/]+$/, "/api") : base(f)}${path.replace("{site}", encodeURIComponent(s.siteId)).replace("{user}", encodeURIComponent(s.userId))}`,
    );
    for (const [key, value] of Object.entries(options.query ?? {}))
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    const response = await fetchFn(url.toString(), {
      method,
      ...(signal === undefined ? {} : { signal }),
      headers: {
        "x-tableau-auth": s.token,
        accept: options.as === undefined || options.as === "json" ? "application/json" : "*/*",
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 401 && retry) {
      sessions.delete(sessionKey(f));
      return call(method, path, options, false);
    }
    if (!response.ok) {
      let detail = "";
      try {
        const e = (await response.json()) as { error?: { summary?: string; detail?: string; code?: string } };
        detail = [e.error?.code, e.error?.summary, e.error?.detail].filter(Boolean).join(": ");
      } catch {}
      throw new Error(`Tableau ${method} ${path} failed with ${response.status}${detail === "" ? "" : ` (${detail})`}`);
    }
    if (response.status === 204) return null;
    if (options.as === "text") return response.text();
    if (options.as === "base64") {
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      return { base64: btoa(binary), contentType: response.headers.get("content-type") ?? "application/octet-stream" };
    }
    const text = await response.text();
    return text === "" ? null : JSON.parse(text);
  };
  return call;
}

const Id = string({ minLength: 1 });
const List = {
  pageSize: number().optional(),
  pageNumber: number().optional(),
  filter: string().optional(),
  sort: string().optional(),
  fields: string().optional(),
};
const listQuery = (i: { pageSize?: number; pageNumber?: number; filter?: string; sort?: string; fields?: string }) => ({
  pageSize: i.pageSize,
  pageNumber: i.pageNumber,
  filter: i.filter,
  sort: i.sort,
  fields: i.fields,
});
const listDoc =
  " Supports pageSize (max 1000), pageNumber, filter (for example name:eq:Sales or updatedAt:gte:2025-01-01T00:00:00Z), sort (for example name:asc) and fields (for example _all_).";

function tools(f: Fields, fetchFn: Fetch, signal: AbortSignal | undefined) {
  const call = client(f, fetchFn, signal);

  const list = (what: string, path: string) =>
    query({ description: `List ${what} on the site.${listDoc}`, input: object(List) }, async (_c, i) =>
      call("GET", path, { query: listQuery(i) }),
    );
  const get = (what: string, path: string) =>
    query({ description: `Get one ${what} by id.`, input: object({ id: Id }) }, async (_c, { id }) =>
      call("GET", `${path}/${encodeURIComponent(id)}`),
    );
  const del = (what: string, path: string) =>
    mutation(
      { description: `Delete a ${what} by id.`, input: object({ id: Id }), approval: always() },
      async (_c, { id }) => call("DELETE", `${path}/${encodeURIComponent(id)}`),
    );
  const sub = (what: string, path: string, suffix: string) =>
    query({ description: `List ${what}.${listDoc}`, input: object({ id: Id, ...List }) }, async (_c, i) =>
      call("GET", `${path}/${encodeURIComponent(i.id)}/${suffix}`, { query: listQuery(i) }),
    );
  const permissions = (what: string, path: string) =>
    query({ description: `Get the permissions set on a ${what}.`, input: object({ id: Id }) }, async (_c, { id }) =>
      call("GET", `${path}/${encodeURIComponent(id)}/permissions`),
    );
  const refresh = (what: string, path: string) =>
    mutation(
      { description: `Queue an extract refresh for a ${what}. Returns the job to follow with jobs.get.`, input: object({ id: Id }), approval: always() },
      async (_c, { id }) => call("POST", `${path}/${encodeURIComponent(id)}/refresh`, { body: {} }),
    );
  const addTags = (what: string, path: string) =>
    mutation(
      { description: `Add tags to a ${what}.`, input: object({ id: Id, tags: array(string()) }), approval: always() },
      async (_c, { id, tags }) =>
        call("PUT", `${path}/${encodeURIComponent(id)}/tags`, { body: { tags: { tag: tags.map((label) => ({ label })) } } }),
    );
  const removeTag = (what: string, path: string) =>
    mutation(
      { description: `Remove one tag from a ${what}.`, input: object({ id: Id, tag: Id }), approval: always() },
      async (_c, { id, tag }) => call("DELETE", `${path}/${encodeURIComponent(id)}/tags/${encodeURIComponent(tag)}`),
    );

  const W = "/sites/{site}/workbooks";
  const D = "/sites/{site}/datasources";
  const P = "/sites/{site}/projects";
  const V = "/sites/{site}/views";
  const U = "/sites/{site}/users";
  const G = "/sites/{site}/groups";
  const F = "/sites/{site}/flows";

  return router({
    sites: router(
      {
        list: query({ description: "List the sites the signed-in user belongs to.", input: object({ pageSize: number().optional(), pageNumber: number().optional() }) }, async (_c, i) =>
          call("GET", "/sites", { query: { pageSize: i.pageSize, pageNumber: i.pageNumber } }),
        ),
        current: query({ description: "Get the site the account signed in to, including usage settings.", input: object({}) }, async () =>
          call("GET", "/sites/{site}", { query: { includeUsage: true } }),
        ),
        serverInfo: query({ description: "Get the product version and REST API version of the server.", input: object({}) }, async () =>
          call("GET", "/serverinfo"),
        ),
      },
      { title: "Sites", description: "Sites and server information." },
    ),
    workbooks: router(
      {
        list: list("workbooks", W),
        get: get("workbook", W),
        views: sub("views of a workbook", W, "views"),
        connections: sub("data connections of a workbook", W, "connections"),
        revisions: sub("revisions of a workbook", W, "revisions"),
        permissions: permissions("workbook", W),
        refresh: refresh("workbook", W),
        addTags: addTags("workbook", W),
        removeTag: removeTag("workbook", W),
        update: mutation(
          {
            description: "Update a workbook: rename it, show or hide tabs, or move it to another project.",
            input: object({ id: Id, name: string().optional(), showTabs: boolean().optional(), projectId: string().optional(), ownerId: string().optional() }),
            approval: always(),
          },
          async (_c, { id, name, showTabs, projectId, ownerId }) =>
            call("PUT", `${W}/${encodeURIComponent(id)}`, {
              body: {
                workbook: {
                  ...(name === undefined ? {} : { name }),
                  ...(showTabs === undefined ? {} : { showTabs }),
                  ...(projectId === undefined ? {} : { project: { id: projectId } }),
                  ...(ownerId === undefined ? {} : { owner: { id: ownerId } }),
                },
              },
            }),
        ),
        delete: del("workbook", W),
      },
      { title: "Workbooks", description: "Workbooks, their views, connections, revisions, tags and refreshes." },
    ),
    views: router(
      {
        list: list("views", V),
        get: get("view", V),
        data: query(
          { description: "Download a view's underlying data as CSV text. Supports Tableau view filters, for example { 'vf_Region': 'West' }.", input: object({ id: Id, maxAge: number().optional(), filters: record(string()).optional() }) },
          async (_c, { id, maxAge, filters }) =>
            call("GET", `${V}/${encodeURIComponent(id)}/data`, { as: "text", query: { ...(filters ?? {}), maxAge } }),
        ),
        image: query(
          { description: "Render a view as a PNG. Returns { base64, contentType }.", input: object({ id: Id, resolution: string().optional(), maxAge: number().optional() }) },
          async (_c, { id, resolution, maxAge }) =>
            call("GET", `${V}/${encodeURIComponent(id)}/image`, { as: "base64", query: { resolution, maxAge } }),
        ),
        pdf: query(
          { description: "Render a view as a PDF. Returns { base64, contentType }.", input: object({ id: Id, type: string().optional(), orientation: string().optional(), maxAge: number().optional() }) },
          async (_c, { id, type, orientation, maxAge }) =>
            call("GET", `${V}/${encodeURIComponent(id)}/pdf`, { as: "base64", query: { type, orientation, maxAge } }),
        ),
        permissions: permissions("view", V),
        addTags: addTags("view", V),
        removeTag: removeTag("view", V),
      },
      { title: "Views", description: "Views (sheets and dashboards) with data, image and PDF export." },
    ),
    datasources: router(
      {
        list: list("data sources", D),
        get: get("data source", D),
        connections: sub("connections of a data source", D, "connections"),
        revisions: sub("revisions of a data source", D, "revisions"),
        permissions: permissions("data source", D),
        refresh: refresh("data source", D),
        addTags: addTags("data source", D),
        removeTag: removeTag("data source", D),
        update: mutation(
          {
            description: "Update a data source: rename it, certify it, or move it to another project.",
            input: object({ id: Id, name: string().optional(), isCertified: boolean().optional(), certificationNote: string().optional(), projectId: string().optional(), ownerId: string().optional() }),
            approval: always(),
          },
          async (_c, { id, name, isCertified, certificationNote, projectId, ownerId }) =>
            call("PUT", `${D}/${encodeURIComponent(id)}`, {
              body: {
                datasource: {
                  ...(name === undefined ? {} : { name }),
                  ...(isCertified === undefined ? {} : { isCertified }),
                  ...(certificationNote === undefined ? {} : { certificationNote }),
                  ...(projectId === undefined ? {} : { project: { id: projectId } }),
                  ...(ownerId === undefined ? {} : { owner: { id: ownerId } }),
                },
              },
            }),
        ),
        delete: del("data source", D),
      },
      { title: "Data sources", description: "Published data sources, connections, revisions, tags and refreshes." },
    ),
    flows: router(
      {
        list: list("Prep flows", F),
        get: get("Prep flow", F),
        connections: sub("connections of a flow", F, "connections"),
        permissions: permissions("flow", F),
        delete: del("flow", F),
      },
      { title: "Flows", description: "Tableau Prep flows." },
    ),
    projects: router(
      {
        list: list("projects", P),
        permissions: permissions("project", P),
        create: mutation(
          {
            description: "Create a project, optionally inside a parent project.",
            input: object({ name: Id, description: string().optional(), parentProjectId: string().optional(), contentPermissions: string().optional() }),
            approval: always(),
          },
          async (_c, { name, description, parentProjectId, contentPermissions }) =>
            call("POST", P, {
              body: {
                project: {
                  name,
                  ...(description === undefined ? {} : { description }),
                  ...(parentProjectId === undefined ? {} : { parentProjectId }),
                  ...(contentPermissions === undefined ? {} : { contentPermissions }),
                },
              },
            }),
        ),
        update: mutation(
          {
            description: "Rename or change a project's description or content permissions mode.",
            input: object({ id: Id, name: string().optional(), description: string().optional(), contentPermissions: string().optional(), parentProjectId: string().optional() }),
            approval: always(),
          },
          async (_c, { id, name, description, contentPermissions, parentProjectId }) =>
            call("PUT", `${P}/${encodeURIComponent(id)}`, {
              body: {
                project: {
                  ...(name === undefined ? {} : { name }),
                  ...(description === undefined ? {} : { description }),
                  ...(contentPermissions === undefined ? {} : { contentPermissions }),
                  ...(parentProjectId === undefined ? {} : { parentProjectId }),
                },
              },
            }),
        ),
        delete: del("project", P),
      },
      { title: "Projects", description: "Projects that organize content." },
    ),
    users: router(
      {
        list: list("users", U),
        get: get("user", U),
        workbooks: sub("workbooks owned by a user", U, "workbooks"),
        favorites: query({ description: "List a user's favorites (defaults to the signed-in user).", input: object({ userId: string().optional() }) }, async (_c, { userId }) =>
          call("GET", `/sites/{site}/favorites/${userId === undefined ? "{user}" : encodeURIComponent(userId)}`),
        ),
        add: mutation(
          {
            description: "Add a user to the site. siteRole is for example Viewer, Explorer, Creator, SiteAdministratorCreator.",
            input: object({ name: Id, siteRole: Id, authSetting: string().optional() }),
            approval: always(),
          },
          async (_c, { name, siteRole, authSetting }) =>
            call("POST", U, { body: { user: { name, siteRole, ...(authSetting === undefined ? {} : { authSetting }) } } }),
        ),
        update: mutation(
          {
            description: "Change a user's site role, full name, email or auth setting.",
            input: object({ id: Id, siteRole: string().optional(), fullName: string().optional(), email: string().optional(), authSetting: string().optional() }),
            approval: always(),
          },
          async (_c, { id, siteRole, fullName, email, authSetting }) =>
            call("PUT", `${U}/${encodeURIComponent(id)}`, {
              body: {
                user: {
                  ...(siteRole === undefined ? {} : { siteRole }),
                  ...(fullName === undefined ? {} : { fullName }),
                  ...(email === undefined ? {} : { email }),
                  ...(authSetting === undefined ? {} : { authSetting }),
                },
              },
            }),
        ),
        remove: del("user (removes them from the site)", U),
      },
      { title: "Users", description: "Site users and their favorites." },
    ),
    groups: router(
      {
        list: list("groups", G),
        members: sub("users in a group", G, "users"),
        create: mutation(
          { description: "Create a local group.", input: object({ name: Id, minimumSiteRole: string().optional() }), approval: always() },
          async (_c, { name, minimumSiteRole }) =>
            call("POST", G, { body: { group: { name, ...(minimumSiteRole === undefined ? {} : { minimumSiteRole }) } } }),
        ),
        addUser: mutation(
          { description: "Add a user to a group.", input: object({ groupId: Id, userId: Id }), approval: always() },
          async (_c, { groupId, userId }) =>
            call("POST", `${G}/${encodeURIComponent(groupId)}/users`, { body: { user: { id: userId } } }),
        ),
        removeUser: mutation(
          { description: "Remove a user from a group.", input: object({ groupId: Id, userId: Id }), approval: always() },
          async (_c, { groupId, userId }) =>
            call("DELETE", `${G}/${encodeURIComponent(groupId)}/users/${encodeURIComponent(userId)}`),
        ),
        delete: del("group", G),
      },
      { title: "Groups", description: "Groups and their members." },
    ),
    jobs: router(
      {
        list: list("background jobs", "/sites/{site}/jobs"),
        get: get("background job", "/sites/{site}/jobs"),
        cancel: mutation(
          { description: "Cancel a pending or running background job. Requires a site or server administrator.", input: object({ id: Id }), approval: always() },
          async (_c, { id }) => call("PUT", `/sites/{site}/jobs/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Jobs", description: "Background jobs such as extract refreshes." },
    ),
    schedules: router(
      {
        list: query({ description: "List server schedules." + listDoc, input: object(List) }, async (_c, i) =>
          call("GET", "/schedules", { query: listQuery(i) }),
        ),
        subscriptions: list("subscriptions", "/sites/{site}/subscriptions"),
        extractRefreshTasks: list("extract refresh tasks", "/sites/{site}/tasks/extractRefreshes"),
      },
      { title: "Schedules", description: "Schedules, subscriptions and extract refresh tasks." },
    ),
    metadata: query(
      {
        description:
          "Run a read-only query against the Tableau Metadata API (GraphQL) to explore workbooks, data sources, fields, lineage and databases. Pass variables as an object.",
        input: object({ query: Id, variables: record(json()).optional() }),
      },
      async (_c, { query: q, variables }) =>
        call("POST", "/metadata/graphql", { body: { query: q, ...(variables === undefined ? {} : { variables }) }, root: true }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { tableau: tableau.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.tableau ?? [], (account) => tools(account.fields, fetch, signal), { signal }),
      {
        title: "Tableau",
        description:
          "Workbooks, views, data sources, projects, users, groups, flows and jobs on Tableau Cloud, plus the Metadata API.",
        icons,
      },
    ),
  }),
);

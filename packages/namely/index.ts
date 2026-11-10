import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

// Namely is hosted per customer at https://<company>.namely.com, so the company name is part of the account.
// Every request is built from the validated single-label subdomain below.
function apiBase(raw: string): string {
  const text = raw.trim().toLowerCase();
  const name = text.replace(/^https?:\/\//, "").replace(/\.namely\.com(\/.*)?$/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("Enter your Namely company name, the part before .namely.com (for example acme or acme-sandbox).");
  }
  return `https://${name}.namely.com/api/v1`;
}

const namely = defineProvider({
  name: "Namely",
  hosts: ["*.namely.com"],
  auth: {
    // Namely OAuth applications use endpoints on each customer's own subdomain, which a provider cannot
    // template, so the connection uses a Personal Access Token created in Namely's API menu.
    token: secrets({
      label: "Personal access token",
      fields: object({ company: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${apiBase(account.fields.company)}/profiles/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(company: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = apiBase(company);
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
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
        Accept: "application/json",
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

// Tools take path ids by name, an optional `query` object for filters and paging (for example
// {"filter[user_status]": "active", page: 1, per_page: 50}) and, for writes, a JSON `body`.
function read(call: Call, path: string, description: string, ids: readonly string[] = [], hasQuery = true) {
  return query(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        ...(hasQuery ? { query: filters } : {}),
      }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody = true) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        ...(hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) => call(method, fill(path, ids, input), {}, hasBody ? (input.body as Params) : undefined),
  );
}

function fill(path: string, ids: readonly string[], input: Params): string {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function build(call: Call) {
  return router({
    company: router({
      info: read(call, "/companies/info", "Company name, settings and metadata for this Namely site.", [], false),
    }),
    profiles: router({
      me: read(call, "/profiles/me", "Profile of the user who owns the access token.", [], false),
      list: read(
        call,
        "/profiles",
        "List employee profiles (active and inactive). Always paginate: query accepts page, per_page (max 50, default 30), sort, profile_format and filters such as filter[user_status], filter[email], filter[first_name], filter[last_name], filter[job_title], filter[reports_to].",
      ),
      get: read(call, "/profiles/{id}", "Retrieve one employee profile.", ["id"], false),
      create: write(call, "POST", "/profiles", "Create an employee profile. body is { profiles: [ { first_name, last_name, email, ... } ] } as in the Namely API reference."),
      update: write(call, "PUT", "/profiles/{id}", "Update an employee profile. body is { profiles: [ { ...fields to change } ] }.", ["id"]),
      notifications: read(call, "/profiles/{id}/notifications", "Notifications for one profile. query accepts page and per_page.", ["id"]),
    }),
    profileFields: router({
      list: read(call, "/profiles/fields", "List all profile fields, including custom fields.", [], false),
      get: read(call, "/profiles/fields/{id}", "Retrieve one profile field.", ["id"], false),
      create: write(call, "POST", "/profiles/fields", "Create a custom profile field."),
      update: write(call, "PUT", "/profiles/fields/{id}", "Update a profile field.", ["id"]),
      sections: router({
        list: read(call, "/profiles/fields/sections", "List profile field sections.", [], false),
        get: read(call, "/profiles/fields/sections/{id}", "Retrieve one profile field section.", ["id"], false),
        update: write(call, "PUT", "/profiles/fields/sections/{id}", "Update a profile field section.", ["id"]),
      }),
    }),
    groups: router({
      list: read(call, "/groups", "List all groups.", [], false),
      get: read(call, "/groups/{id}", "Retrieve one group.", ["id"], false),
      types: read(call, "/group_types", "List all group types.", [], false),
      type: read(call, "/group_types/{id}", "Retrieve one group type.", ["id"], false),
      inType: read(call, "/group_types/{id}/groups", "List the groups of a group type.", ["id"], false),
    }),
    teams: router({
      list: read(call, "/teams", "List all teams.", [], false),
      get: read(call, "/teams/{id}", "Retrieve one team.", ["id"], false),
    }),
    jobTitles: router({
      list: read(call, "/job_titles", "List all job titles.", [], false),
      get: read(call, "/job_titles/{id}", "Retrieve one job title.", ["id"], false),
      create: write(call, "POST", "/job_titles", "Create a job title."),
      update: write(call, "PUT", "/job_titles/{id}", "Update a job title.", ["id"]),
    }),
    jobTiers: router({
      list: read(call, "/job_tiers", "List all job tiers.", [], false),
      get: read(call, "/job_tiers/{id}", "Retrieve one job tier.", ["id"], false),
      create: write(call, "POST", "/job_tiers", "Create a job tier."),
      update: write(call, "PUT", "/job_tiers/{id}", "Update a job tier.", ["id"]),
    }),
    countries: router({
      list: read(call, "/countries", "List all countries Namely supports.", [], false),
      get: read(call, "/countries/{id}", "Retrieve one country.", ["id"], false),
    }),
    resources: router({
      list: read(call, "/resources", "List company resources that are not in a folder.", [], false),
      get: read(call, "/resources/{id}", "Retrieve one company resource.", ["id"], false),
      folders: read(call, "/folders", "List all resource folders.", [], false),
      inFolder: read(call, "/folders/{id}/resources", "List the resources in a folder.", ["id"], false),
      createFolder: write(call, "POST", "/folders", "Create a resource folder."),
      updateFolder: write(call, "PUT", "/folders/{id}", "Update a resource folder.", ["id"]),
      deleteFolder: write(call, "DELETE", "/folders/{id}", "Delete a resource folder.", ["id"], false),
      deleteResource: write(call, "DELETE", "/folders/{id}/resources", "Delete a resource from a folder.", ["id"], false),
    }),
    events: router({
      list: read(call, "/events", "List home feed events. query accepts limit, after, filter[type], profile_id and order.", []),
      get: read(call, "/events/{id}", "Retrieve one home feed event.", ["id"], false),
      createAnnouncement: write(call, "POST", "/events", "Post an announcement to the home feed."),
      deleteAnnouncement: write(call, "DELETE", "/events/{id}", "Delete an announcement.", ["id"], false),
      comments: read(call, "/events/{id}/comments", "List the comments on an event.", ["id"], false),
      createComment: write(call, "POST", "/events/{id}/comments", "Comment on an event.", ["id"]),
      deleteComment: write(call, "DELETE", "/events/{id}/comments/{commentId}", "Delete a comment from an event.", ["id", "commentId"], false),
      likes: read(call, "/likes/event/{id}/recent", "List recent likes on an event.", ["id"], false),
      like: write(call, "POST", "/likes/event/{id}", "Like an event.", ["id"], false),
      unlike: write(call, "DELETE", "/likes/event/{id}", "Remove your like from an event.", ["id"], false),
      commentLikes: read(call, "/likes/event_comment/{id}/recent", "List recent likes on an event comment.", ["id"], false),
      likeComment: write(call, "POST", "/likes/event_comment/{id}", "Like an event comment.", ["id"], false),
      unlikeComment: write(call, "DELETE", "/likes/event_comment/{id}", "Remove your like from an event comment.", ["id"], false),
    }),
    notifications: read(call, "/notifications", "List notifications for the token's user.", []),
    reports: router({
      get: read(call, "/reports/{id}", "Run and retrieve a saved Namely report.", ["id"], false),
    }),
  });
}

export default defineApp(
  { user: { accounts: { namely: namely.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.namely ?? [],
        (account) =>
          withApprovals(build(client(account.fields.company, account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Namely",
        description:
          "Namely HR: employee profiles and custom fields, groups, teams, job titles and tiers, company resources, announcements, comments, likes, notifications and reports.",
        icons,
      },
    ),
  }),
);

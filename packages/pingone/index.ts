import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  number,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Regional domains: https://developer.pingidentity.com/pingone-api/foundations/conventions/pingone-api-requests.html
const tlds = ["com", "ca", "eu", "com.au", "sg", "asia"] as const;

async function fetchToken(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  const url = `https://auth.pingone.${tld(fields.region)}/${encodeURIComponent(fields.environmentId)}/as/token`;
  const form = "application/x-www-form-urlencoded";
  const schema = object({ access_token: string() });
  // Worker apps default to client_secret_basic; fall back to client_secret_post when the app is configured for it.
  const basic = await fetcher(url, {
    method: "POST",
    signal,
    headers: { Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`, "content-type": form },
    body: "grant_type=client_credentials",
  });
  if (basic.status !== 400 && basic.status !== 401) return (await decodeJson(basic, schema)).access_token;
  const post = await fetcher(url, {
    method: "POST",
    signal,
    headers: { "content-type": form },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: fields.clientId, client_secret: fields.clientSecret }).toString(),
  });
  return (await decodeJson(post, schema)).access_token;
}

type Fields = { environmentId: string; region: string; clientId: string; clientSecret: string };

function tld(region: string): string {
  const value = region.trim().toLowerCase().replace(/^\./, "");
  if (!(tlds as readonly string[]).includes(value))
    throw new Error(`Unknown PingOne region "${region}". Use one of: ${tlds.join(", ")}.`);
  return value;
}

const pingone = defineProvider({
  name: "PingOne",
  hosts: tlds.flatMap((t) => [`api.pingone.${t}`, `auth.pingone.${t}`]),
  auth: {
    worker: secrets({
      label: "Worker application (client credentials)",
      fields: object({
        environmentId: plain(string({ minLength: 1 })),
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields as Fields;
    const t = tld(fields.region);
    const accessToken = await fetchToken(fields, fetch, signal);
    const response = await fetch(`https://api.pingone.${t}/v1/environments/${fields.environmentId}`, {
      signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const env = await decodeJson(response, object({ id: string(), name: string() }));
    return { accountInfo: { externalId: env.id, displayName: env.name } };
  },
});

const Page = {
  limit: number().optional(),
  filter: string().optional(),
  next: string().optional(),
};
const pageNote =
  " filter is a SCIM filter, for example 'username sw \"jo\"'. If the response _links.next.href is present, pass it as next to get the following page.";

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const t = tld(fields.region);
  const api = `https://api.pingone.${t}`;
  let token: Promise<string> | undefined;
  const bearer = () => (token ??= fetchToken(fields, fetcher, signal));

  const call = async (method: string, path: string, body?: unknown, contentType = "application/json") => {
    const explicitType = contentType !== "application/json";
    const response = await fetcher(`${api}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        accept: "application/json",
        ...(body === undefined && !explicitType ? {} : { "content-type": contentType }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const env = (id: string | undefined) => `/v1/environments/${encodeURIComponent(id ?? fields.environmentId)}`;
  const list = (path: (e: string) => string) => async (_ctx: unknown, input: { environmentId?: string; limit?: number; filter?: string; next?: string }) => {
    if (input.next) {
      const url = new URL(input.next, api);
      if (url.origin !== api) throw new Error("next must be a PingOne API link from _links.next.href.");
      return call("GET", url.pathname + url.search);
    }
    const q = new URLSearchParams();
    if (input.limit !== undefined) q.set("limit", String(input.limit));
    if (input.filter) q.set("filter", input.filter);
    const qs = q.toString();
    return call("GET", `${path(env(input.environmentId))}${qs ? `?${qs}` : ""}`);
  };

  const E = { environmentId: string().optional() };
  const scope = " environmentId defaults to the environment the worker app signs in to.";
  const ListInput = object({ ...E, ...Page });
  const body = json();

  const crud = (name: string, plural: string, label: string) => ({
    list: query({ description: `List ${label}.${pageNote}${scope}`, input: ListInput }, list((e) => `${e}/${plural}`)),
    get: query(
      { description: `Get a ${name} by ID.${scope}`, input: object({ ...E, id: string() }) },
      async (_c, i) => call("GET", `${env(i.environmentId)}/${plural}/${encodeURIComponent(i.id)}`),
    ),
    create: mutation(
      { description: `Create a ${name}. body is the PingOne ${name} JSON.${scope}`, input: object({ ...E, body }), approval: always() },
      async (_c, i) => call("POST", `${env(i.environmentId)}/${plural}`, i.body),
    ),
    update: mutation(
      { description: `Patch or replace a ${name}: PUT replaces the whole resource, so send every attribute.${scope}`, input: object({ ...E, id: string(), body }), approval: always() },
      async (_c, i) => call("PUT", `${env(i.environmentId)}/${plural}/${encodeURIComponent(i.id)}`, i.body),
    ),
    delete: mutation(
      { description: `Delete a ${name}.${scope}`, input: object({ ...E, id: string() }), approval: always() },
      async (_c, i) => call("DELETE", `${env(i.environmentId)}/${plural}/${encodeURIComponent(i.id)}`),
    ),
  });

  const users = crud("user", "users", "users");
  const userId = object({ ...E, userId: string() });
  const userPath = (i: { environmentId?: string; userId: string }) => `${env(i.environmentId)}/users/${encodeURIComponent(i.userId)}`;

  return router(
    {
      environments: router({
        list: query({ description: `List environments the worker app can see.${pageNote}`, input: object(Page) }, async (_c, i) => {
          if (i.next) {
            const url = new URL(i.next, api);
            if (url.origin !== api) throw new Error("next must be a PingOne API link from _links.next.href.");
            return call("GET", url.pathname + url.search);
          }
          const q = new URLSearchParams();
          if (i.limit !== undefined) q.set("limit", String(i.limit));
          if (i.filter) q.set("filter", i.filter);
          return call("GET", `/v1/environments${q.size ? `?${q}` : ""}`);
        }),
        get: query({ description: `Get an environment.${scope}`, input: object(E) }, async (_c, i) => call("GET", env(i.environmentId))),
        licenses: query({ description: `List the licenses that apply to an environment.${scope}`, input: object(E) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/licenses`),
        ),
      }),
      users: router({
        ...users,
        update: mutation(
          { description: `Replace a user (PUT; omitted attributes are cleared). Prefer patch for partial changes.${scope}`, input: object({ ...E, id: string(), body }), approval: always() },
          async (_c, i) => call("PUT", `${env(i.environmentId)}/users/${encodeURIComponent(i.id)}`, i.body),
        ),
        patch: mutation(
          { description: `Change some attributes of a user; omitted attributes are kept. Send null to clear one.${scope}`, input: object({ ...E, id: string(), body }), approval: always() },
          async (_c, i) => call("PATCH", `${env(i.environmentId)}/users/${encodeURIComponent(i.id)}`, i.body),
        ),
        groupMemberships: query(
          { description: `List the groups a user belongs to.${scope}`, input: userId },
          async (_c, i) => call("GET", `${userPath(i)}/memberOfGroups`),
        ),
        addToGroup: mutation(
          { description: `Add a user to a group.${scope}`, input: object({ ...E, userId: string(), groupId: string() }), approval: always() },
          async (_c, i) => call("POST", `${userPath(i)}/memberOfGroups`, { id: i.groupId }),
        ),
        removeFromGroup: mutation(
          { description: `Remove a user from a group.${scope}`, input: object({ ...E, userId: string(), groupId: string() }), approval: always() },
          async (_c, i) => call("DELETE", `${userPath(i)}/memberOfGroups/${encodeURIComponent(i.groupId)}`),
        ),
        roleAssignments: query(
          { description: `List the administrator role assignments of a user.${scope}`, input: userId },
          async (_c, i) => call("GET", `${userPath(i)}/roleAssignments`),
        ),
        devices: query(
          { description: `List the MFA devices of a user.${scope}`, input: userId },
          async (_c, i) => call("GET", `${userPath(i)}/devices`),
        ),
        sessions: query(
          { description: `List the active sessions of a user.${scope}`, input: userId },
          async (_c, i) => call("GET", `${userPath(i)}/sessions`),
        ),
        endSessions: mutation(
          { description: `End one session of a user (sessionId from sessions).${scope}`, input: object({ ...E, userId: string(), sessionId: string() }), approval: always() },
          async (_c, i) => call("DELETE", `${userPath(i)}/sessions/${encodeURIComponent(i.sessionId)}`),
        ),
        setPassword: mutation(
          { description: `Set a user's password to a new plain-text value (PUT password.setValue). forceChange defaults to false; true makes the user change it at next sign-on.${scope}`, input: object({ ...E, userId: string(), value: string(), forceChange: json().optional() }), approval: always() },
          async (_c, i) =>
            call("PUT", `${userPath(i)}/password`, { value: i.value, forceChange: i.forceChange ?? false }, "application/vnd.pingidentity.password.setValue+json"),
        ),
        forcePasswordChange: mutation(
          { description: `Require the user to change their password at next sign-on (the existing password is kept).${scope}`, input: userId, approval: always() },
          async (_c, i) => call("POST", `${userPath(i)}/password`, undefined, "application/vnd.pingidentity.password.forceChange"),
        ),
        unlockPassword: mutation(
          { description: `Unlock a user whose account is locked after failed password attempts.${scope}`, input: userId, approval: always() },
          async (_c, i) => call("POST", `${userPath(i)}/password`, undefined, "application/vnd.pingidentity.password.unlock"),
        ),
        enable: mutation(
          { description: `Enable or disable a user account.${scope}`, input: object({ ...E, userId: string(), enabled: json() }), approval: always() },
          async (_c, i) => call("PUT", `${userPath(i)}/enabled`, { enabled: i.enabled }),
        ),
      }),
      groups: router(crud("group", "groups", "groups")),
      populations: router(crud("population", "populations", "populations")),
      applications: router({
        list: query({ description: `List applications.${pageNote}${scope}`, input: ListInput }, list((e) => `${e}/applications`)),
        get: query({ description: `Get an application by ID (the client secret is not included).${scope}`, input: object({ ...E, id: string() }) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/applications/${encodeURIComponent(i.id)}`),
        ),
        create: mutation({ description: `Create an application. body is the PingOne application JSON.${scope}`, input: object({ ...E, body }), approval: always() }, async (_c, i) =>
          call("POST", `${env(i.environmentId)}/applications`, i.body),
        ),
        update: mutation({ description: `Replace an application (PUT).${scope}`, input: object({ ...E, id: string(), body }), approval: always() }, async (_c, i) =>
          call("PUT", `${env(i.environmentId)}/applications/${encodeURIComponent(i.id)}`, i.body),
        ),
        delete: mutation({ description: `Delete an application.${scope}`, input: object({ ...E, id: string() }), approval: always() }, async (_c, i) =>
          call("DELETE", `${env(i.environmentId)}/applications/${encodeURIComponent(i.id)}`),
        ),
        grants: query({ description: `List the resource grants of an application.${scope}`, input: object({ ...E, id: string() }) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/applications/${encodeURIComponent(i.id)}/grants`),
        ),
      }),
      resources: router({
        list: query({ description: `List OAuth resources (custom APIs and the openid resource).${pageNote}${scope}`, input: ListInput }, list((e) => `${e}/resources`)),
        get: query({ description: `Get a resource by ID.${scope}`, input: object({ ...E, id: string() }) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/resources/${encodeURIComponent(i.id)}`),
        ),
        scopes: query({ description: `List the scopes of a resource.${scope}`, input: object({ ...E, id: string() }) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/resources/${encodeURIComponent(i.id)}/scopes`),
        ),
      }),
      policies: router({
        signOn: query({ description: `List sign-on policies.${pageNote}${scope}`, input: ListInput }, list((e) => `${e}/signOnPolicies`)),
        password: query({ description: `List password policies.${pageNote}${scope}`, input: ListInput }, list((e) => `${e}/passwordPolicies`)),
      }),
      roles: router({
        list: query({ description: `List the built-in administrator roles.${scope}`, input: object(E) }, async (_c, i) =>
          call("GET", `${env(i.environmentId)}/roles`),
        ),
      }),
      activities: query(
        { description: `List audit activities (sign-ins, admin changes). PingOne requires a date range in filter, for example 'recordedAt gt "2026-01-01T00:00:00Z" AND recordedAt lt "2026-01-02T00:00:00Z"'. The activities endpoint has a low rate limit.${pageNote}${scope}`, input: ListInput },
        list((e) => `${e}/activities`),
      ),
      request: mutation(
        {
          description:
            "Call any other PingOne platform API endpoint under /v1 (see https://developer.pingidentity.com/pingone-api/). path starts with /v1, for example /v1/environments/{id}/sessions. Always requires approval.",
          input: object({
            method: string(),
            path: string(),
            body: json().optional(),
            contentType: string().optional(),
          }),
          approval: always(),
        },
        async (_c, i) => {
          const method = i.method.toUpperCase();
          if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE.");
          if (!i.path.startsWith("/v1/") || i.path.includes("//") || i.path.includes("..")) throw new Error("path must start with /v1/.");
          return call(method, i.path, i.body, i.contentType);
        },
      ),
    },
    {},
  );
}

export default defineApp(
  { user: { accounts: { pingone: pingone.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.pingone ?? [], (account) => build(account.fields as Fields, fetch, signal), { signal }),
      {
        title: "PingOne",
        description:
          "Ping Identity PingOne platform API: environments, users, groups, populations, applications, resources, policies, MFA devices, sessions and audit activities.",
        icons,
      },
    ),
  }),
);

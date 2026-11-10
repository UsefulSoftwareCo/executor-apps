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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fields = { clientId: string; clientSecret: string; region: string };

// Bitwarden's cloud does not serve its Public API swagger.json (the server only exposes it in
// Development or self-hosted builds), so the endpoints are written by hand.
function origins(region: string) {
  const r = region.trim().toLowerCase();
  if (r === "us") return { api: "https://api.bitwarden.com", identity: "https://identity.bitwarden.com" };
  if (r === "eu") return { api: "https://api.bitwarden.eu", identity: "https://identity.bitwarden.eu" };
  throw new Error('Region must be "us" (bitwarden.com) or "eu" (bitwarden.eu).');
}

const bitwarden = defineProvider({
  name: "Bitwarden",
  hosts: ["api.bitwarden.com", "identity.bitwarden.com", "api.bitwarden.eu", "identity.bitwarden.eu"],
  auth: {
    organizationApiKey: secrets({
      label: "Organization API key (client credentials)",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        region: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const c = client(account.fields, fetch, signal);
    // Token exchange plus a read-only call; the response body is not decoded.
    await c.call("GET", "/public/collections");
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const { api, identity } = origins(fields.region);
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(`${identity}/connect/token`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "api.organization",
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
      }).toString(),
    });
    const t = await decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
    // expires_in is in seconds; * 900 is ms with a deliberate 90% refresh margin (900 = 1000 * 0.9).
    cached = { token: t.access_token, expires: Date.now() + (t.expires_in ?? 3600) * 900 };
    return t.access_token;
  };
  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const u = new URL(`${api}${path.startsWith("/") ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, String(value));
    }
    const send = async () =>
      fetcher(u.toString(), {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${await token()}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    let response = await send();
    if (response.status === 401) {
      // Rotated key or revoked token: drop the cached bearer and retry once with a fresh exchange.
      cached = undefined;
      response = await send();
    }
    if (response.status === 204) return null;
    if (response.ok) {
      const text = await response.text();
      return text === "" ? null : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const id = string({ minLength: 1 });
const enc = encodeURIComponent;
const paging = "Pass continuationToken from the previous response to fetch the next page.";
const access =
  "collections is a list of { id, readOnly, hidePasswords, manage } objects.";

function build(c: Client) {
  const members = router(
    {
      list: query({ description: "List members of the organization (GET /public/members).", input: object({}) }, async () =>
        c.call("GET", "/public/members")),
      get: query({ description: "Retrieve a member (GET /public/members/{id}).", input: object({ id }) }, async (_x, i) =>
        c.call("GET", `/public/members/${enc(i.id)}`)),
      groupIds: query(
        { description: "List the group ids a member belongs to.", input: object({ id }) },
        async (_x, i) => c.call("GET", `/public/members/${enc(i.id)}/group-ids`),
      ),
      invite: mutation(
        {
          description: `Invite a member (POST /public/members). Body fields: email (required), type (0 owner, 1 admin, 2 user, 4 custom), externalId, accessAll, permissions, collections, groups. ${access}`,
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/public/members", {}, i.body),
      ),
      update: mutation(
        {
          description: `Update a member (PUT /public/members/{id}). Body fields, all optional: email, name, collections, groups. ${access}`,
          input: object({ id, body: json() }),
        },
        async (_x, i) => c.call("PUT", `/public/members/${enc(i.id)}`, {}, i.body),
      ),
      updateGroupIds: mutation(
        { description: "Replace the groups of a member. Body: { groupIds: string[] }.", input: object({ id, body: json() }) },
        async (_x, i) => c.call("PUT", `/public/members/${enc(i.id)}/group-ids`, {}, i.body),
      ),
      remove: mutation(
        { description: "Remove a member from the organization.", input: object({ id }) },
        async (_x, i) => c.call("DELETE", `/public/members/${enc(i.id)}`),
      ),
      reinvite: mutation(
        { description: "Resend a member's invitation.", input: object({ id }) },
        async (_x, i) => c.call("POST", `/public/members/${enc(i.id)}/reinvite`),
      ),
      revoke: mutation(
        { description: "Revoke a member's access.", input: object({ id }) },
        async (_x, i) => c.call("POST", `/public/members/${enc(i.id)}/revoke`),
      ),
      restore: mutation(
        { description: "Restore a revoked member.", input: object({ id }) },
        async (_x, i) => c.call("POST", `/public/members/${enc(i.id)}/restore`),
      ),
    },
    { title: "Members", description: "Organization members." },
  );

  const groups = router(
    {
      list: query({ description: "List groups (GET /public/groups).", input: object({}) }, async () =>
        c.call("GET", "/public/groups")),
      get: query({ description: "Retrieve a group.", input: object({ id }) }, async (_x, i) =>
        c.call("GET", `/public/groups/${enc(i.id)}`)),
      memberIds: query({ description: "List the member ids of a group.", input: object({ id }) }, async (_x, i) =>
        c.call("GET", `/public/groups/${enc(i.id)}/member-ids`)),
      create: mutation(
        {
          description: `Create a group (POST /public/groups). Body fields: name (required), accessAll, externalId, collections. ${access}`,
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/public/groups", {}, i.body),
      ),
      update: mutation(
        { description: "Update a group. Same body fields as create.", input: object({ id, body: json() }) },
        async (_x, i) => c.call("PUT", `/public/groups/${enc(i.id)}`, {}, i.body),
      ),
      updateMemberIds: mutation(
        { description: "Replace the members of a group. Body: { memberIds: string[] }.", input: object({ id, body: json() }) },
        async (_x, i) => c.call("PUT", `/public/groups/${enc(i.id)}/member-ids`, {}, i.body),
      ),
      delete: mutation({ description: "Delete a group.", input: object({ id }) }, async (_x, i) =>
        c.call("DELETE", `/public/groups/${enc(i.id)}`)),
    },
    { title: "Groups", description: "Organization groups." },
  );

  const collections = router(
    {
      list: query({ description: "List collections (GET /public/collections).", input: object({}) }, async () =>
        c.call("GET", "/public/collections")),
      get: query({ description: "Retrieve a collection with its group access.", input: object({ id }) }, async (_x, i) =>
        c.call("GET", `/public/collections/${enc(i.id)}`)),
      update: mutation(
        {
          description: "Update a collection (PUT /public/collections/{id}). Body fields: externalId, groups (list of { id, readOnly, hidePasswords, manage }).",
          input: object({ id, body: json() }),
        },
        async (_x, i) => c.call("PUT", `/public/collections/${enc(i.id)}`, {}, i.body),
      ),
      delete: mutation({ description: "Delete a collection.", input: object({ id }) }, async (_x, i) =>
        c.call("DELETE", `/public/collections/${enc(i.id)}`)),
    },
    { title: "Collections", description: "Organization collections." },
  );

  const policies = router(
    {
      list: query({ description: "List organization policies (GET /public/policies).", input: object({}) }, async () =>
        c.call("GET", "/public/policies")),
      get: query(
        { description: "Retrieve a policy by numeric type (GET /public/policies/{type}).", input: object({ type: id }) },
        async (_x, i) => c.call("GET", `/public/policies/${enc(i.type)}`),
      ),
      update: mutation(
        {
          description: "Update a policy by numeric type. Body: { enabled: boolean, data?: object }.",
          input: object({ type: id, body: json() }),
        },
        async (_x, i) => c.call("PUT", `/public/policies/${enc(i.type)}`, {}, i.body),
      ),
    },
    { title: "Policies", description: "Organization policies." },
  );

  const events = router(
    {
      list: query(
        {
          description: `List organization event logs (GET /public/events). start and end are ISO 8601 timestamps; the range defaults to the last 30 days and may not exceed 367 days. ${paging}`,
          input: object({
            start: string().optional(),
            end: string().optional(),
            actingUserId: string().optional(),
            itemId: string().optional(),
            continuationToken: string().optional(),
          }),
        },
        async (_x, i) => c.call("GET", "/public/events", i),
      ),
    },
    { title: "Events", description: "Audit event logs." },
  );

  const directory = router(
    {
      import: mutation(
        {
          description:
            "Import groups and members from an external directory (POST /public/organization/import). Body: { groups: [{ name, externalId, memberExternalIds }], members: [{ email, externalId, deleted }], overwriteExisting: boolean, largeImport: boolean }.",
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/public/organization/import", {}, i.body),
      ),
    },
    { title: "Directory import", description: "Directory sync import." },
  );

  return router({ members, groups, collections, policies, events, directory });
}

export default defineApp({ user: { accounts: { bitwarden: bitwarden.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.bitwarden ?? [],
      (account) =>
        withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "Bitwarden",
      description: "Manage a Bitwarden organization: members, groups, collections, policies, event logs and directory import.",
      instructions:
        "This is the organization Public API; it cannot read or manage individual vault items. Ids are GUIDs. Member type: 0 owner, 1 admin, 2 user, 4 custom.",
      icons,
    },
  ),
}));

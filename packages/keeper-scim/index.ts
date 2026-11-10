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
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const regions = [
  "keepersecurity.com",
  "keepersecurity.eu",
  "keepersecurity.com.au",
  "keepersecurity.ca",
  "keepersecurity.jp",
  "govcloud.keepersecurity.us",
];

type Account = { fields: { token: string; node: string; region: string } };

const base = (account: Account) => `https://${account.fields.region}/api/rest/scim/v2/${account.fields.node}`;

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/scim+json, application/json",
});

const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/scim+json" });

const keeper = defineProvider({
  name: "Keeper SCIM",
  hosts: regions,
  auth: {
    apiKey: secrets({
      label: "SCIM token and node ID",
      fields: object({
        token: string({ minLength: 1 }),
        node: string({ minLength: 1 }),
        region: string().default("keepersecurity.com"),
      }),
    }),
  },
  // Listing a single user is read-only and cheap.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account)}/Users?count=1`, { signal, headers: headers(account) });
    await decodeJson(response, object({}));
  },
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const operation = object({
  op: string(),
  path: string().optional(),
  value: json().optional(),
});

const patchBody = (operations: ReadonlyArray<{ op: string; path?: string; value?: unknown }>) => ({
  schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  Operations: operations,
});

const keeperTools = (account: Account, signal: AbortSignal) =>
  router({
    serviceProviderConfig: query(
      {
        description:
          "Read the SCIM ServiceProviderConfig for this node: supported features, bulk operation limits (default 1000 operations, 1 MB) and filter support.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base(account)}/ServiceProviderConfig`, { signal, headers: headers(account) }), json()),
    ),
    users: router(
      {
        list: query(
          {
            description:
              "List users provisioned to this Keeper node. Supports a SCIM filter (for example userName eq \"a@example.com\"), startIndex (1-based) and count. Without count, results are capped at 1000.",
            input: object({
              filter: string().optional(),
              startIndex: number().optional(),
              count: number().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${base(account)}/Users${search(input)}`, { signal, headers: headers(account) }), json()),
        ),
        get: query(
          {
            description: "Get one user by SCIM id. Returns 404 when the user does not exist.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) =>
            decodeJson(
              await fetch(`${base(account)}/Users/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        create: mutation(
          {
            description:
              "Create (invite) a user. userName is the email address and its domain must be reserved by the Keeper tenant. New users start in the invited state.",
            input: object({
              userName: string(),
              givenName: string().optional(),
              familyName: string().optional(),
              displayName: string().optional(),
              externalId: string().optional(),
              active: boolean().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base(account)}/Users`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({
                  schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
                  userName: input.userName,
                  externalId: input.externalId,
                  displayName: input.displayName,
                  name: { givenName: input.givenName, familyName: input.familyName },
                  emails: [{ value: input.userName, primary: true }],
                  active: input.active ?? true,
                }),
              }),
              json(),
            ),
        ),
        setActive: mutation(
          {
            description: "Lock (active false) or unlock (active true) a user.",
            input: object({ id: string(), active: boolean() }),
            approval: always(),
          },
          async ({ fetch }, { id, active }) =>
            decodeJson(
              await fetch(`${base(account)}/Users/${encodeURIComponent(id)}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(patchBody([{ op: "replace", path: "active", value: active }])),
              }),
              json(),
            ),
        ),
        patch: mutation(
          {
            description:
              "Send raw SCIM PATCH operations to a user, for example adding or removing team membership. Each operation has op (add, remove, replace), an optional path and a value.",
            input: object({ id: string(), operations: array(operation) }),
            approval: always(),
          },
          async ({ fetch }, { id, operations }) =>
            decodeJson(
              await fetch(`${base(account)}/Users/${encodeURIComponent(id)}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(patchBody(operations)),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a user. Keeper locks the user instead of deleting them, to prevent data loss.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) => {
            const response = await fetch(`${base(account)}/Users/${encodeURIComponent(id)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Keeper SCIM DELETE failed with HTTP ${response.status}`);
            return { deleted: true, status: response.status };
          },
        ),
      },
      { title: "Users", description: "Provision and lock Keeper users." },
    ),
    groups: router(
      {
        list: query(
          {
            description:
              "List teams (SCIM groups) on this node. Use excludeMembers to omit member lists. Supports startIndex (1-based) and count; without count results are capped at 1000.",
            input: object({
              filter: string().optional(),
              startIndex: number().optional(),
              count: number().optional(),
              excludeMembers: boolean().optional(),
            }),
          },
          async ({ fetch }, { excludeMembers, ...input }) =>
            decodeJson(
              await fetch(
                `${base(account)}/Groups${search({ ...input, excludedAttributes: excludeMembers === true ? "members" : undefined })}`,
                { signal, headers: headers(account) },
              ),
              json(),
            ),
        ),
        get: query(
          {
            description: "Get one team by SCIM id, including its members.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) =>
            decodeJson(
              await fetch(`${base(account)}/Groups/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        create: mutation(
          {
            description:
              "Create a team. New teams and team assignments need approval from an admin login, Commander team-approve, or Keeper Automator.",
            input: object({
              displayName: string(),
              externalId: string().optional(),
              memberIds: array(string()).optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base(account)}/Groups`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({
                  schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
                  displayName: input.displayName,
                  externalId: input.externalId,
                  members: (input.memberIds ?? []).map((value) => ({ value })),
                }),
              }),
              json(),
            ),
        ),
        addMembers: mutation(
          {
            description: "Add users (by SCIM id) to a team.",
            input: object({ id: string(), userIds: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, { id, userIds }) =>
            decodeJson(
              await fetch(`${base(account)}/Groups/${encodeURIComponent(id)}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(
                  patchBody([{ op: "add", path: "members", value: userIds.map((value) => ({ value })) }]),
                ),
              }),
              json(),
            ),
        ),
        removeMembers: mutation(
          {
            description: "Remove users (by SCIM id) from a team.",
            input: object({ id: string(), userIds: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, { id, userIds }) =>
            decodeJson(
              await fetch(`${base(account)}/Groups/${encodeURIComponent(id)}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(
                  patchBody(userIds.map((value) => ({ op: "remove", path: `members[value eq "${value}"]` }))),
                ),
              }),
              json(),
            ),
        ),
        patch: mutation(
          {
            description: "Send raw SCIM PATCH operations to a team (op add, remove, replace; optional path and value).",
            input: object({ id: string(), operations: array(operation) }),
            approval: always(),
          },
          async ({ fetch }, { id, operations }) =>
            decodeJson(
              await fetch(`${base(account)}/Groups/${encodeURIComponent(id)}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(patchBody(operations)),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a team. This removes the team from Keeper.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) => {
            const response = await fetch(`${base(account)}/Groups/${encodeURIComponent(id)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Keeper SCIM DELETE failed with HTTP ${response.status}`);
            return { deleted: true, status: response.status };
          },
        ),
      },
      { title: "Teams", description: "Manage Keeper teams (SCIM groups) and their members." },
    ),
    bulk: mutation(
      {
        description:
          "Run an RFC 7644 bulk request. Each operation has method (POST, PATCH, DELETE), path (for example /Users), optional bulkId and data. Defaults: 1000 operations and 1 MB; circular bulkId references return 409.",
        input: object({ operations: array(json()), failOnErrors: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, { operations, failOnErrors }) =>
        decodeJson(
          await fetch(`${base(account)}/Bulk`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({
              schemas: ["urn:ietf:params:scim:api:messages:2.0:BulkRequest"],
              failOnErrors,
              Operations: operations,
            }),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { keeper: keeper.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.keeper ?? [], (account) => keeperTools(account, signal), { signal }), {
    title: "Keeper (SCIM)",
    description: "Provision Keeper Security users and teams over SCIM 2.0: list, invite, lock and unlock users, manage teams and members, and run bulk requests.",
    icons,
  }),
}));

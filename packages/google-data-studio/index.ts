import {
  accountRouter,
  array,
  boolean,
  number,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://datastudio.googleapis.com/v1";

const UserInfo = object({ sub: string() });
const Role = string({ minLength: 1 });
const Member = string({ minLength: 1 });

const googleDataStudio = defineProvider({
  name: "Google Data Studio",
  hosts: ["datastudio.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    // The Data Studio API only works for Workspace / Cloud Identity organizations whose admin has
    // authorized the client through domain-wide delegation with the datastudio scope.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/datastudio"],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, UserInfo);
    return { accountInfo: { externalId: me.sub } };
  },
});

export default defineApp(
  { user: { accounts: { googleDataStudio: googleDataStudio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleDataStudio ?? [],
        (account) => {
          const headers = (extra: Record<string, string> = {}) => ({
            Authorization: `Bearer ${account.fields.access_token}`,
            ...extra,
          });
          const assetPath = (assetName: string) => `${BASE}/assets/${encodeURIComponent(assetName)}/permissions`;
          return router({
            searchAssets: query(
              {
                description:
                  "Search the user's Data Studio assets (GET /v1/assets:search). Exactly one asset type per call: assetTypes is REPORT or DATA_SOURCE; orderBy is title, last_viewed_by_me, create_time, last_accessed_time or id; owner is an email address. `title` matches title and description and accepts filters such as owner:me, creator:me, from:<email>, to:<email>.",
                input: object({
                  assetTypes: string({ minLength: 1 }),
                  title: string().optional(),
                  owner: string().optional(),
                  includeTrashed: boolean().optional(),
                  orderBy: string().optional(),
                  pageSize: number().optional(),
                  pageToken: string().optional(),
                }),
              },
              async ({ fetch }, input) => {
                const params = new URLSearchParams({ assetTypes: input.assetTypes });
                for (const key of ["title", "owner", "orderBy", "pageToken"] as const) {
                  const value = input[key];
                  if (value !== undefined) params.set(key, value);
                }
                if (input.includeTrashed !== undefined) params.set("includeTrashed", String(input.includeTrashed));
                if (input.pageSize !== undefined) params.set("pageSize", String(input.pageSize));
                return decodeJson(
                  await fetch(`${BASE}/assets:search?${params}`, { headers: headers(), signal }),
                  record(json()),
                );
              },
            ),
            getPermissions: query(
              {
                description: "Get the permissions of an asset (assetName is the asset ID) (GET /v1/assets/{assetName}/permissions).",
                input: object({ assetName: string({ minLength: 1 }) }),
              },
              async ({ fetch }, { assetName }) =>
                decodeJson(await fetch(assetPath(assetName), { headers: headers(), signal }), record(json())),
            ),
            updatePermissions: mutation(
              {
                description:
                  "Replace an asset's permissions (PATCH /v1/assets/{assetName}/permissions). `permissions` is the Permissions object: { permissions: { <ROLE>: { members: [...] } }, etag }. The OWNER role cannot be changed.",
                input: object({
                  assetName: string({ minLength: 1 }),
                  permissions: record(json()),
                }),
                approval: always(),
              },
              async ({ fetch }, { assetName, permissions }) =>
                decodeJson(
                  await fetch(assetPath(assetName), {
                    method: "PATCH",
                    headers: headers({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ permissions }),
                    signal,
                  }),
                  record(json()),
                ),
            ),
            addMembers: mutation(
              {
                description:
                  "Add members to a role on an asset (POST /v1/assets/{assetName}/permissions:addMembers). Roles: EDITOR, VIEWER, LINK_EDITOR, LINK_VIEWER (not OWNER). Members are prefixed user:<email>, group:<email>, domain:<domain>, serviceAccount:<email>, or allUsers for link roles.",
                input: object({
                  assetName: string({ minLength: 1 }),
                  role: Role,
                  members: array(Member),
                }),
                approval: always(),
              },
              async ({ fetch }, { assetName, role, members }) =>
                decodeJson(
                  await fetch(`${assetPath(assetName)}:addMembers`, {
                    method: "POST",
                    headers: headers({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ role, members }),
                    signal,
                  }),
                  record(json()),
                ),
            ),
            revokeAllPermissions: mutation(
              {
                description:
                  "Remove members from an asset (POST /v1/assets/{assetName}/permissions:revokeAllPermissions). Members are prefixed like user:<email>, group:<email>, domain:<domain>. Owners and the authorized user cannot be removed; unknown members are ignored.",
                input: object({
                  assetName: string({ minLength: 1 }),
                  members: array(Member),
                }),
                approval: always(),
              },
              async ({ fetch }, { assetName, members }) =>
                decodeJson(
                  await fetch(`${assetPath(assetName)}:revokeAllPermissions`, {
                    method: "POST",
                    headers: headers({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ members }),
                    signal,
                  }),
                  record(json()),
                ),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Google Data Studio",
        description: "Search Looker Studio (Data Studio) reports and data sources and manage who can access them.",
        icons,
      },
    ),
  }),
);

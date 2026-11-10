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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const registry = "https://registry.npmjs.org";
const downloads = "https://api.npmjs.org";

const npm = defineProvider({
  name: "npm",
  hosts: ["registry.npmjs.org", "api.npmjs.org"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Returns the username the token belongs to; read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${registry}/-/whoami`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ username: string() }));
  },
});

type Account = { fields: { token: string } };

const auth = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

// Scoped names (@scope/name) travel with the slash encoded as %2F.
const pkgPath = (name: string) => (name.startsWith("@") ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name));
const seg = encodeURIComponent;
// Org, scope and team names are accepted with or without a leading @ (libnpmaccess strips it).
const bare = (name: string) => name.replace(/^@/, "");
const orgSeg = (name: string) => seg(bare(name));
const teamPath = (team: string) => bare(team).split(":").map(seg).join("/");
// Downloads point/range take a literal slash in scoped names; bulk (comma list) is unscoped only.
const downloadsName = (name: string) => {
  if (name.startsWith("@")) {
    const [scope = "", ...rest] = name.slice(1).split("/");
    return `@${seg(scope)}/${rest.map(seg).join("/")}`;
  }
  return name.split(",").map((part) => seg(part.trim())).join(",");
};

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const npmTools = (account: Account, signal: AbortSignal) => {
  const headers = auth(account);
  const jsonHeaders = { ...headers, "content-type": "application/json" };
  return router({
    whoami: query(
      { description: "Return the npm username the access token belongs to.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${registry}/-/whoami`, { signal, headers }), json()),
    ),
    packages: router(
      {
        search: query(
          {
            description:
              "Search the npm registry. text supports qualifiers such as author:, maintainer:, scope:, keywords:, not:deprecated. size is 1-250 (default 20), from is the result offset.",
            input: object({ text: string(), size: number().optional(), from: number().optional() }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${registry}/-/v1/search?${search(input)}`, { signal, headers }), json()),
        ),
        get: query(
          {
            description:
              "Get the full packument for a package: every version, dist-tags, maintainers and times. Can be very large for popular packages; prefer getVersion or abbreviated.",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(await fetch(`${registry}/${pkgPath(name)}`, { signal, headers }), json()),
        ),
        abbreviated: query(
          {
            description:
              "Get the abbreviated packument (versions with dependencies, dist and engines, plus dist-tags) which is much smaller than the full document.",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(
              await fetch(`${registry}/${pkgPath(name)}`, {
                signal,
                headers: { ...headers, Accept: "application/vnd.npm.install-v1+json" },
              }),
              json(),
            ),
        ),
        getVersion: query(
          {
            description:
              "Get the manifest of one version of a package. version may be a semver version or a dist-tag such as latest.",
            input: object({ name: string(), version: string().default("latest") }),
          },
          async ({ fetch }, { name, version }) =>
            decodeJson(await fetch(`${registry}/${pkgPath(name)}/${seg(version)}`, { signal, headers }), json()),
        ),
      },
      { title: "Packages", description: "Search the registry and read package metadata." },
    ),
    distTags: router(
      {
        list: query(
          {
            description: "List the dist-tags of a package (tag name to version).",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(await fetch(`${registry}/-/package/${pkgPath(name)}/dist-tags`, { signal, headers }), json()),
        ),
        set: mutation(
          {
            description: "Point a dist-tag of a package at a published version. Changing latest changes what npm install resolves.",
            input: object({ name: string(), tag: string(), version: string() }),
            approval: always(),
          },
          async ({ fetch }, { name, tag, version }) =>
            decodeJson(
              await fetch(`${registry}/-/package/${pkgPath(name)}/dist-tags/${seg(tag)}`, {
                method: "PUT",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify(version),
              }),
              json(),
            ),
        ),
        remove: mutation(
          {
            description: "Remove a dist-tag from a package. The latest tag cannot be removed.",
            input: object({ name: string(), tag: string() }),
            approval: always(),
          },
          async ({ fetch }, { name, tag }) =>
            decodeJson(
              await fetch(`${registry}/-/package/${pkgPath(name)}/dist-tags/${seg(tag)}`, {
                method: "DELETE",
                signal,
                headers,
              }),
              json(),
            ),
        ),
      },
      { title: "Dist-tags", description: "Read and change the dist-tags of a package." },
    ),
    access: router(
      {
        collaborators: query(
          {
            description: "List users and their permissions (read or write) on a package.",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(await fetch(`${registry}/-/package/${pkgPath(name)}/collaborators`, { signal, headers }), json()),
        ),
        visibility: query(
          {
            description: "Report whether a package is public or private (two-factor requirement included).",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(await fetch(`${registry}/-/package/${pkgPath(name)}/visibility`, { signal, headers }), json()),
        ),
        setVisibility: mutation(
          {
            description:
              "Set a scoped package to public or private. visibility is \"public\" or \"restricted\". Private packages need a paid plan.",
            input: object({ name: string(), visibility: string() }),
            approval: always(),
          },
          async ({ fetch }, { name, visibility }) =>
            decodeJson(
              await fetch(`${registry}/-/package/${pkgPath(name)}/access`, {
                method: "POST",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ access: visibility }),
              }),
              json(),
            ),
        ),
        grantTeam: mutation(
          {
            description:
              "Grant a team access to a package. team is \"org:team\" and permission is \"read-only\" or \"read-write\".",
            input: object({ name: string(), team: string(), permission: string() }),
            approval: always(),
          },
          async ({ fetch }, { name, team, permission }) =>
            decodeJson(
              await fetch(`${registry}/-/team/${teamPath(team)}/package`, {
                method: "PUT",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ package: name, permissions: permission }),
              }),
              json(),
            ),
        ),
        revokeTeam: mutation(
          {
            description: "Revoke a team's access to a package. team is \"org:team\".",
            input: object({ name: string(), team: string() }),
            approval: always(),
          },
          async ({ fetch }, { name, team }) =>
            decodeJson(
              await fetch(`${registry}/-/team/${teamPath(team)}/package`, {
                method: "DELETE",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ package: name }),
              }),
              json(),
            ),
        ),
        userPackages: query(
          {
            description:
              "List the packages an npm user or organization (scope) can access, with their permission (read or write). Tries the organization endpoint first and falls back to the user endpoint on 404.",
            input: object({ user: string() }),
          },
          async ({ fetch }, { user }) => {
            const name = orgSeg(user);
            const asOrg = await fetch(`${registry}/-/org/${name}/package`, { signal, headers });
            if (asOrg.status !== 404) return decodeJson(asOrg, json());
            return decodeJson(await fetch(`${registry}/-/user/${name}/package`, { signal, headers }), json());
          },
        ),
      },
      { title: "Access", description: "Read and change who can see and publish a package." },
    ),
    orgs: router(
      {
        members: query(
          {
            description: "List the members of an organization with their roles.",
            input: object({ org: string() }),
          },
          async ({ fetch }, { org }) =>
            decodeJson(await fetch(`${registry}/-/org/${orgSeg(org)}/user`, { signal, headers }), json()),
        ),
        setMember: mutation(
          {
            description:
              "Add a user to an organization or change their role. role is \"developer\", \"admin\" or \"owner\".",
            input: object({ org: string(), user: string(), role: string().default("developer") }),
            approval: always(),
          },
          async ({ fetch }, { org, user, role }) =>
            decodeJson(
              await fetch(`${registry}/-/org/${orgSeg(org)}/user`, {
                method: "PUT",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ user, role }),
              }),
              json(),
            ),
        ),
        removeMember: mutation(
          {
            description: "Remove a user from an organization.",
            input: object({ org: string(), user: string() }),
            approval: always(),
          },
          async ({ fetch }, { org, user }) =>
            decodeJson(
              await fetch(`${registry}/-/org/${orgSeg(org)}/user`, {
                method: "DELETE",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ user }),
              }),
              json(),
            ),
        ),
        packages: query(
          {
            description: "List the packages owned by an organization (scope) with their permissions.",
            input: object({ org: string() }),
          },
          async ({ fetch }, { org }) =>
            decodeJson(await fetch(`${registry}/-/org/${orgSeg(org)}/package`, { signal, headers }), json()),
        ),
        teams: query(
          {
            description: "List the teams of an organization.",
            input: object({ org: string() }),
          },
          async ({ fetch }, { org }) =>
            decodeJson(await fetch(`${registry}/-/org/${orgSeg(org)}/team`, { signal, headers }), json()),
        ),
        teamMembers: query(
          {
            description: "List the users in a team of an organization.",
            input: object({ org: string(), team: string() }),
          },
          async ({ fetch }, { org, team }) =>
            decodeJson(await fetch(`${registry}/-/team/${orgSeg(org)}/${orgSeg(team)}/user`, { signal, headers }), json()),
        ),
        teamPackages: query(
          {
            description: "List the packages a team can access, with permissions.",
            input: object({ org: string(), team: string() }),
          },
          async ({ fetch }, { org, team }) =>
            decodeJson(await fetch(`${registry}/-/team/${orgSeg(org)}/${orgSeg(team)}/package`, { signal, headers }), json()),
        ),
        createTeam: mutation(
          {
            description: "Create a team in an organization.",
            input: object({ org: string(), team: string(), description: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { org, team, description }) =>
            decodeJson(
              await fetch(`${registry}/-/org/${orgSeg(org)}/team`, {
                method: "PUT",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ name: team, description }),
              }),
              json(),
            ),
        ),
        deleteTeam: mutation(
          {
            description: "Delete a team from an organization.",
            input: object({ org: string(), team: string() }),
            approval: always(),
          },
          async ({ fetch }, { org, team }) =>
            decodeJson(
              await fetch(`${registry}/-/team/${orgSeg(org)}/${orgSeg(team)}`, { method: "DELETE", signal, headers }),
              json(),
            ),
        ),
        addTeamMember: mutation(
          {
            description: "Add a user to a team.",
            input: object({ org: string(), team: string(), user: string() }),
            approval: always(),
          },
          async ({ fetch }, { org, team, user }) =>
            decodeJson(
              await fetch(`${registry}/-/team/${orgSeg(org)}/${orgSeg(team)}/user`, {
                method: "PUT",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ user }),
              }),
              json(),
            ),
        ),
        removeTeamMember: mutation(
          {
            description: "Remove a user from a team.",
            input: object({ org: string(), team: string(), user: string() }),
            approval: always(),
          },
          async ({ fetch }, { org, team, user }) =>
            decodeJson(
              await fetch(`${registry}/-/team/${orgSeg(org)}/${orgSeg(team)}/user`, {
                method: "DELETE",
                signal,
                headers: jsonHeaders,
                body: JSON.stringify({ user }),
              }),
              json(),
            ),
        ),
      },
      { title: "Organizations", description: "Manage organization members, teams and their package access." },
    ),
    downloads: router(
      {
        point: query(
          {
            description:
              "Total downloads of a package over a period. period is last-day, last-week, last-month, or a date or range such as 2026-01-01:2026-01-31. Omit name for all of npm. Separate several names with commas (unscoped only).",
            input: object({ period: string().default("last-week"), name: string().optional() }),
          },
          async ({ fetch }, { period, name }) =>
            decodeJson(
              await fetch(
                `${downloads}/downloads/point/${seg(period).replace(/%3A/g, ":")}${name === undefined ? "" : `/${downloadsName(name)}`}`,
                { signal, headers: { Accept: "application/json" } },
              ),
              json(),
            ),
        ),
        range: query(
          {
            description:
              "Per-day downloads of a package over a period (same period formats as point). Omit name for all of npm.",
            input: object({ period: string().default("last-month"), name: string().optional() }),
          },
          async ({ fetch }, { period, name }) =>
            decodeJson(
              await fetch(
                `${downloads}/downloads/range/${seg(period).replace(/%3A/g, ":")}${name === undefined ? "" : `/${downloadsName(name)}`}`,
                { signal, headers: { Accept: "application/json" } },
              ),
              json(),
            ),
        ),
        versions: query(
          {
            description: "Downloads of the last week broken down by version for one package.",
            input: object({ name: string() }),
          },
          async ({ fetch }, { name }) =>
            decodeJson(
              await fetch(`${downloads}/versions/${pkgPath(name)}/last-week`, {
                signal,
                headers: { Accept: "application/json" },
              }),
              json(),
            ),
        ),
      },
      { title: "Downloads", description: "Download counts from the public npm downloads API." },
    ),
    audit: query(
      {
        description:
          "Check packages against known security advisories. packages maps a package name to a list of versions, for example {\"lodash\": [\"4.17.20\"]}. Returns advisories keyed by package name.",
        input: object({ packages: record(array(string())) }),
      },
      async ({ fetch }, { packages }) =>
        decodeJson(
          await fetch(`${registry}/-/npm/v1/security/advisories/bulk`, {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify(packages),
          }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { npm: npm.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.npm ?? [], (account) => npmTools(account, signal), { signal }), {
    title: "npm",
    description:
      "Search and inspect npm packages, manage dist-tags, package access, organizations and teams, read download counts and audit dependencies.",
    icons,
  }),
}));

import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// The Contact schema has no required fields, so only the id is decoded.
const Me = object({ data: array(object({ id: string() })) });

// Wrike hosts each account in one data center and every call must go to that host's /api/v4
// (a wrong host answers 401). The OAuth token response names the host, but Executor keeps only
// the access token of an OAuth grant, so OAuth accounts are fixed to the default US host. A
// permanent token account enters its host: the address-bar host of the Wrike workspace.
const defaultHost = "www.wrike.com";
const hostPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.wrike\.com$/;

function normalizeHost(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your Wrike host as shown in the browser address bar, for example www.wrike.com or app-eu.wrike.com.");
  return host;
}

const wrike = defineProvider({
  name: "Wrike",
  hosts: ["*.wrike.com"],
  auth: {
    token: secrets({
      label: "Permanent access token",
      fields: object({ host: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
    // Wrike offers no client registration: the connect page asks for an API app's client.
    oauth: oauth2({
      authorizationUrl: "https://login.wrike.com/oauth2/authorize/v4",
      tokenUrl: "https://login.wrike.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "Default",
        "wsReadWrite",
        "amReadWriteUser",
        "amReadWriteGroup",
        "amReadWriteInvitation",
        "amReadWriteWorkflow",
        "amReadWriteWorkSchedule",
        "amReadOnlyAccessRole",
        "amReadOnlyAuditLog",
      ],
      scopeSeparator: ",",
    }),
  },
  async health({ account, fetch, signal }) {
    const host = account.method === "oauth" ? defaultHost : normalizeHost(account.fields.host);
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`https://${host}/api/v4/contacts?me=true`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (response.status === 401)
      throw new Error(
        `Wrike refused the token at ${host}. A token from another data center needs its own host: use a permanent token and enter the host from the Wrike address bar (OAuth accounts only work on ${defaultHost}).`,
      );
    const { data } = await decodeJson(response, Me);
    const user = data[0];
    if (user === undefined) throw new Error("Wrike returned no current user");
    return { accountInfo: { externalId: `${host}:${user.id}` } };
  },
});

export default defineApp(
  { user: { accounts: { wrike: wrike.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wrike ?? [],
        (account) => {
          const origin = `https://${account.method === "oauth" ? defaultHost : normalizeHost(account.fields.host)}`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v4`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Wrike",
        description:
          "Tasks, folders, projects, spaces, comments, timelogs, custom fields, users and the rest of the Wrike REST API v4.",
        icons,
      },
    ),
  }),
);

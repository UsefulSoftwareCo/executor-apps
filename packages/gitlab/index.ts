import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const User = object({ id: number(), username: string(), web_url: string() });

const gitlab = defineProvider({
  name: "GitLab",
  hosts: ["gitlab.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The user creates an OAuth application at gitlab.com; the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://gitlab.com/oauth/authorize",
      tokenUrl: "https://gitlab.com/oauth/token",
      revocationUrl: "https://gitlab.com/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["api", "read_user"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "PRIVATE-TOKEN": account.fields.token };
    const response = await fetch("https://gitlab.com/api/v4/user", { signal, headers });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: String(me.id), username: me.username, profileUrl: me.web_url } };
  },
});

const description =
  "Projects, merge requests, issues, pipelines, repositories, groups, users and the rest of the GitLab.com REST API.";

export default defineApp(
  { user: { accounts: { gitlab: gitlab.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gitlab ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { title: "GitLab", description, icons },
    ),
  }),
);

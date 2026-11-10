import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const User = object({ id: number(), login: string() });

// Gitea is self-hosted (or gitea.com), so the instance URL is part of the account. Decision: the
// provider declares no `hosts` and no `request` placements. Instance domains are arbitrary, the
// framework only accepts static host lists, and pinning to gitea.com would drop self-hosted support.
// The token therefore reaches app code raw; the mitigation is that liveOpenapiRouter's
// allowedOrigin is the account's own instance origin, so tool calls never leave it.
// Sub-path installs (https://example.com/git) keep their path.
function instanceOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Gitea instance URL, for example https://gitea.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Gitea instance must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The Gitea instance URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function originOf(base: string): string {
  return new URL(base).origin;
}

const gitea = defineProvider({
  name: "Gitea",
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = instanceOrigin(account.fields.instance);
    const response = await fetch(`${origin}/api/v1/user`, {
      signal,
      headers: { Authorization: `token ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: `${origin}:${me.id}`, username: me.login } };
  },
});

export default defineApp(
  { user: { accounts: { gitea: gitea.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gitea ?? [],
        (account) => {
          const base = instanceOrigin(account.fields.instance);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: originOf(base),
              baseUrl: `${base}/api/v1`,
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
        title: "Gitea",
        description:
          "Repositories, issues, pull requests, organizations, releases, Actions, packages and the rest of the Gitea REST API.",
        icons,
      },
    ),
  }),
);

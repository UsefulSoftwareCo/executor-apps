import {
  accountRouter,
  decodeJson,
  header,
  bearer,
  defineApp,
  defineProvider,
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
import { clientOptions, indexingOptions } from "./openapi.js";

// Glean is multi-tenant by host: https://<instance>-be.glean.com. The account stores that host name.
// Accepts "acme-be.glean.com" or a full URL; only https glean hosts are allowed so the token cannot
// be sent anywhere else.
function serverOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Glean server URL, for example acme-be.glean.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Glean server must use https.");
  if (!url.hostname.endsWith(".glean.com")) {
    throw new Error("The Glean server must be a glean.com host, for example acme-be.glean.com.");
  }
  return url.origin;
}

const glean = defineProvider({
  name: "Glean",
  hosts: ["*.glean.com"],
  auth: {
    token: secrets({
      label: "Server URL and API token",
      fields: object({
        serverUrl: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => bearer(token),
    }),
    globalToken: secrets({
      label: "Server URL, global API token and act-as email",
      fields: object({
        serverUrl: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
        actAs: string({ minLength: 3 }),
      }),
      request: ({ token, actAs }) => [bearer(token), header("X-Glean-ActAs", actAs)],
    }),
  },
  // Listing pins is a read that any user-scoped Client API token may do.
  async health({ account, fetch, signal }) {
    const origin = serverOrigin(account.fields.serverUrl);
    const response = await fetch(`${origin}/rest/api/v1/listpins`, {
      method: "POST",
      signal,
      headers: {
        ...account.headers(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    await decodeJson(response, object({}));
    const host = new URL(origin).hostname;
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { glean: glean.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.glean ?? [],
        (account) => {
          const origin = serverOrigin(account.fields.serverUrl);
          const mount = (options: typeof clientOptions | typeof indexingOptions) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                allowedOrigin: origin,
                baseUrl: origin,
                cache,
                fetch,
                signal,
                account,
              } as Parameters<typeof liveOpenapiRouter>[0]),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            { client: mount(clientOptions), indexing: mount(indexingOptions) },
            { title: "Glean", description: "Glean deployment." },
          );
        },
        { signal },
      ),
      {
        title: "Glean",
        description:
          "Glean. client: search, autocomplete, chat, agents, answers, collections, pins, shortcuts, announcements, verifications and people. indexing: push documents, permissions, employees, teams and datasource data into the Glean index.",
        icons,
      },
    ),
  }),
);

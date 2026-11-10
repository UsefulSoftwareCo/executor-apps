import {
  accountRouter,
  decodeJson,
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
import { options } from "./openapi.js";

// Every Discourse forum has its own host (forum.example.com, or example.discourse.group when hosted).
// Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Discourse forum host, for example forum.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Discourse forum must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the forum host, with no path.");
  return url.origin;
}

const discourse = defineProvider({
  name: "Discourse",
  auth: {
    // An API key created under Admin > API > Keys, sent with the username it acts as (Api-Key and Api-Username).
    // Discourse has no user-created OAuth apps. The forum host is part of the account, so no static `hosts`.
    apiKey: secrets({
      label: "API key",
      fields: object({
        host: plain(string({ minLength: 1 })),
        apiUsername: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const response = await fetch(`${origin}/site/basic-info.json`, {
      signal,
      headers: {
        Accept: "application/json",
        "Api-Key": account.fields.apiKey,
        "Api-Username": account.fields.apiUsername,
      },
    });
    await decodeJson(response, object({ title: string() }));
    return { accountInfo: { externalId: `${origin}:${account.fields.apiUsername}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { discourse: discourse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.discourse ?? [],
        (account) => {
          const origin = originOf(account.fields.host);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Discourse",
        description:
          "Manage a Discourse forum: topics, posts, categories, users, groups, badges, tags, search, private messages and site administration.",
        icons,
      },
    ),
  }),
);

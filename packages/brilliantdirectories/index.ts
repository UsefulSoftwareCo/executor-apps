import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  withApprovals,
  secrets,
  string,
} from "apps";
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// The site URL is the full canonical URL as it loads in a browser, for example https://www.mysite.com.
const siteOrigin = (siteUrl: string) => {
  let url: URL;
  try {
    url = new URL(siteUrl.trim());
  } catch {
    throw new Error("Enter the full site URL, for example https://www.mysite.com.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("The site URL must start with https:// or http://.");
  }
  return url.origin;
};

const brilliantdirectories = defineProvider({
  name: "Brilliant Directories",
  auth: {
    // BD Admin > Developer Hub > Generate API Key. The site URL is not secret.
    apiKey: secrets({
      label: "Site URL and API key",
      fields: object({ siteUrl: plain(string({ minLength: 1 })), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    // Read-only: verifies the key against the site.
    const response = await fetch(`${siteOrigin(account.fields.siteUrl)}/api/v2/token/verify`, {
      signal,
      headers: { "X-Api-Key": account.fields.apiKey },
    });
    if (!response.ok) throw new Error(`Brilliant Directories rejected the credentials (${response.status})`);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { brilliantdirectories: brilliantdirectories.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.brilliantdirectories ?? [],
        async (account) => {
          const origin = siteOrigin(account.fields.siteUrl);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Brilliant Directories",
        description:
          "Manage a Brilliant Directories site: members, posts, leads, reviews, categories, plans, pages, redirects, menus, forms, widgets and email templates.",
        icons,
      },
    ),
  }),
);

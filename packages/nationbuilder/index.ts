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

// A nation lives at https://<slug>.nationbuilder.com. Accept the slug, the host or the full URL.
function nationOrigin(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]?)(?:\.nationbuilder\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter your nation slug, the part before .nationbuilder.com.");
  return `https://${match[1]}.nationbuilder.com`;
}

const nationbuilder = defineProvider({
  name: "NationBuilder",
  hosts: ["*.nationbuilder.com"],
  auth: {
    // Settings > Developer > Your apps > an app > Create test token (or an OAuth access token).
    apiKey: secrets({
      label: "Nation slug and API token",
      fields: object({
        nation: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = nationOrigin(account.fields.nation);
    const response = await fetch(`${origin}/api/v2/signups/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: me.data.id, displayName: `NationBuilder (${origin.slice(8)})` } };
  },
});

export default defineApp(
  { user: { accounts: { nationbuilder: nationbuilder.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nationbuilder ?? [],
        (account) => {
          const origin = nationOrigin(account.fields.nation);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "NationBuilder",
        description:
          "NationBuilder V2 API: people (signups), donations, events, lists, pages, paths, automations, tags and the rest of a nation's data.",
        instructions:
          "The API follows JSON:API: filter with filter[attr]=value, trim with fields[type], sideload with include, and page with the links in each response.",
        icons,
      },
    ),
  }),
);

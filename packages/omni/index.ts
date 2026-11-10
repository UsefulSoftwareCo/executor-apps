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

// Every instance lives on its own host: https://<instance>.omniapp.co (the API is under /api).
function apiOrigin(instanceRaw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.omniapp\.co)?(?:\/.*)?$/.exec(
    instanceRaw.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter your Omni instance subdomain (letters, digits, hyphens).");
  return `https://${match[1]}.omniapp.co`;
}

const omni = defineProvider({
  name: "Omni",
  hosts: ["*.omniapp.co"],
  auth: {
    // Organization API key (Settings > API) or a personal access token (Settings > API > Personal access tokens).
    apiKey: secrets({
      label: "API key or personal access token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = apiOrigin(account.fields.subdomain);
    const response = await fetch(`${origin}/api/v1/whoami`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: {
        externalId: new URL(origin).hostname,
        displayName: new URL(origin).hostname,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { omni: omni.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.omni ?? [],
        (account) => {
          const origin = apiOrigin(account.fields.subdomain);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Omni",
        description: "Omni business intelligence: query the semantic layer, manage documents, models, connections, schedules, users, groups, AI and content.",
        icons,
      },
    ),
  }),
);

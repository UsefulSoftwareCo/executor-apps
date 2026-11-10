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

// Every account lives on its own host: https://<subdomain>.kanbanize.com.
function normalizeSubdomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.kanbanize\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.kanbanize.com (letters, digits, hyphens).");
  return match[1]!;
}

const kanbanize = defineProvider({
  name: "Kanbanize",
  hosts: ["*.kanbanize.com"],
  auth: {
    // Keys are per user: avatar menu > My Account > API tab. Sent in the `apikey` header.
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const subdomain = normalizeSubdomain(account.fields.subdomain);
    const response = await fetch(`https://${subdomain}.kanbanize.com/api/v2/me`, {
      signal,
      headers: { apikey: account.fields.token, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ data: object({ user_id: number(), username: string() }) }));
    return {
      accountInfo: {
        externalId: `${subdomain}:${me.data.user_id}`,
        displayName: `${subdomain}.kanbanize.com`,
        username: me.data.username,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { kanbanize: kanbanize.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kanbanize ?? [],
        (account) => {
          const origin = `https://${normalizeSubdomain(account.fields.subdomain)}.kanbanize.com`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v2`,
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
        title: "Kanbanize",
        description:
          "Workspaces, boards, cards, comments, subtasks, users, custom fields, workflows and analytics in Kanbanize (Businessmap).",
        instructions: "Results depend on the permissions of the user who owns the API key.",
        icons,
      },
    ),
  }),
);

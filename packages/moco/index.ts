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

// Every MOCO account lives on its own host: https://<account>.mocoapp.com.
function normalizeAccount(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.mocoapp\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the <account> of <account>.mocoapp.com (letters, digits, hyphens).");
  return match[1]!;
}

const moco = defineProvider({
  name: "Moco",
  hosts: ["*.mocoapp.com"],
  auth: {
    // User API keys (profile > Integrations) and account API keys (Settings > Extensions > API & Webhooks).
    // MOCO publishes no OAuth for third-party apps.
    apiKey: secrets({
      label: "API key",
      fields: object({
        account: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const subdomain = normalizeAccount(account.fields.account);
    const response = await fetch(`https://${subdomain}.mocoapp.com/api/v1/session`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}`, Accept: "application/json" },
    });
    const session = await decodeJson(response, object({ id: number() }));
    return { accountInfo: { externalId: `${subdomain}:${session.id}`, displayName: `${subdomain}.mocoapp.com` } };
  },
});

export default defineApp(
  { user: { accounts: { moco: moco.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.moco ?? [],
        (account) => {
          const origin = `https://${normalizeAccount(account.fields.account)}.mocoapp.com`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api/v1`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Moco",
        description:
          "MOCO business management: projects, tasks, time entries (activities), invoices, offers, expenses, purchases, planning, absences, contacts, deals and staff.",
        instructions:
          "Results depend on the permissions of the API key's owner. Collections are paginated at 100 per page; use the page parameter.",
        icons,
      },
    ),
  }),
);

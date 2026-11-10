import {
  accountRouter,
  boolean,
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

// Every Mihu workspace lives on its own host: https://<subdomain>.mihu.ai.
function normalizeSubdomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.mihu\.ai)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the <subdomain> of <subdomain>.mihu.ai (letters, digits, hyphens).");
  return match[1]!;
}

const mihu = defineProvider({
  name: "Mihu AI",
  hosts: ["*.mihu.ai"],
  auth: {
    // Tokens are minted in the workspace panel (profile menu > Developer) and are bound to one workspace.
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const subdomain = normalizeSubdomain(account.fields.subdomain);
    const response = await fetch(`https://${subdomain}.mihu.ai/api/v1/workspace`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ success: boolean() }));
    return { accountInfo: { externalId: subdomain, displayName: `${subdomain}.mihu.ai` } };
  },
});

export default defineApp(
  { user: { accounts: { mihu: mihu.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mihu ?? [],
        (account) => {
          const origin = `https://${normalizeSubdomain(account.fields.subdomain)}.mihu.ai`;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Mihu AI",
        description:
          "Mihu AI voice and messaging agents: agents, calls, WhatsApp, SMS, email, contacts, campaigns, conversations, phone numbers and workspace administration.",
        instructions:
          "Each account is one Mihu workspace (<subdomain>.mihu.ai); permissions follow the API token. Calls and messages are rate limited to 5 requests per second per workspace.",
        icons,
      },
    ),
  }),
);

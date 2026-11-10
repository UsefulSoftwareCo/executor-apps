import {
  accountRouter,
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

// Every account lives on its own host: https://<account>.centralstationcrm.net.
function originFor(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]?)(?:\.centralstationcrm\.net)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <account> of <account>.centralstationcrm.net (letters, digits, hyphens).");
  return `https://${match[1]}.centralstationcrm.net`;
}

const centralstationcrm = defineProvider({
  name: "CentralStationCRM",
  hosts: ["*.centralstationcrm.net"],
  auth: {
    // Any user creates a personal API key under "My settings"; it is sent in the X-apikey header.
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.subdomain)}/api/check_connection`, {
      signal,
      headers: { "X-apikey": account.fields.token, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`CentralStationCRM rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { centralstationcrm: centralstationcrm.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.centralstationcrm ?? [],
        (account) => {
          const origin = originFor(account.fields.subdomain);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "CentralStationCRM",
        description:
          "CentralStationCRM: people, companies, deals, projects, tasks, notes, tags, calendar events, attachments and users.",
        instructions:
          "The account is the subdomain in your CentralStationCRM URL (<account>.centralstationcrm.net). Lists are paged with page and perpage (max 250); includes and methods add related objects and computed fields. The API allows 50 requests per 10 seconds.",
        icons,
      },
    ),
  }),
);

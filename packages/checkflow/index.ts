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

const origins: Record<string, string> = {
  us: "https://api.checkflow.io",
  eu: "https://api-eu.checkflow.io",
};

function originFor(raw: string): string {
  const origin = origins[raw.trim().toLowerCase()];
  if (!origin) throw new Error("Region must be US or EU.");
  return origin;
}

const checkflow = defineProvider({
  name: "CheckFlow",
  hosts: ["api.checkflow.io", "api-eu.checkflow.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/v3/auth/test`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    if (response.status === 421) {
      throw new Error("Region does not match the workspace; set the region to US or EU to match it.");
    }
    if (!response.ok) throw new Error(`CheckFlow rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { checkflow: checkflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.checkflow ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "CheckFlow",
        description:
          "Run and build CheckFlow checklists: checklists, tasks, templates, data sets, schedules, webhooks, members, groups and tags.",
        instructions:
          "Set the account region to US or EU to match the workspace; a key sent to the other region is refused with WRONG_REGION.",
        icons,
      },
    ),
  }),
);

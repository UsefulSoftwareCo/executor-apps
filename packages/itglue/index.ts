import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
  us: "https://api.itglue.com",
  eu: "https://api.eu.itglue.com",
  au: "https://api.au.itglue.com",
};

function originFor(raw: string): string {
  const origin = origins[raw.trim().toLowerCase()];
  if (origin === undefined) throw new Error("Data center must be one of: us, eu, au.");
  return origin;
}

const itglue = defineProvider({
  name: "IT Glue",
  hosts: ["api.itglue.com", "api.eu.itglue.com", "api.au.itglue.com"],
  auth: {
    // Created in IT Glue under Admin > Settings > API Keys. Keys start with "ITG.".
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/organizations?page[size]=1`, {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/vnd.api+json" },
    });
    await decodeJson(response, json());
  },
});

export default defineApp(
  { user: { accounts: { itglue: itglue.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.itglue ?? [],
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
        title: "IT Glue",
        description:
          "IT documentation in IT Glue: organizations, configurations, flexible assets, passwords, documents, contacts, locations, domains and more.",
        instructions:
          "The account's data center (us, eu or au) selects the IT Glue API host. Responses follow JSON:API; list endpoints return 50 items by default (page[size] up to 1000).",
        icons,
      },
    ),
  }),
);

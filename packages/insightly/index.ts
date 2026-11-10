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

// Pod names look like na1, eu1, au1.
function normalizePod(raw: string): string {
  const match = /^(?:https?:\/\/)?(?:api\.)?([a-z0-9][a-z0-9_-]*?)(?:\.insightly\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter your Insightly pod, for example na1 (see API URL under User Settings).");
  return match[1]!;
}

const insightly = defineProvider({
  name: "Insightly",
  hosts: ["*.insightly.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        pod: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const pod = normalizePod(account.fields.pod);
    const response = await fetch(`https://api.${pod}.insightly.com/v3.1/Users/ME`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.apiKey}:`)}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: pod, displayName: `Insightly (${pod})` } };
  },
});

export default defineApp(
  { user: { accounts: { insightly: insightly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.insightly ?? [],
        (account) => {
          const origin = `https://api.${normalizePod(account.fields.pod)}.insightly.com`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch,
              signal,
              account: { ...account, fields: { ...account.fields, basicCredentials: btoa(`${account.fields.apiKey}:`) } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Insightly",
        description:
          "Insightly CRM: contacts, organizations, leads, opportunities, projects, tasks, events, notes, products, quotes and custom objects.",
        icons,
      },
    ),
  }),
);

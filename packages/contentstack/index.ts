import {
  accountRouter,
  array,
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

// Management API origin per Contentstack region.
const origins: Record<string, string> = {
  na: "https://api.contentstack.io",
  eu: "https://eu-api.contentstack.com",
  au: "https://au-api.contentstack.com",
  "azure-na": "https://azure-na-api.contentstack.com",
  "azure-eu": "https://azure-eu-api.contentstack.com",
  "gcp-na": "https://gcp-na-api.contentstack.com",
  "gcp-eu": "https://gcp-eu-api.contentstack.com",
};

function origin(account: { fields: { region: string } }) {
  const value = origins[account.fields.region.trim().toLowerCase()];
  if (value === undefined) throw new Error(`Enter your Contentstack region: ${Object.keys(origins).join(", ")}.`);
  return value;
}

const Environments = object({ environments: array(object({ name: string() })) });

const contentstack = defineProvider({
  name: "Contentstack",
  hosts: Object.values(origins).map((url) => new URL(url).host),
  auth: {
    apiKey: secrets({
      label: "Stack API key, management token and region",
      fields: object({
        region: plain(string({ minLength: 1 })),
        apiKey: plain(string({ minLength: 1 })),
        managementToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/v3/environments?limit=1`, {
      signal,
      headers: { api_key: account.fields.apiKey, authorization: account.fields.managementToken },
    });
    await decodeJson(response, Environments);
    return { accountInfo: { externalId: account.fields.apiKey, displayName: `Stack ${account.fields.apiKey}` } };
  },
});

export default defineApp(
  { user: { accounts: { contentstack: contentstack.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.contentstack ?? [],
        (account) => {
          const base = origin(account);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Contentstack",
        description:
          "Contentstack Content Management API: content types, entries, assets, environments, releases, workflows, webhooks, roles and users for one stack.",
        icons,
      },
    ),
  }),
);

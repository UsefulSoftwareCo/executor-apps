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
import { regionalOptions, regions, type Region } from "./openapi.js";

// Certn runs isolated regional instances; API keys are per region.
function regionOf(account: { fields: { region: string } }): Region {
  const region = account.fields.region.trim().toLowerCase();
  const found = regions.find((candidate) => candidate === region);
  if (!found) throw new Error(`Region must be one of ${regions.join(", ")} (CA = North America, UK = EMEA, AU = Asia Pacific).`);
  return found;
}

const certn = defineProvider({
  name: "Certn",
  hosts: ["api.ca.certn.co", "api.uk.certn.co", "api.au.certn.co"],
  auth: {
    // Client Portal > Integrations > API keys. The key is shown once; keys expire after one year.
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 2 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const region = regionOf(account);
    const response = await fetch(`https://api.${region}.certn.co/api/public/account/`, {
      signal,
      headers: { Authorization: `Api-Key ${account.fields.apiKey}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: `certn-${region}`, displayName: `Certn (${region.toUpperCase()})` } };
  },
});

export default defineApp(
  { user: { accounts: { certn: certn.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.certn ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...regionalOptions(regionOf(account)), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Certn",
        description:
          "Order and track background checks with Certn: cases, checks, groups, packages, templates, users, files, invoices and events.",
        icons,
        instructions:
          "Certn is regional. Each account is bound to one region (ca, uk or au) and its API keys only work there.",
      },
    ),
  }),
);

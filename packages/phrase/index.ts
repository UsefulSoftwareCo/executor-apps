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
import { optionsFor, regions, type Region } from "./openapi.js";

function regionOf(account: { fields: { region: string } }): Region {
  const region = account.fields.region.trim().toLowerCase();
  if (region !== "eu" && region !== "us")
    throw new Error('Region must be "eu" (api.phrase.com) or "us" (api.us.app.phrase.com).');
  return region;
}

const phrase = defineProvider({
  name: "Phrase",
  hosts: ["api.phrase.com", "api.us.app.phrase.com"],
  auth: {
    // Profile settings > Access tokens in Phrase Strings.
    apiKey: secrets({
      label: "Access token",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${regions[regionOf(account)]}/v2/user`, {
      signal,
      headers: { Authorization: `token ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

export default defineApp(
  { user: { accounts: { phrase: phrase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.phrase ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...optionsFor(regionOf(account)), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Phrase",
        description:
          "Manage localization in Phrase Strings: projects, locales, keys, translations, uploads, jobs, glossaries and webhooks.",
        icons,
      },
    ),
  }),
);

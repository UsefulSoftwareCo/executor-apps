import {
  accountRouter,
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
import { dataCenters, optionsFor, type DataCenter } from "./openapi.js";

// "us" (api.iterable.com) or "eu" (api.eu.iterable.com); a project lives in exactly one.
function dataCenterOf(account: { fields: { dataCenter: string } }): DataCenter {
  const value = account.fields.dataCenter.trim().toLowerCase();
  if (value !== "us" && value !== "eu") throw new Error('Set the data center to "us" or "eu".');
  return value;
}

const iterable = defineProvider({
  name: "Iterable",
  hosts: ["api.iterable.com", "api.eu.iterable.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), dataCenter: plain(string({ minLength: 1 })) }),
    }),
  },
  // GET /api/channels is authenticated and read-only; 401 means an invalid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${dataCenters[dataCenterOf(account)]}/api/channels`, {
      signal,
      headers: { "Api-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Iterable rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { iterable: iterable.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.iterable ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...optionsFor(dataCenterOf(account)), cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Iterable",
        description:
          "Manage Iterable users, lists, campaigns, templates, catalogs, journeys, events, in-app messages and data exports.",
        icons,
      },
    ),
  }),
);

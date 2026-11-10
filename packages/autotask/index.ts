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

// Each Autotask database lives on one zone host: https://webservices<N>.autotask.net.
function normalizeZone(raw: string): string {
  const match = /^(?:https?:\/\/)?(webservices[a-z0-9]+)(?:\.autotask\.net)?(?:\/.*)?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the zone host, for example webservices5 (webservices5.autotask.net).");
  return match[1]!;
}

const autotask = defineProvider({
  name: "Autotask",
  hosts: ["*.autotask.net"],
  auth: {
    // Created in Autotask under Admin > Resources (Users) > API User; the integration code comes
    // from the API user's "API Tracking Identifier". Autotask offers no OAuth.
    apiKey: secrets({
      label: "API user",
      fields: object({
        zone: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        integrationCode: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const zone = normalizeZone(account.fields.zone);
    const response = await fetch(`https://${zone}.autotask.net/ATServicesRest/V1.0/Companies/entityInformation`, {
      signal,
      headers: {
        ApiIntegrationCode: account.fields.integrationCode,
        UserName: account.fields.username,
        Secret: account.fields.secret,
        Accept: "application/json",
      },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: `${zone}:${account.fields.username}`, displayName: account.fields.username } };
  },
});

export default defineApp(
  { user: { accounts: { autotask: autotask.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.autotask ?? [],
        (account) => {
          const origin = `https://${normalizeZone(account.fields.zone)}.autotask.net`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/ATServicesRest`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Autotask",
        description:
          "Autotask PSA tickets, companies, contacts, contracts, projects, tasks, time entries, configuration items and the rest of the REST API.",
        instructions:
          "Results depend on the security level of the API user. Query endpoints take a JSON filter; entityInformation endpoints list an entity's fields.",
        icons,
      },
    ),
  }),
);

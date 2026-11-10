import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  number,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ data: object({ id: number(), name: string() }) });

const pipedrive = defineProvider({
  name: "Pipedrive",
  hosts: ["api.pipedrive.com"],
  auth: {
    token: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Pipedrive has no client registration: the connect page asks for the client of an app
    // created in the Developer Hub. Scopes are fixed on the app, not requested at sign-in.
    oauth: oauth2({
      authorizationUrl: "https://oauth.pipedrive.com/oauth/authorize",
      tokenUrl: "https://oauth.pipedrive.com/oauth/token",
      revocationUrl: "https://oauth.pipedrive.com/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "x-api-token": `${account.fields.token}` };
    const response = await fetch("https://api.pipedrive.com/v1/users/me", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.data.id), username: me.data.name } };
  },
});

export default defineApp(
  { user: { accounts: { pipedrive: pipedrive.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pipedrive ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pipedrive",
        description:
          "Deals, persons, organizations, leads, activities, pipelines, products and the rest of the Pipedrive CRM REST API.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, regions } from "./openapi.js";

const Me = object({ data: object({ id: number(), name: string() }) });

// Clio apps are registered per region and take no scopes: permissions are set on the app.
const region = (host: string) =>
  oauth2({
    authorizationUrl: `https://${host}/oauth/authorize`,
    tokenUrl: `https://${host}/oauth/token`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopes: [],
  });

const clio = defineProvider({
  name: "Clio Manage",
  hosts: ["app.clio.com", "eu.app.clio.com", "ca.app.clio.com", "au.app.clio.com"],
  auth: {
    oauth: region("app.clio.com"),
    oauthEu: region("eu.app.clio.com"),
    oauthCa: region("ca.app.clio.com"),
    oauthAu: region("au.app.clio.com"),
  },
  async health({ account, fetch, signal }) {
    const origin = regions[account.method];
    const response = await fetch(`${origin}/api/v4/users/who_am_i.json?fields=id,name`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.data.id), username: me.data.name } };
  },
});

export default defineApp(
  { user: { accounts: { clio: clio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clio ?? [],
        (account) => {
          const origin = regions[account.method];
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api/v4`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Clio Manage",
        description:
          "Contacts, matters, activities and time entries, calendar, tasks, bills, trust accounting, documents and communications in Clio Manage.",
        instructions:
          "Connect with the OAuth method for the region your Clio account lives in (US, EU, Canada or Australia). Most list tools take a `fields` parameter naming the columns to return.",
        icons,
      },
    ),
  }),
);

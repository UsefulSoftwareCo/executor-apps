import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const Profile = object({ sub: string() });

const autodesk = defineProvider({
  name: "Autodesk",
  hosts: ["developer.api.autodesk.com", "api.userprofile.autodesk.com"],
  auth: {
    // Users register their own APS app (type: Traditional Web App); the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://developer.api.autodesk.com/authentication/v2/authorize",
      tokenUrl: "https://developer.api.autodesk.com/authentication/v2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "data:read",
        "data:write",
        "data:create",
        "data:search",
        "bucket:create",
        "bucket:read",
        "bucket:update",
        "bucket:delete",
        "viewables:read",
        "account:read",
        "account:write",
        "user-profile:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.userprofile.autodesk.com/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Profile);
    return { accountInfo: { externalId: me.sub } };
  },
});

export default defineApp(
  { user: { accounts: { autodesk: autodesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.autodesk ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              dataManagement: mount(apis.dataManagement),
              oss: mount(apis.oss),
              modelDerivative: mount(apis.modelDerivative),
              webhooks: mount(apis.webhooks),
              issues: mount(apis.issues),
              accountAdmin: mount(apis.accountAdmin),
            },
            { title: "Autodesk", description: "Autodesk Platform Services." },
          );
        },
        { signal },
      ),
      {
        title: "Autodesk",
        description:
          "Autodesk Platform Services. dataManagement: hubs, projects, folders, items, versions. oss: Object Storage buckets and objects. modelDerivative: translate and inspect design files. webhooks: event subscriptions. issues: Autodesk Construction Cloud issues. accountAdmin: ACC projects, users, companies.",
        icons,
      },
    ),
  }),
);

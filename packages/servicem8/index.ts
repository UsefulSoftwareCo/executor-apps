import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, scopes } from "./openapi.js";

const servicem8 = defineProvider({
  name: "ServiceM8",
  hosts: ["api.servicem8.com", "go.servicem8.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Named like the OpenAPI scheme it fills. The connect page asks for the add-on's App ID and App Secret.
    oauth2: oauth2({
      authorizationUrl: "https://go.servicem8.com/oauth/authorize",
      tokenUrl: "https://go.servicem8.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes,
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth2"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Api-Key": `${account.fields.token}` };
    const response = await fetch("https://api.servicem8.com/api_1.0/vendor.json", { signal, headers });
    await decodeJson(response, array(object({ name: string() })));
  },
});

export default defineApp(
  { user: { accounts: { servicem8: servicem8.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.servicem8 ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ServiceM8",
        description:
          "Field service jobs, clients, quotes, invoices, scheduling, staff, assets, attachments and messaging in ServiceM8.",
        icons,
      },
    ),
  }),
);

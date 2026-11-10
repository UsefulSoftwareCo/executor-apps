import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Users = object({});

const boldsign = defineProvider({
  name: "BoldSign",
  hosts: ["api.boldsign.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // BoldSign does not support dynamic client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://account.boldsign.com/connect/authorize",
      tokenUrl: "https://account.boldsign.com/connect/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        "BoldSign.Documents.All",
        "BoldSign.Templates.All",
        "BoldSign.Users.All",
        "BoldSign.Teams.All",
        "BoldSign.SenderIdentity.All",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-API-KEY": account.fields.token };
    const response = await fetch("https://api.boldsign.com/v1/users/list?Page=1&PageSize=1", { signal, headers });
    await decodeJson(response, Users);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { boldsign: boldsign.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.boldsign ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "BoldSign",
        description:
          "Send documents for eSignature, manage templates, contacts, users, teams, brands, sender identities and embedded signing.",
        icons,
      },
    ),
  }),
);

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

const Company = object({ id: string(), name: string() });

const companycam = defineProvider({
  name: "CompanyCam",
  hosts: ["api.companycam.com", "app.companycam.com"],
  auth: {
    accessToken: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Legacy-API OAuth 2.0 (https://companycam.readme.io/docs/oauth). Apps are created at
    // https://app.companycam.com/access-keys/applications.
    oauth: oauth2({
      authorizationUrl: "https://app.companycam.com/oauth/authorize",
      tokenUrl: "https://app.companycam.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: ["read", "write", "destroy"],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.companycam.com/v2/company", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const company = await decodeJson(response, Company);
    return { accountInfo: { externalId: company.id, username: company.name } };
  },
});

const description =
  "Projects, photos, videos, documents, checklists, users, groups, tags and webhooks in CompanyCam.";

export default defineApp(
  { user: { accounts: { companycam: companycam.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.companycam ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { title: "CompanyCam", description, icons },
    ),
  }),
);

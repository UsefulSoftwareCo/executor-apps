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

const Me = object({ data: object({ id: string() }) });

const nusii = defineProvider({
  name: "Nusii proposals",
  hosts: ["app.nusii.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Nusii publishes OAuth server metadata with dynamic client registration.
    oauth: oauth2({ discover: "https://app.nusii.com", scopes: ["read", "write"] }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Token token=${account.fields.token}`;
    const response = await fetch("https://app.nusii.com/api/v2/account/me", {
      signal,
      headers: { Authorization: authorization, Accept: "application/vnd.api+json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.data.id } };
  },
});

export default defineApp(
  { user: { accounts: { nusii: nusii.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nusii ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Nusii proposals",
        description:
          "Proposals, clients, sections, line items, templates, taxations, themes, users and webhook endpoints in Nusii.",
        icons,
      },
    ),
  }),
);

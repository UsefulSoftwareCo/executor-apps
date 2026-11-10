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
import { options } from "./openapi.js";

const Me = object({ id: string() });

const liveswitch = defineProvider({
  name: "LiveSwitch",
  hosts: ["public-api.production.liveswitch.com", "id.liveswitch.com"],
  auth: {
    // LiveSwitch issues client credentials per developer app (email integrations@liveswitch.com).
    oauth: oauth2({
      authorizationUrl: "https://id.liveswitch.com/authorize",
      tokenUrl: "https://id.liveswitch.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      authorizationParams: { audience: "https://public-api.production.liveswitch.com/" },
      scopes: [
        "offline_access",
        "openid",
        "profile",
        "email",
        "me",
        "accounts",
        "contacts",
        "contacts.write",
        "conversations",
        "conversations.write",
        "organizations",
        "organizations.write",
        "webhooks",
        "webhooks.write",
        "projects",
        "projects.write",
        "recordings",
        "documents",
        "forms",
        "guided-instructions",
        "sparks",
        "sparks.write",
        "spark-templates",
        "tags",
        "tags.write",
        "attributes",
        "attributes.write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://public-api.production.liveswitch.com/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { liveswitch: liveswitch.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.liveswitch ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LiveSwitch",
        description:
          "Contacts, conversations, projects, recordings, documents, webhooks, tags, attributes and Sparks in LiveSwitch.",
        icons,
      },
    ),
  }),
);

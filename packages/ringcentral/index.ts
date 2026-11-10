import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Extension = object({ id: number() });

const ringcentral = defineProvider({
  name: "RingCentral",
  hosts: ["platform.ringcentral.com"],
  auth: {
    // RingCentral offers no client registration: the connect page asks for the app's client.
    oauth: oauth2({
      authorizationUrl: "https://platform.ringcentral.com/restapi/oauth/authorize",
      tokenUrl: "https://platform.ringcentral.com/restapi/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "ReadAccounts",
        "ReadContacts",
        "Contacts",
        "ReadCallLog",
        "ReadCallRecording",
        "ReadMessages",
        "EditMessages",
        "SMS",
        "Faxes",
        "RingOut",
        "ReadPresence",
        "EditPresence",
        "Meetings",
        "TeamMessaging",
        "Voicemail",
        "ReadClientInfo",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      "https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~",
      { signal, headers: { Authorization: `Bearer ${account.fields.access_token}` } },
    );
    const me = await decodeJson(response, Extension);
    return { accountInfo: { externalId: String(me.id) } };
  },
});

export default defineApp(
  { user: { accounts: { ringcentral: ringcentral.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ringcentral ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "RingCentral",
        description:
          "Calls, SMS, voicemail, fax, call logs, presence, meetings, team messaging and account administration.",
        icons,
      },
    ),
  }),
);

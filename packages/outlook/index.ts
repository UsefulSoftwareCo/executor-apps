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

const outlook = defineProvider({
  name: "Outlook",
  hosts: ["graph.microsoft.com"],
  auth: {
    // Microsoft Entra v2 publishes OIDC metadata; the connect page asks for an app registration's client.
    oauth: oauth2({
      discover: "https://login.microsoftonline.com/common/v2.0",
      scopes: [
        "offline_access",
        "User.Read",
        "Mail.ReadWrite",
        "Mail.Send",
        "MailboxSettings.ReadWrite",
        "Calendars.ReadWrite",
        "Contacts.ReadWrite",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { outlook: outlook.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.outlook ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Outlook",
        description:
          "Outlook mail, mail folders, calendars, events, meeting times and contacts of the signed-in user, through Microsoft Graph.",
        icons,
      },
    ),
  }),
);

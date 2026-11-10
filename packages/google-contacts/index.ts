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
import { addresses } from "./tools/shared.js";
import { contacts as contactsTools } from "./tools/people.js";
import { options } from "./openapi.js";

const UserInfo = object({ sub: string() });

const googleContacts = defineProvider({
  name: "Google Contacts",
  hosts: ["people.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/contacts.other.readonly",
        "https://www.googleapis.com/auth/directory.readonly",
      ],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, UserInfo);
    return { accountInfo: { externalId: me.sub } };
  },
});

export default defineApp(
  { user: { accounts: { googleContacts: googleContacts.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const curated = contactsTools({ accounts: user?.accounts.googleContacts ?? [], address: addresses.userinfo("https://openidconnect.googleapis.com/v1/userinfo"), api: () => "api" });
    return {
      tools: router(
        {
          ...curated.tools,
          api: router(
            await accountRouter(
              user?.accounts.googleContacts ?? [],
              (account) =>
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              { signal },
            ),
            {
              title: "Google Contacts API",
              description: "The complete Google Contacts API, per account: every tool takes accountId and the API's own input.",
            },
          ),
        },
        {
          instructions: curated.meta.instructions,
          title: "Google Contacts",
          description:
            "Search, read, create, update and delete Google Contacts, contact groups and other contacts, and search the Google Workspace directory.",
          icons,
        },
      ),
    };
  },
);

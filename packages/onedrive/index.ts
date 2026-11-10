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

const onedrive = defineProvider({
  name: "OneDrive",
  hosts: ["graph.microsoft.com"],
  auth: {
    // Microsoft Entra v2 publishes OIDC metadata; the connect page asks for an app registration's client.
    oauth: oauth2({
      discover: "https://login.microsoftonline.com/common/v2.0",
      scopes: [
        "offline_access",
        "User.Read",
        "Files.ReadWrite.All",
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
  { user: { accounts: { onedrive: onedrive.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onedrive ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OneDrive",
        description:
          "OneDrive files and folders through Microsoft Graph: drives, listing and searching items, upload, download, copy, move, delete, share links, invitations, permissions, versions, check-in/out, recent and followed items, and shared items. Call the drive tool for the user's drive id, get the root item id from the drive root tool, then list children. Drive and item ids come from those responses.",
        icons,
      },
    ),
  }),
);

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

const excel = defineProvider({
  name: "Excel",
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
  { user: { accounts: { excel: excel.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.excel ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Excel",
        description:
          "Excel workbooks stored in OneDrive or SharePoint, through Microsoft Graph: worksheets, ranges, tables, charts, named items, comments and calculation sessions. Every workbook call needs a drive-id and driveItem-id. Get the drive-id from meDrive.meGetDrive (/me/drive), then find the file with drivesDriveFunctions.drivesSearch (search by name), drivesDriveFunctions.drivesRecent, or by walking folders with drivesDriveItem.drivesItemsListChildren (the root driveItem-id is the drive's `root` id).",
        icons,
      },
    ),
  }),
);

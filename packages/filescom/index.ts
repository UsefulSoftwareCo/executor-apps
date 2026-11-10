import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Files.com site lives on its own host: https://<site>.files.com.
function siteHost(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.files\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the site name of <site>.files.com (letters, digits, hyphens).");
  return `${match[1]}.files.com`;
}

const mcpUrl = (fields: { site: string }) => `https://${siteHost(fields.site)}/api/ai/mcp/v1/`;

const headers = (account: { fields: { apiKey: string } }) => ({ "X-FilesAPI-Key": account.fields.apiKey });

const filescom = defineProvider({
  name: "Files.com",
  hosts: ["*.files.com"],
  auth: {
    // API key sent as X-FilesAPI-Key. Files.com's hosted MCP server also offers OAuth sign-in, but
    // its metadata is per site, which the static oauth2 declaration cannot express.
    apiKey: secrets({
      label: "API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl(check.account.fields), headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { filescom: filescom.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.filescom ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url: mcpUrl(account.fields), account, headers: headers(account), signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Files.com",
        description:
          "Files.com cloud file storage and managed file transfer: files and folders, share links, users, groups, permissions, automations and logs.",
        instructions: "Results depend on the permissions of the user who owns the API key.",
        icons,
      },
    ),
  }),
);

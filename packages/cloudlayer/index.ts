import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.cloudlayer.io/mcp";

const cloudlayer = defineProvider({
  name: "Cloudlayer",
  hosts: ["mcp.cloudlayer.io"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration (S256 PKCE); it advertises no scopes.
    oauth: oauth2({ discover: "https://mcp.cloudlayer.io" }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { cloudlayer: cloudlayer.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudlayer ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.access_token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Cloudlayer",
        description:
          "Generate PDFs and images from URLs, HTML and templates, convert DOCX and PDF files, merge PDFs, and manage jobs, assets and storage in cloudlayer.io.",
        icons,
      },
    ),
  }),
);

import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.sanity.io";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Sanity API tokens and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

// Mutating tools named in the Sanity MCP docs. Forced to mutations so they never rely on an upstream readOnlyHint.
const mutating = [
  "create_documents", "patch_documents", "publish_documents", "unpublish_documents", "discard_drafts",
  "version_discard", "create_release", "deploy_schema", "deploy_studio", "create_project", "create_dataset",
  "update_dataset", "add_cors_origin", "cors_origins_delete", "dataset_assets_upload_from_url",
  "dataset_assets_upload_from_file", "dataset_assets_upload_from_web_chatgpt", "media_library_upload_from_url",
  "media_library_create_documents", "media_library_patch_documents", "media_library_publish_documents",
  "media_library_discard_drafts", "media_library_link_assets", "generate_image", "transform_image", "run_sanity_cli",
];
const kinds = Object.fromEntries(mutating.map((name) => [name, "mutation" as const]));

const sanityMcp = defineProvider({
  name: "Sanity",
  hosts: ["mcp.sanity.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Sanity MCP advertises dynamic client registration (PKCE S256).
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { sanityMcp: sanityMcp.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sanityMcp ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }, kinds), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Sanity",
        description: "Sanity content platform: projects, datasets, schemas, GROQ queries, documents, releases and Studio content operations.",
        icons,
      },
    ),
  }),
);

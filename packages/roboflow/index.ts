import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.roboflow.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The 401 challenge and protected-resource metadata list these scopes but omit
// offline_access, which only the authorization-server metadata advertises.
// Roboflow issues refresh tokens (grant_types_supported includes refresh_token)
// only when offline_access is requested, so request it explicitly; otherwise
// connections would expire without refresh.
const scopes = [
  "workspace:read",
  "project:create",
  "project:read",
  "project:update",
  "workflow:create",
  "workflow:read",
  "workflow:update",
  "folder:create",
  "folder:read",
  "folder:update",
  "folder:delete",
  "image:create",
  "image:read",
  "image:tag",
  "image:annotate",
  "model:infer",
  "model:deploy",
  "model:manage",
  "model:compile",
  "model-eval:read",
  "workflow-evals:read",
  "workflow-evals:write",
  "workflow-evals:run",
  "workflow-evals:export",
  "device:read",
  "device:update",
  "vision-events:read",
  "vision-events:write",
  "vision-events:manage",
  "workspace-stats:read",
  "batch:create",
  "batch:read",
  "batch:admin-read",
  "batch:update",
  "batch:delete",
  "version:create",
  "version:read",
  "version:update",
  "training-job:create",
  "annotation-job:create",
  "annotation-job:read",
  "annotation-job:update",
  "annotation-job:submit-review",
  "annotation-job:review",
  "annotation-job:return-edits",
  "annotation-job:accept",
  "annotation-job:delete-annotations",
  "annotation-job:delete",
  "video-inference-job:create",
  "video-inference-job:read",
  "integration:create",
  "integration:delete",
  "credentials:create",
  "credentials:read",
  "credentials:update",
  "credentials:delete",
  "api-key:read",
  "api-key:create",
  "api-key:update",
  "api-key:revoke",
  "datasource:bucket-mirror:read",
  "datasource:bucket-mirror:write",
  "datasource:bucket-mirror:trigger",
  "data-staging:read",
  "data-staging:write",
  "data-staging:delete",
  "batch-processing:read",
  "batch-processing:trigger",
  "openid",
  "profile",
  "email",
  "offline_access",
];

const roboflow = defineProvider({
  name: "Roboflow",
  hosts: ["mcp.roboflow.com", "app.roboflow.com"],
  auth: {
    // The MCP server advertises dynamic client registration; its authorization
    // server is https://app.roboflow.com.
    oauth: oauth2({ discover: url, scopes }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { roboflow: roboflow.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.roboflow ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Roboflow",
        description: "Computer vision projects, images, annotation, training, Workflows and deployments in Roboflow.",
        icons,
      },
    ),
  }),
);

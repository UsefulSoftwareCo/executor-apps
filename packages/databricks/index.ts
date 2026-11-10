import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Workspace hostnames: AWS `<deployment>.cloud.databricks.com`, Azure `adb-<id>.<n>.azuredatabricks.net`,
// GCP `<id>.<n>.gcp.databricks.com`. Credentials only go to the hosts declared below.
const hostPattern =
  /^[a-z0-9][a-z0-9_-]*(\.\d{1,2})?\.(cloud\.databricks\.com|azuredatabricks\.net|gcp\.databricks\.com)$/;

function origin(account: { fields: { workspace: string } }) {
  const host = account.fields.workspace
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "");
  if (!hostPattern.test(host))
    throw new Error(
      "Enter your Databricks workspace hostname, for example dbc-a1b2345c-d6e7.cloud.databricks.com or adb-1234567890123456.7.azuredatabricks.net.",
    );
  return `https://${host}`;
}

// Azure and GCP workspace hosts carry a numeric label; a wildcard matches one level, so list them.
const numbered = Array.from({ length: 100 }, (_, n) => n).flatMap((n) => [
  `*.${n}.azuredatabricks.net`,
  `*.${n}.gcp.databricks.com`,
]);

const databricks = defineProvider({
  name: "Databricks",
  hosts: ["*.cloud.databricks.com", "*.azuredatabricks.net", ...numbered],
  auth: {
    // Workspace OAuth endpoints are per workspace (<workspace>/oidc/v1/authorize and /token) and the
    // oauth2 declaration takes static URLs, so only personal access tokens are offered.
    token: secrets({
      label: "Personal access token",
      fields: object({
        workspace: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/2.0/preview/scim/v2/Me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string(), userName: string() }));
    return {
      accountInfo: { externalId: `${new URL(base).hostname}:${me.id}`, username: me.userName, displayName: new URL(base).hostname },
    };
  },
});

export default defineApp(
  { user: { accounts: { databricks: databricks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.databricks ?? [],
        (account) => {
          const base = origin(account);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Databricks",
        description:
          "Run SQL and manage clusters, jobs, pipelines, SQL warehouses, Unity Catalog, workspace files, Genie, model serving, vector search and more in a Databricks workspace.",
        instructions:
          "Run SQL with `sql.executeStatement` (needs a `warehouse_id` from `sql.listWarehouses`); results over the wait timeout return a statement_id to poll with `sql.getStatement`. Unity Catalog three-part names are passed as `full_name` (catalog.schema.table). Job and run ids are integers.",
        icons,
      },
    ),
  }),
);

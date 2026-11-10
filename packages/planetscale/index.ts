import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";


const planetscale = defineProvider({
  name: "PlanetScale",
  hosts: ["api.planetscale.com", "app.planetscale.com", "auth.planetscale.com"],
  auth: {
    token: secrets({
      label: "Service token",
      fields: object({
        // Sent verbatim as the Authorization header.
        token: string({ minLength: 3 }),
      }),
    }),
    oauth2: oauth2({
      discover: "https://api.planetscale.com",
      scopes: [
        "read_user",
        "read_organization",
        "write_organization",
        "read_databases",
        "write_databases",
        "organization:create_databases",
        "organization:delete_databases",
        "organization:read_databases",
        "organization:write_databases",
        "organization:read_branches",
        "organization:write_branches",
        "organization:delete_branches",
        "organization:read_deploy_requests",
        "organization:write_deploy_requests",
        "organization:approve_deploy_requests",
        "organization:deploy_deploy_requests",
        "organization:read_comments",
        "organization:write_comments",
        "organization:read_backups",
        "organization:write_backups",
        "organization:delete_backups",
        "organization:restore_backups",
        "organization:manage_passwords",
        "organization:manage_read_only_passwords",
        "organization:read_members",
        "organization:read_workflows",
        "organization:write_workflows",
        "organization:read_audit_logs",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth2" ? `Bearer ${account.fields.access_token}` : account.fields.token;
    const response = await fetch("https://api.planetscale.com/v1/organizations?per_page=1", {
      signal,
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    const list = await decodeJson(
      response,
      object({ data: array(object({ id: string(), name: string() })) }),
    );
    const organization = list.data[0];
    if (!organization) throw new Error("PlanetScale credential has access to no organizations");
    return { accountInfo: { externalId: organization.id, username: organization.name } };
  },
});

export default defineApp(
  { user: { accounts: { planetscale: planetscale.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.planetscale ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PlanetScale",
        description:
          "PlanetScale organizations, databases, branches, deploy requests, backups, passwords, workflows and Insights.",
        icons,
      },
    ),
  }),
);

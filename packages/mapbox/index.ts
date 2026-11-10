import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.mapbox.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "token"; fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const mapbox = defineProvider({
  name: "Mapbox",
  hosts: ["mcp.mapbox.com", "api.mapbox.com"],
  auth: {
    // Documented in mapbox/mcp-server docs/hosted-mcp-guide.md (sections 3.2 and 4): `authorization: Bearer <access token>`.
    token: secrets({
      label: "Mapbox access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { mapbox: mapbox.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mapbox ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Mapbox",
        description: "Mapbox geocoding and search, directions, matrix, isochrones, map matching, static maps and geospatial calculations.",
        icons,
      },
    ),
  }),
);

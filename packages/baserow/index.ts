import {
  accountRouter,
  defineApp,
  defineProvider,
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

const baserow = defineProvider({
  name: "Baserow",
  hosts: ["api.baserow.io"],
  auth: {
    apiKey: secrets({
      label: "Database token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Baserow's token check answers 200 with no body, or 403 for an invalid token.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.baserow.io/api/database/tokens/check/", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Baserow rejected the database token (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { baserow: baserow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.baserow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Baserow",
        description: "Work with Baserow databases through a database token: rows (CRUD, batch, move), field list/create, table list, file uploads, plus other API operations that need other credentials.",
        instructions:
          "A database token only authorizes row operations on the tables it was granted, listing and creating fields for a table, listing all tables, the token check and user-file uploads. Getting, updating or deleting a field by id, and table, database, view and workspace management, need a JWT and will be rejected. Public-view, application-builder and similar operations take no database token.",
        icons,
      },
    ),
  }),
);

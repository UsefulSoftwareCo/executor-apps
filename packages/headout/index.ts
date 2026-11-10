import { defineApp, router, toolAnnotations, withApprovals } from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Public server: it answers without credentials, so no account is declared.
const url = "https://aviator.headout.com/mcp/";

export default defineApp({ user: { accounts: {} }, icons }, async ({ signal }) => ({
  tools: router(
    withApprovals(
      await mcpRouter({ url, ...(signal === undefined ? {} : { signal }) }),
      (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
    ),
    {
      title: "Headout",
      description: "Search Headout tours, attractions and experiences worldwide by query or curated collection.",
      icons,
    },
  ),
}));

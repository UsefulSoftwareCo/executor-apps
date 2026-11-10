import { defineApp, router, toolAnnotations, withApprovals } from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Public server: it answers without credentials, so no account is declared.
const url = "https://inspomcp.dev/api/mcp";

export default defineApp({ user: { accounts: {} }, icons }, async ({ signal }) => ({
  tools: router(
    withApprovals(
      await mcpRouter({ url, ...(signal === undefined ? {} : { signal }) }),
      (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
    ),
    {
      title: "Inspo",
      description: "Search real website screenshots, design systems, color palettes, typography and reference components for design inspiration.",
      icons,
    },
  ),
}));

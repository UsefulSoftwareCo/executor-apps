import { defineApp, router, toolAnnotations, withApprovals } from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Public server: it answers without credentials, so no account is declared.
const url = "https://mcp.pophive.org/mcp";

export default defineApp({ user: { accounts: {} }, icons }, async ({ signal }) => ({
  tools: router(
    withApprovals(
      await mcpRouter({ url, ...(signal === undefined ? {} : { signal }) }),
      (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
    ),
    {
      title: "PopHIVE",
      description: "Yale's harmonized US public health surveillance data: disease, vaccination and health outcome trends.",
      icons,
    },
  ),
}));

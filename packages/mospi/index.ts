import { defineApp, router, toolAnnotations, withApprovals } from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Public server: it answers without credentials, so no account is declared.
const url = "https://mcp.mospi.gov.in/";

export default defineApp({ user: { accounts: {} }, icons }, async ({ signal }) => ({
  tools: router(
    withApprovals(
      await mcpRouter({ url, ...(signal === undefined ? {} : { signal }) }),
      (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
    ),
    {
      title: "MoSPI",
      description: "India's official statistics (employment, inflation, GDP, industry, energy and more) from the Ministry of Statistics and Programme Implementation.",
      icons,
      instructions: "Use the tools in order: list_datasets, get_indicators, get_metadata, then get_data.",
    },
  ),
}));

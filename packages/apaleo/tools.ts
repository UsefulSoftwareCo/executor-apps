// Compiles every Apaleo API area and prints the total. scripts/check.sh only compiles `options` (booking),
// so run this for the full count: node packages/apaleo/tools.ts
import { openapiToolNames } from "apps/openapi";
import { areaOptions, areas, type Area } from "./openapi.ts";

let total = 0;
let failed = false;
for (const area of Object.keys(areas) as Area[]) {
  try {
    const { tools, skipped } = await openapiToolNames(areaOptions(area));
    const mutations = tools.filter((tool) => tool.kind === "mutation").length;
    console.log(`apaleo/${area}: ${tools.length} tools (${mutations} mutations), ${skipped.length} skipped`);
    total += tools.length;
    if (tools.length === 0 || skipped.length > 0) failed = true;
  } catch (error) {
    failed = true;
    console.log(`apaleo/${area}: FAILED ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`apaleo: ${total} tools across ${Object.keys(areas).length} areas`);
process.exitCode = failed ? 1 : 0;

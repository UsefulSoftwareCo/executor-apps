// Run: node scripts/tools.ts is not enough, because it compiles only the default mount. This compiles every mount and
// fails when a kinds key matches no operation (operationId, or generated tool name when there is none).
// Usage: node packages/here/kinds-check.ts
import { openapiToolNames } from "apps/openapi";
import { apis } from "./openapi.ts";

let failed = false;
let total = 0;
let mutations = 0;
for (const [mount, options] of Object.entries(apis)) {
  const { tools, skipped } = await openapiToolNames(options);
  total += tools.length;
  mutations += tools.filter((tool) => tool.kind === "mutation").length;
  const known = new Set(tools.map((tool) => tool.operationId ?? tool.name));
  for (const key of Object.keys(options.kinds)) {
    if (!known.has(key)) {
      failed = true;
      console.log(`here/${mount}: kinds key "${key}" matches no operation`);
    }
  }
  if (skipped.length > 0) console.log(`here/${mount}: ${skipped.length} skipped`);
}
console.log(`here: ${total} tools (${mutations} mutations)`);
process.exitCode = failed ? 1 : 0;

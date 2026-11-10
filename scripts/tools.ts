// Lists the tools each OpenAPI package generates, without an account.
// Usage: node scripts/tools.ts [package...] [--names]
import { readdirSync, existsSync } from "node:fs";
import { openapiToolNames } from "apps/openapi";

const args = process.argv.slice(2);
const names = args.includes("--names");
const wanted = args.filter((arg) => !arg.startsWith("--"));
const packages = wanted.length > 0 ? wanted : readdirSync("packages");
let failed = false;
for (const name of packages) {
  const file = new URL(`../packages/${name}/openapi.ts`, import.meta.url);
  if (!existsSync(file)) continue;
  const { options } = await import(file.href);
  try {
    const { tools, skipped } = await openapiToolNames(options);
    const reasons = new Map<string, number>();
    for (const item of skipped) reasons.set(item.code, (reasons.get(item.code) ?? 0) + 1);
    const mutations = tools.filter((tool) => tool.kind === "mutation").length;
    console.log(
      `${name}: ${tools.length} tools (${mutations} mutations), ${skipped.length} skipped` +
        (reasons.size > 0 ? ` ${JSON.stringify(Object.fromEntries(reasons))}` : ""),
    );
    if (tools.length === 0) failed = true;
    if (names) for (const tool of tools) console.log(`  ${tool.name} ${tool.method} ${tool.path}`);
  } catch (error) {
    failed = true;
    console.log(`${name}: FAILED ${error instanceof Error ? error.message : String(error)}`);
  }
}
process.exitCode = failed ? 1 : 0;

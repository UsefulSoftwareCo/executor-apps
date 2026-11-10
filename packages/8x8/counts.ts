// Development aid: node packages/8x8/counts.ts [--names]. Compiles every mounted spec and prints tool and skip counts.
import { openapiToolNames } from "apps/openapi";
const all: Record<string, unknown> = await import(new URL("./openapi.ts", import.meta.url).href);

const names = process.argv.includes("--names");
let total = 0;
for (const [key, options] of Object.entries(all)) {
  if (!key.endsWith("Options")) continue;
  let result;
  try {
    result = await openapiToolNames(options as never);
  } catch (error) {
    console.log(`${key}: FAILED ${JSON.stringify(error)}`);
    continue;
  }
  const { tools, skipped } = result;
  const reasons: Record<string, number> = {};
  for (const item of skipped) reasons[item.code] = (reasons[item.code] ?? 0) + 1;
  console.log(`${key}: ${tools.length} tools, ${skipped.length} skipped ${JSON.stringify(reasons)}`);
  if (names) for (const t of tools) console.log(`  ${t.name} ${t.method} ${t.path}`);
  total += tools.length;
}
console.log(`total ${total}`);

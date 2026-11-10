// Builds the catalog feed Executor's Add app page reads: one index of the packages listed in
// catalog/apps.json (in that order), each package's source files, and its icons as files. Serve the output directory from any static host
// and point EXECUTOR_CATALOG_URL at its index.json.
// Usage: bun scripts/feed.ts [--out <dir>]   (default .local/feed; Bun resolves the packages'
// "./icon.js" imports to their .ts files, which Node does not.)
//
// index.json: { version: 1, apps: [{ id, package, name, description, auth, category?,
//   icons: [{ src, mimeType?, theme? }], source }] }, with `src` and `source` relative to
//   index.json. apps/<id>.json: { package, files: [{ path, content }] }.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const out = outIndex === -1 ? join(root, ".local/feed") : args[outIndex + 1];
if (out === undefined) throw new Error("Usage: bun scripts/feed.ts [--out <dir>]");

interface Listing {
  readonly id: string;
  readonly category?: string;
}
interface Icon {
  readonly src: string;
  readonly mimeType?: string;
  readonly sizes?: readonly string[];
  readonly theme?: "light" | "dark";
}
interface Entry {
  readonly id: string;
  readonly package: string;
  readonly name: string;
  readonly description: string;
  readonly auth: readonly { readonly method: string; readonly kind: "secrets" | "oauth2"; readonly label?: string }[];
  readonly category?: string;
  readonly icons: readonly Icon[];
  readonly source: string;
}

const listings = JSON.parse(readFileSync(join(root, "catalog/apps.json"), "utf8")) as Listing[];

const files = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === ".DS_Store") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path, base) : [relative(base, path)];
  });

const extensions: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/** Data URIs become content-addressed files, so the index stays small and icons cache forever. */
const writeIcon = (icon: Icon): Icon => {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(icon.src);
  if (match === null) return icon;
  const [, mimeType, base64, data] = match as unknown as [string, string, string | undefined, string];
  const extension = extensions[mimeType];
  if (extension === undefined) throw new Error(`unsupported icon type ${mimeType}`);
  const bytes = base64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));
  const name = `icons/${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.${extension}`;
  writeFileSync(join(out, name), bytes);
  return { ...icon, src: name, mimeType };
};

/**
 * Auth methods as the package declares them, read from its evaluated `defineApp`: the providers of
 * its app accounts and its user accounts. A package that declares accounts but no methods fails,
 * so a change in that shape stops the feed instead of listing every app without sign-in.
 */
const auth = (app: unknown): Entry["auth"] => {
  type Requirements = Record<string, { provider?: { auth?: Record<string, { _tag?: string; label?: string }> } }>;
  const accounts = (app as { accounts?: { app?: Requirements; user?: Requirements } }).accounts ?? {};
  const requirements = [...Object.values(accounts.app ?? {}), ...Object.values(accounts.user ?? {})];
  const methods = new Map<string, Entry["auth"][number]>();
  for (const requirement of requirements)
    for (const [method, value] of Object.entries(requirement.provider?.auth ?? {})) {
      if (value._tag !== "secrets" && value._tag !== "oauth2") throw new Error(`unknown auth kind ${value._tag}`);
      if (!methods.has(method))
        methods.set(method, { method, kind: value._tag, ...(value.label ? { label: value.label } : {}) });
    }
  if (requirements.length > 0 && methods.size === 0) throw new Error("declares accounts with no auth methods");
  return [...methods.values()];
};

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "apps"), { recursive: true });
mkdirSync(join(out, "icons"), { recursive: true });

const entries: Entry[] = [];
const skipped: string[] = [];
for (const { id, category } of listings) {
  const dir = join(root, "packages", id);
  try {
    if (!existsSync(join(dir, "index.ts"))) throw new Error("no index.ts");
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      name?: string;
      description?: string;
      executor?: { title?: string };
    };
    if (manifest.name !== `@executor.sh/${id}`) throw new Error(`package.json name is ${manifest.name}`);
    const title = manifest.executor?.title;
    if (!title) throw new Error("package.json has no executor.title");
    const paths = files(dir).sort();
    const sources = paths.map((path) => {
      const bytes = readFileSync(join(dir, path));
      const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return { path, content };
    });
    const app = (await import(join(dir, "index.ts"))).default;
    const { icons } = (await import(join(dir, "icon.ts"))) as { icons: readonly Icon[] };
    const source = `apps/${id}.json`;
    writeFileSync(join(out, source), JSON.stringify({ package: manifest.name, files: sources }));
    entries.push({
      id,
      package: manifest.name,
      name: title,
      description: manifest.description ?? "",
      auth: auth(app),
      ...(category ? { category } : {}),
      icons: icons.map(writeIcon),
      source,
    });
  } catch (error) {
    skipped.push(`${id}: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
  }
}
writeFileSync(join(out, "index.json"), JSON.stringify({ version: 1, apps: entries }));
for (const line of skipped) console.error(`skipped ${line}`);
console.log(`${entries.length} apps written to ${out}${skipped.length > 0 ? `, ${skipped.length} skipped` : ""}`);
// A published feed must not silently drop finished packages.
// Every app connects with an account, so a feed where none has a sign-in method is broken.
const withAuth = entries.filter((entry) => entry.auth.length > 0).length;
if (withAuth === 0) console.error("no app has a sign-in method");
if (entries.length === 0 || skipped.length > 0 || withAuth === 0) process.exitCode = 1;

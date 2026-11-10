import { array, decodeJson, defineApp, json, object, query, router, string } from "apps";
import { icons } from "./icon.js";

const base = "https://api.osv.dev";

// The OSV API is public and read-only, so the app declares no account.
// The POST endpoints only search; they change nothing, so they are queries.
export default defineApp({ user: { accounts: {} }, icons }, async ({ fetch, signal }) => {
  const get = async (path: string) => decodeJson(await fetch(`${base}${path}`, { signal }), json());
  const post = async (path: string, body: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );

  const packageQuery = {
    name: string().optional(),
    ecosystem: string().optional(),
    purl: string().optional(),
    version: string().optional(),
    commit: string().optional(),
    pageToken: string().optional(),
  };
  type PackageQuery = {
    name?: string | undefined;
    ecosystem?: string | undefined;
    purl?: string | undefined;
    version?: string | undefined;
    commit?: string | undefined;
    pageToken?: string | undefined;
  };
  const toQuery = (input: PackageQuery) => {
    const hasPackage = input.purl !== undefined || input.name !== undefined || input.ecosystem !== undefined;
    if (input.commit === undefined && !hasPackage) throw new Error("Provide a commit, a purl, or a package name with ecosystem");
    if (input.commit !== undefined && input.version !== undefined) throw new Error("Provide either commit or version, not both");
    if (input.purl !== undefined && (input.name !== undefined || input.ecosystem !== undefined))
      throw new Error("A purl already identifies the package; do not also pass name or ecosystem");
    if (input.purl === undefined && hasPackage && (input.name === undefined || input.ecosystem === undefined))
      throw new Error("A package needs both name and ecosystem");
    return {
      ...(input.commit !== undefined ? { commit: input.commit } : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(hasPackage
        ? {
            package: input.purl !== undefined ? { purl: input.purl } : { name: input.name, ecosystem: input.ecosystem },
          }
        : {}),
      ...(input.pageToken !== undefined ? { page_token: input.pageToken } : {}),
    };
  };
  const queryHelp =
    " Identify the package with purl (e.g. pkg:npm/lodash@4.17.0, which may carry the version) or with name plus ecosystem (e.g. npm, PyPI, Maven, Go, crates.io, RubyGems, Debian:12). Add version, or alternatively a git commit hash (then the package is optional).";

  return {
    tools: router(
      {
        query: query(
          {
            description:
              "List the vulnerabilities affecting one package version or git commit. Returns {vulns: [...]}; results can be paged: when nextPageToken is returned, pass it back as pageToken." +
              queryHelp,
            input: object(packageQuery),
          },
          async (_ctx, input) => post("/v1/query", toQuery(input)),
        ),
        queryBatch: query(
          {
            description:
              "Query many package versions or commits at once (max 1000). Returns results in the same order, each with only vulnerability ids and modified times; fetch details with vulnerabilities.get. Each query takes the same fields as query:" +
              queryHelp,
            input: object({ queries: array(object(packageQuery)) }),
          },
          async (_ctx, { queries }) => {
            if (queries.length === 0) throw new Error("queries must not be empty");
            if (queries.length > 1000) throw new Error(`queryBatch accepts at most 1000 queries, got ${queries.length}`);
            return post("/v1/querybatch", { queries: queries.map(toQuery) });
          },
        ),
        vulnerabilities: router(
          {
            get: query(
              {
                description:
                  "Fetch the full OSV record for an ID such as GHSA-29mw-wpgm-hmr9, CVE-2021-23337, PYSEC-2021-1 or RUSTSEC-2020-0001: summary, details, aliases, severity, affected ranges, fixed versions and references.",
                input: object({ id: string() }),
              },
              async (_ctx, { id }) => {
                if (id.trim() === "") throw new Error("id is required");
                return get(`/v1/vulns/${encodeURIComponent(id.trim())}`);
              },
            ),
          },
          { title: "Vulnerabilities", description: "Read OSV vulnerability records by ID." },
        ),
        experimental: router(
          {
            ubuntuBinaryToSource: query(
              {
                description:
                  "Map Ubuntu binary package names to their source package names (experimental). ecosystem is the Ubuntu ecosystem, e.g. Ubuntu:22.04:LTS.",
                input: object({ binaryNames: array(string()), ecosystem: string() }),
              },
              async (_ctx, { binaryNames, ecosystem }) =>
                post("/v1experimental/ubuntu/binary-to-source", { binary_names: binaryNames, ecosystem }),
            ),
            importFindings: query(
              {
                description: "List import findings (records that failed to import or convert) for an OSV data source name (experimental).",
                input: object({ source: string() }),
              },
              async (_ctx, { source }) => {
                if (source.trim() === "") throw new Error("source is required");
                return get(`/v1experimental/importfindings/${encodeURIComponent(source.trim())}`);
              },
            ),
          },
          { title: "Experimental", description: "Experimental OSV endpoints; their behavior may change." },
        ),
      },
      {
        title: "OSV",
        description: "Look up known open source vulnerabilities by package version, commit or OSV ID in the public OSV database.",
        instructions:
          "Read-only public API, no account needed. Use query for one package version, queryBatch for many, then vulnerabilities.get for full records.",
        icons,
      },
    ),
  };
});

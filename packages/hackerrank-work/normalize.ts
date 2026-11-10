type Json = Record<string, unknown>;
const camel = (text: string) => text.replace(/[_-](\w)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase());
// The document has no operation ids, so tool names would come out as "getX"; derive readable ones from method and path.
const operationId = (method: string, path: string) =>
  method +
  path
    .replace("/x/api/v3/", "")
    .split("/")
    .map((segment) => (segment.startsWith("{") ? `By${camel(segment.slice(1, -1))}` : camel(segment)))
    .join("");

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

// HackerRank's Swagger document writes query strings into path keys ("/x/api/v3/users?limit={limit}&offset={offset}")
// and marks those parameters `in: path`. Strip the query part, turn undeclared path parameters into query
// parameters, and drop the documentation-only entries and the SCIM host.
export const normalize = (spec: Json): Json => {
  const paths: Json = {};
  const source = isObject(spec.paths) ? spec.paths : {};
  for (const [key, item] of Object.entries(source)) {
    if (!key.startsWith("/x/api/v3/") || !isObject(item)) continue;
    const path = key.split("?")[0] ?? key;
    // The ATS invite endpoints need an ATS integration token; HackerRank says not to use a personal API key for them.
    if (path === "/x/api/v3/ats/codescreen" || path === "/x/api/v3/ats/codepair") continue;
    if (/^\/x\/api\/v3\/\{resource_name\}/.test(path) || path === "/x/api/v3/resource_name") continue;
    const target = isObject(paths[path]) ? (paths[path] as Json) : {};
    for (const [method, operation] of Object.entries(item)) {
      if (method === "options" || !isObject(operation)) continue;
      const queryKeys = new Map<string, string>();
      for (const pair of (key.split("?")[1] ?? "").split("&")) {
        const [name, value = ""] = pair.split("=");
        if (name && !name.startsWith("{")) queryKeys.set(name, value);
      }
      // `{placeholder}` values name the declared parameter; the key before `=` is the wire name.
      const wireNames = new Map<string, string>();
      const literals = new Map<string, string>();
      for (const [name, value] of queryKeys) {
        const placeholder = /^\{(.+)\}$/.exec(value);
        if (placeholder?.[1]) wireNames.set(placeholder[1], name);
        else literals.set(name, value);
      }
      const declared = (Array.isArray(operation.parameters) ? operation.parameters : []).filter(isObject).map((parameter) => {
        if (parameter.in !== "path" || path.includes(`{${String(parameter.name)}}`)) return parameter;
        return { ...parameter, name: wireNames.get(String(parameter.name)) ?? parameter.name, in: "query", required: false };
      });
      const names = new Set(declared.map((parameter) => `${String(parameter.in)}:${String(parameter.name)}`));
      const added: Json[] = [];
      for (const [name, value] of queryKeys) {
        if (names.has(`query:${name}`)) continue;
        const literal = literals.has(name);
        added.push({ name, in: "query", type: "string", required: false, ...(literal ? { default: value } : {}) });
      }
      const parameters = [...declared, ...added];
      const existing = target[method];
      if (isObject(existing)) {
        const known = new Set((Array.isArray(existing.parameters) ? existing.parameters : []).filter(isObject).map((p) => `${String(p.in)}:${String(p.name)}`));
        existing.parameters = [
          ...(Array.isArray(existing.parameters) ? existing.parameters : []),
          ...parameters.filter((p) => !known.has(`${String(p.in)}:${String(p.name)}`)),
        ];
      } else {
        target[method] = { ...operation, operationId: operationId(method, path), parameters };
      }
    }
    if (Object.keys(target).length > 0) paths[path] = target;
  }
  return { ...spec, paths };
};

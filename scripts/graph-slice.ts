// Builds a per-product slice of Microsoft's Graph v1.0 OpenAPI document, offline.
//
// The whole Graph document (44 MB of YAML, ~11,500 paths, ~5,200 schemas) is far too large for
// hosted Executor, and even a path-filtered document is too heavy: Graph's entity types link to one
// another through navigation properties (team -> channels -> messages -> ... -> user -> everything),
// so every tool's schema reaches most of the document and the tool listing, which inlines each
// tool's reachable definitions, grows to hundreds of MB. A slice therefore:
//
// 1. keeps only the product's paths (PRODUCTS below);
// 2. bounds schema depth: inside any component schema, a reference to an entity type (a schema
//    derived from microsoft.graph.entity, i.e. something with its own id and its own endpoint) is
//    replaced by a small inline object schema carrying `id` and `additionalProperties: true`.
//    Operations still get the full schema of the entity they read or write, and collection
//    responses still list full entities; only navigation properties one level down are stubbed.
//    Base types reached through `allOf` (inheritance) are kept;
// 3. drops `discriminator` (its mapping names every subtype in Graph) and the `examples` section;
// 4. prunes components to the transitive closure of what the kept paths reference;
// 5. shortens operationIds that repeat path-parameter segments, so tool names stay under 100 characters.
//
// Usage:
//   curl -sSfL -o /tmp/graph/openapi.yaml \
//     https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/<commit>/openapi/v1.0/openapi.yaml
//   npx --yes js-yaml@4.1.0 /tmp/graph/openapi.yaml > /tmp/graph/openapi.json
//   node scripts/graph-slice.ts /tmp/graph/openapi.json <product> <commit> > packages/<package>/<file>.json
//
// Products: teams (packages/microsoft-teams/openapi.json), excel (packages/excel/graph-excel.json).

import { readFileSync } from "node:fs";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (value: Json | undefined): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const segments = (path: string) => path.split("/").filter(Boolean);

const PRODUCTS: Record<string, { title: string; keep: (path: string) => boolean }> = {
  // Teams, channels, messages, chats, the signed-in user's meetings and presence, Teams apps and
  // activity notifications. Duplicate addressings of the same resources are left out:
  // /me/joinedTeams/{team-id}/..., /groups/{group-id}/team/..., /users/{user-id}/... and /me/chats/...
  // repeat /teams and /chats. Tenant administration (/teamwork/deletedTeams, deletedChats,
  // workforceIntegrations, teamsAppSettings) and the app-only /communications/onlineMeetings are
  // left out too.
  teams: {
    title: "Microsoft Teams",
    keep: (path) => {
      const [first, second] = segments(path);
      if (first === "teams" || first === "chats" || first === "teamsTemplates") return true;
      if (first === "appCatalogs") return second === "teamsApps";
      if (first === "me")
        return (
          path === "/me/joinedTeams" ||
          path === "/me/joinedTeams/$count" ||
          second === "onlineMeetings" ||
          second === "presence" ||
          second === "teamwork"
        );
      if (first === "communications")
        return second === "presences" || (second?.startsWith("getPresencesByUserId") ?? false);
      if (first === "teamwork") return path === "/teamwork" || second === "sendActivityNotificationToRecipients";
      return false;
    },
  },
  // Workbook paths of a drive item, up to five segments below `workbook`, without the 367
  // worksheet-function calculators (workbook/functions/*), `$ref` link operations and the
  // tableRowOperationResult/sessionInfoResource helpers; plus the drive lookups needed to find a
  // workbook (my drive, a drive, an item, its children, search and recent files).
  excel: {
    title: "Excel",
    keep: (path) => {
      if (
        path === "/me/drive" ||
        path === "/drives/{drive-id}" ||
        path === "/drives/{drive-id}/items/{driveItem-id}" ||
        path === "/drives/{drive-id}/items/{driveItem-id}/children" ||
        path === "/drives/{drive-id}/search(q='{q}')" ||
        path === "/drives/{drive-id}/recent()"
      )
        return true;
      const prefix = "/drives/{drive-id}/items/{driveItem-id}/workbook";
      if (path !== prefix && !path.startsWith(`${prefix}/`)) return false;
      const below = segments(path.slice(prefix.length));
      if (below.length > 5) return false;
      if (below[0] === "functions") return false;
      if (below.at(-1) === "$ref") return false;
      return !/tableRowOperationResult|sessionInfoResource/.test(path);
    },
  },
};

const [input, product, commit] = process.argv.slice(2);
const config = product ? PRODUCTS[product] : undefined;
if (!input || !config || !commit) {
  console.error(`Usage: node scripts/graph-slice.ts <graph-openapi.json> <${Object.keys(PRODUCTS).join("|")}> <msgraph-metadata commit>`);
  process.exit(2);
}

const document = JSON.parse(readFileSync(input, "utf8")) as JsonObject;
const paths = document.paths as JsonObject;
const components = document.components as JsonObject;
const schemas = components.schemas as JsonObject;
const schemaPrefix = "#/components/schemas/";

// Entity types: microsoft.graph.entity and everything that inherits from it through allOf.
const entityTypes = new Set<string>(["microsoft.graph.entity"]);
for (let changed = true; changed; ) {
  changed = false;
  for (const [name, schema] of Object.entries(schemas)) {
    if (entityTypes.has(name) || !isObject(schema) || !Array.isArray(schema.allOf)) continue;
    for (const part of schema.allOf) {
      const ref = isObject(part) && typeof part.$ref === "string" ? part.$ref.slice(schemaPrefix.length) : undefined;
      if (ref && entityTypes.has(ref)) {
        entityTypes.add(name);
        changed = true;
        break;
      }
    }
  }
}

const entityOf = (value: JsonObject) => {
  if (typeof value.$ref !== "string" || !value.$ref.startsWith(schemaPrefix)) return undefined;
  const name = value.$ref.slice(schemaPrefix.length);
  return entityTypes.has(name) ? name : undefined;
};

const stub = (name: string): JsonObject => ({
  type: "object",
  description: `A ${name.replace(/^microsoft\.graph\./, "")} (not expanded here; read it with its own tool or $expand).`,
  properties: { id: { type: "string" } },
  additionalProperties: true,
});

// Replaces entity references anywhere inside a property's schema with stubs.
const stubEntities = (value: Json): Json => {
  if (Array.isArray(value)) return value.map(stubEntities);
  if (!isObject(value)) return value;
  const entity = entityOf(value);
  if (entity) return stub(entity);
  const out: JsonObject = {};
  for (const [key, child] of Object.entries(value)) if (key !== "discriminator") out[key] = stubEntities(child);
  return out;
};

const withoutDiscriminator = (value: JsonObject): JsonObject => {
  const { discriminator: _discriminator, ...rest } = value;
  return rest;
};

// Bounds one component schema: keeps allOf base-type references, stubs entity references in
// properties. Collection responses keep their `value` items so list tools return full entities.
const bound = (name: string, schema: Json): Json => {
  if (!isObject(schema)) return schema;
  if (name.endsWith("CollectionResponse")) return withoutDiscriminator(schema);
  const own = (part: JsonObject): JsonObject => {
    const out = withoutDiscriminator(part);
    if (isObject(out.properties)) {
      const properties: JsonObject = {};
      for (const [key, property] of Object.entries(out.properties)) properties[key] = stubEntities(property);
      out.properties = properties;
    }
    if (out.items !== undefined) out.items = stubEntities(out.items);
    if (isObject(out.additionalProperties)) out.additionalProperties = stubEntities(out.additionalProperties);
    return out;
  };
  const top = own(schema);
  if (Array.isArray(top.allOf))
    top.allOf = top.allOf.map((part) => (isObject(part) && typeof part.$ref === "string" ? part : isObject(part) ? own(part) : part));
  return top;
};

const methods = ["get", "put", "post", "patch", "delete"];
const keptPaths: JsonObject = {};
for (const [path, item] of Object.entries(paths)) if (config.keep(path)) keptPaths[path] = structuredClone(item);

// Graph's operationIds for actions and functions repeat every key segment of the path
// (drives.drive.items.driveItem.workbook.worksheets.workbookWorksheet.pivotTables.workbookPivotTable.refresh),
// which makes tool names longer than hosted Executor's 100-character tool name limit. Drop the
// segments that name a path parameter ({workbookWorksheet-id} -> workbookWorksheet), unless the
// shorter id would collide with another operation's.
const shortened = new Map<JsonObject, string>();
for (const [path, item] of Object.entries(keptPaths)) {
  if (!isObject(item)) continue;
  const parameters = new Set([...path.matchAll(/\{([^}]+)-id\}/g)].map((match) => match[1]));
  for (const method of methods) {
    const operation = item[method];
    if (!isObject(operation) || typeof operation.operationId !== "string") continue;
    const parts = operation.operationId.split(".");
    shortened.set(operation, parts.filter((part, index) => index === parts.length - 1 || !parameters.has(part)).join("."));
  }
}
const operationIds = new Map<string, number>();
const allIds = new Set<string>();
for (const [operation, id] of shortened) {
  operationIds.set(id, (operationIds.get(id) ?? 0) + 1);
  allIds.add(operation.operationId as string);
}
for (const [operation, id] of shortened)
  if (operationIds.get(id) === 1 && (id === operation.operationId || !allIds.has(id))) operation.operationId = id;

// Transitive closure over #/components/<section>/<name> references, bounding schemas on the way.
const out: Record<string, JsonObject> = {};
const queue: [string, string][] = [];
const seen = new Set<string>();
const collect = (value: Json) => {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!isObject(value)) return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/")) {
    const [section, ...rest] = value.$ref.slice("#/components/".length).split("/");
    const name = rest.join("/").replace(/~1/g, "/").replace(/~0/g, "~");
    const key = `${section}/${name}`;
    if (section && !seen.has(key)) {
      seen.add(key);
      queue.push([section, name]);
    }
  }
  for (const child of Object.values(value)) collect(child);
};
collect(keptPaths);
while (queue.length > 0) {
  const [section, name] = queue.shift()!;
  const source = components[section];
  if (!isObject(source) || source[name] === undefined) {
    throw new Error(`Dangling reference #/components/${section}/${name}`);
  }
  const value = section === "schemas" ? bound(name, source[name]) : source[name];
  (out[section] ??= {})[name] = value;
  collect(value);
}

let operations = 0;
for (const item of Object.values(keptPaths))
  if (isObject(item)) for (const method of methods) if (item[method]) operations++;

const info = isObject(document.info) ? document.info : {};
const slice: JsonObject = {
  openapi: document.openapi ?? "3.0.4",
  info: {
    ...info,
    title: `${info.title ?? "Microsoft Graph"} (${config.title} slice)`,
    "x-executor-slice": {
      product: product!,
      source: `https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/${commit}/openapi/v1.0/openapi.yaml`,
      generator: "scripts/graph-slice.ts",
      paths: Object.keys(keptPaths).length,
      operations,
      schemas: Object.keys(out.schemas ?? {}).length,
    },
  },
  ...(document.servers ? { servers: document.servers } : {}),
  paths: keptPaths,
  components: out,
};
process.stdout.write(`${JSON.stringify(slice)}\n`);
console.error(
  `${product}: ${Object.keys(keptPaths).length} paths, ${operations} operations, ${Object.keys(out.schemas ?? {}).length} schemas, ${entityTypes.size} entity types in Graph`,
);

// PredictLeads keeps error bodies and shared sub-schemas under non-standard component keys
// (x-errorSchemas, x-subSchemas). The framework resolves only #/components/schemas/<name>, so
// move them there under prefixed names and rewrite every reference.
const moved = [
  ["x-errorSchemas", "Error_"],
  ["x-subSchemas", "Sub_"],
] as const;

export function normalize(document: Record<string, unknown>): Record<string, unknown> {
  const components = (document.components ?? {}) as Record<string, Record<string, unknown>>;
  const schemas: Record<string, unknown> = { ...components.schemas };
  for (const [key, prefix] of moved) {
    for (const [name, schema] of Object.entries(components[key] ?? {})) schemas[`${prefix}${name}`] = schema;
  }
  let text = JSON.stringify({ ...document, components: { ...components, schemas } });
  for (const [key, prefix] of moved) text = text.split(`#/components/${key}/`).join(`#/components/schemas/${prefix}`);
  return JSON.parse(text);
}

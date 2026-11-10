// BigML puts the live credentials into the `next` and `previous` pagination links of list
// responses. Strip them from the raw string, splitting on both '&' and ';' (BigML's docs use
// ';' as the separator), so a list response never hands the API key to the model.
const credentials = /(^|[&;?])(?:username|api_key)=[^&;]*/gi;

export function redactLink(link: string): string {
  let cleaned = link;
  // Repeat until stable so adjacent credential segments cannot shield each other.
  for (let previous = ""; previous !== cleaned; ) {
    previous = cleaned;
    cleaned = cleaned.replace(credentials, (_match, lead: string) => (lead === "?" ? "?" : lead));
  }
  // A removed first parameter leaves "?&x" or "?;x"; normalise and drop a dangling "?".
  return cleaned.replace(/\?[&;]+/, "?").replace(/[?&;]+$/, "");
}

export function redactMeta(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const meta = (value as { meta?: unknown }).meta;
  if (meta === null || typeof meta !== "object") return value;
  const clean = (link: unknown) => (typeof link === "string" ? redactLink(link) : link);
  const m = meta as Record<string, unknown>;
  return { ...value, meta: { ...m, next: clean(m.next), previous: clean(m.previous) } };
}

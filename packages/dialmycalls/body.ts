// Tool inputs are camelCase; the DialMyCalls API v2 takes snake_case JSON bodies only.
export function snake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// Drops undefined values and renames top-level keys to snake_case. Nested values
// (contacts, messages, call_options) already use the API's names and pass through.
export function body(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) if (value !== undefined) out[snake(key)] = value;
  return out;
}

export const basicAuth = (apiKey: string): string => `Basic ${btoa(`${apiKey}:`)}`;

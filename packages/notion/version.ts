export const notionVersion = "2025-09-03";

const origin = "https://api.notion.com";

type Fetch = typeof globalThis.fetch;

// The OpenAPI document declares Notion-Version only on two operations, so the header is set here for
// every request to the Notion API. Other origins (the spec download) are left untouched.
export const withNotionVersion =
  (base: Fetch): Fetch =>
  (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (new URL(url).origin !== origin) return base(input, init);
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.set("Notion-Version", notionVersion);
    return base(input, { ...init, headers });
  };

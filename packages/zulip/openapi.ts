import type { OpenapiToolNamesOptions } from "apps/openapi";

// Zulip Cloud organizations live at <name>.zulipchat.com, so every account has its own origin.
// Self-hosted domains are unsupported: the provider's `hosts` allow-list is *.zulipchat.com. The official document lists several servers; baseUrl pins the account's.
export const siteUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
  } catch {
    throw new Error("Enter your Zulip organization URL, for example https://acme.zulipchat.com.");
  }
  if (parsed.protocol !== "https:")
    throw new Error("The Zulip URL must use https:// so the API key is not sent in plaintext.");
  if (!parsed.hostname.endsWith(".zulipchat.com"))
    throw new Error("Only Zulip Cloud organizations (https://<name>.zulipchat.com) are supported.");
  if (parsed.search !== "" || parsed.hash !== "" || parsed.username !== "" || parsed.password !== "")
    throw new Error("Enter only the Zulip base URL, without credentials, query or fragment.");
  return parsed.origin;
};

export const zulipOptions = (url: string) =>
  ({
    source: { url: "https://raw.githubusercontent.com/zulip/zulip/933353fbc32f32ca589ee5f0520433637084083b/zerver/openapi/zulip.yaml" },
    allowedOrigin: siteUrl(url),
    baseUrl: `${siteUrl(url)}/api/v1`,
    securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
    methods: {
      apiKey: [
        { scheme: "basicAuth", field: "email", part: "username", prefix: "" },
        { scheme: "basicAuth", field: "apiKey", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = zulipOptions("https://example.zulipchat.com");

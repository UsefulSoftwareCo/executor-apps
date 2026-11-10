import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every Zendesk account lives on its own host: https://<subdomain>.zendesk.com.
export const siteUrl = (subdomain: string) => {
  // Zendesk subdomains are 3-63 characters of letters, digits and hyphens (no underscores), per
  // "Renaming your subdomain". Anything else, including a host that merely starts with
  // "<name>.zendesk.com", is rejected rather than normalized.
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{1,61}[a-z0-9])(?:\.zendesk\.com)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.zendesk.com (3-63 letters, digits, hyphens).");
  return `https://${match[1]}.zendesk.com`;
};

// The definitions declare basic auth, but the token username is "<email>/token", which the account
// builds itself, so security is cleared and the provider's request template sends the header.
const shared = (subdomain: string) => ({
  allowedOrigin: siteUrl(subdomain),
  baseUrl: siteUrl(subdomain),
  securitySchemes: {},
  methods: {},
  oauth: [],
  patches: [{ op: "add" as const, path: "/security", value: [] }],
});

export const supportOptions = (subdomain: string) =>
  ({
    source: { url: "https://developer.zendesk.com/zendesk/oas.yaml" },
    ...shared(subdomain),
  }) satisfies OpenapiToolNamesOptions;

export const helpCenterOptions = (subdomain: string) =>
  ({
    source: { url: "https://developer.zendesk.com/help_center/oas.yaml" },
    ...shared(subdomain),
  }) satisfies OpenapiToolNamesOptions;

export const options = supportOptions("example");

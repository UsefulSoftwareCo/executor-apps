// From the Flightdeck public API specification: https://inflight.dope.security/dope.apis/public-api-specification
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  /** Path parameters, in order. */
  params?: string[];
  /** Accepts a JSON request body. */
  body?: boolean;
};

const policy = "policy_name";
const category = "custom_category_name";

export const operations: Operation[] = [
  { group: "endpoints", name: "searchEndpoints", method: "GET", path: "/endpoints/search", description: "List endpoints (devices running the dope agent), or search them. Pass at most one filter in query: id, emailId, deviceName, userId, osVersion, agentVersion, status (comma-separated healthy|error|dormant|disabled), debugState (comma-separated 0|1|2), fallbackMode (true|false) or locationId (City_Country). Also first, after (cursor from pageInfo.endCursor) and order (asc|desc by lastSeen)." },

  { group: "policies", name: "listPolicies", method: "GET", path: "/policies", description: "List policies ordered by name with their update time, effective SSL inspection state and clashCount. Query: first, after, order (asc|desc)." },
  { group: "policies", name: "createPolicy", method: "POST", path: "/policies/{policy_name}", params: [policy], description: "Create an empty policy. Names are 1-32 characters with no leading or trailing whitespace and none of # ! @ $ % ^ * ? . / \\." },
  { group: "policies", name: "deletePolicy", method: "DELETE", path: "/policies/{policy_name}", params: [policy], description: "Delete a custom policy and unassign its users and groups. The Base Policy cannot be deleted." },
  { group: "policies", name: "getPolicyContent", method: "GET", path: "/policies/{policy_name}/content", params: [policy], description: "Get a policy's category and custom category restrictions (ALLOW, BLOCK, WARNING) and per-user/group exceptions." },
  { group: "policies", name: "updatePolicyRestrictions", method: "PUT", path: "/policies/{policy_name}/content/restrictions", params: [policy], body: true, description: "Update category restrictions. Body: { data: { categories?, customCategories? } }, each either { <name>: { restriction: ALLOW|BLOCK|WARNING (IGNORE too for custom categories), page? } } or { inheritsFromBase: true } to reset that block. Only the categories sent change." },
  { group: "policies", name: "updatePolicyExceptions", method: "PUT", path: "/policies/{policy_name}/content/exceptions", params: [policy], body: true, description: "Replace exceptions per category. Body: { data: { categories?, customCategories? } } where each is { <categoryName>: { <userOrGroupId>: { restriction, page? } } }. A category sent replaces its exceptions; {} clears them; unsent categories are unchanged." },
  { group: "policies", name: "getPolicyAssignments", method: "GET", path: "/policies/{policy_name}/assignments", params: [policy], description: "List the users and groups assigned to a policy." },
  { group: "policies", name: "updatePolicyAssignments", method: "PUT", path: "/policies/{policy_name}/assignments", params: [policy], body: true, description: "Replace assignments. Body: { users?: string[] (emails), groups?: string[] (emails) }. A field sent replaces that whole list; omitted fields are kept. Entries must not already be assigned to another policy." },
  { group: "policies", name: "getUrlBypass", method: "GET", path: "/policies/{policy_name}/bypass/urls", params: [policy], description: "Get a policy's URL bypass entries (custom and default)." },
  { group: "policies", name: "upsertUrlBypass", method: "PUT", path: "/policies/{policy_name}/bypass/urls", params: [policy], body: true, description: "Upsert URL bypass entries. Body: { data: { custom?: [{ name, note? }], default?: [{ name, state: applied|ignored }] } } or { data: { inheritsFromBase: true } } to drop custom entries. Sending entries to a policy that inherits from Base detaches it, so include any Base entries to keep." },
  { group: "policies", name: "deleteUrlBypass", method: "DELETE", path: "/policies/{policy_name}/bypass/urls", params: [policy], body: true, description: "Delete custom URL bypass entries. Body: { data: { custom: { urls: string[] } } }. Not allowed when the policy inherits URL bypass from Base." },
  { group: "policies", name: "getApplicationBypass", method: "GET", path: "/policies/{policy_name}/bypass/applications", params: [policy], description: "Get a policy's application bypass entries, split by platform (mac, windows)." },
  { group: "policies", name: "upsertApplicationBypass", method: "PUT", path: "/policies/{policy_name}/bypass/applications", params: [policy], body: true, description: "Upsert application bypass entries. Body: { data: { custom?: { mac?: [], windows?: [] }, default?: { mac?: [], windows?: [] } } } or { data: { inheritsFromBase: true } }. Sending entries to a policy that inherits from Base detaches it." },
  { group: "policies", name: "deleteApplicationBypass", method: "DELETE", path: "/policies/{policy_name}/bypass/applications", params: [policy], body: true, description: "Delete custom application bypass entries. Body: { data: { custom: { mac?: [], windows?: [] } } } with at least one platform. Not allowed when the policy inherits from Base." },
  { group: "policies", name: "getSslInspection", method: "GET", path: "/policies/{policy_name}/ssl-inspection", params: [policy], description: "Get a policy's SSL inspection state and whether it inherits from Base." },
  { group: "policies", name: "updateSslInspection", method: "PUT", path: "/policies/{policy_name}/ssl-inspection", params: [policy], body: true, description: "Set SSL inspection. Body: { data: { sslInspection: { state: enabled|disabled } } } or { data: { sslInspection: { inheritsFromBase: true } } } (not allowed on the Base Policy)." },

  { group: "customCategories", name: "listCustomCategories", method: "GET", path: "/custom_categories", description: "List custom URL category names. Query: first, after." },
  { group: "customCategories", name: "createCustomCategory", method: "POST", path: "/custom_categories/{custom_category_name}", params: [category], description: "Create a custom URL category. Same naming rules as policies." },
  { group: "customCategories", name: "deleteCustomCategory", method: "DELETE", path: "/custom_categories/{custom_category_name}", params: [category], description: "Delete a custom category and all its data." },
  { group: "customCategories", name: "listCustomCategoryUrls", method: "GET", path: "/custom_categories/{custom_category_name}/urls", params: [category], description: "List the URLs in a custom category." },
  { group: "customCategories", name: "addCustomCategoryUrls", method: "POST", path: "/custom_categories/{custom_category_name}/urls", params: [category], body: true, description: "Add URLs to a custom category. Body: { data: { urls: string[] } }. If any URL is invalid the whole request fails." },
  { group: "customCategories", name: "replaceCustomCategoryUrls", method: "PUT", path: "/custom_categories/{custom_category_name}/urls", params: [category], body: true, description: "Replace all URLs in a custom category. Body: { data: { urls: string[] } }." },
  { group: "customCategories", name: "clearCustomCategoryUrls", method: "DELETE", path: "/custom_categories/{custom_category_name}/urls", params: [category], description: "Remove all URLs from a custom category." },
  { group: "customCategories", name: "removeCustomCategoryUrl", method: "DELETE", path: "/custom_categories/{custom_category_name}/url/{encoded_url}", params: [category, "encoded_url"], description: "Remove one URL from a custom category. Pass the raw URL as encoded_url; it is URL-encoded for you." },
];

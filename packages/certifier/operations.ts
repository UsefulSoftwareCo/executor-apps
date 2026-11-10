export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

// Certifier REST API v1 (https://developers.certifier.io). Credential templates are still
// served under /groups and design templates under /designs, matching the vendor's rename notice.
export const operations: Operation[] = [
  { group: "credentials", name: "list", method: "GET", path: "/credentials", description: "List credentials. Cursor-paginated: pass limit (max 100) and cursor in query." },
  { group: "credentials", name: "get", method: "GET", path: "/credentials/{id}", description: "Get a credential by id." },
  { group: "credentials", name: "search", method: "POST", path: "/credentials/search", description: "Search credentials. Body: filter (AND/OR/NOT of field conditions), sort {property, order}, limit, cursor." },
  { group: "credentials", name: "create", method: "POST", path: "/credentials", description: "Create a credential. It starts as draft until issued." },
  { group: "credentials", name: "createIssueSend", method: "POST", path: "/credentials/create-issue-send", description: "Create, issue and send a credential in one call. Body: groupId, recipient, and optional issueDate, expiryDate, attributes." },
  { group: "credentials", name: "issue", method: "POST", path: "/credentials/{id}/issue", description: "Issue a draft credential." },
  { group: "credentials", name: "send", method: "POST", path: "/credentials/{id}/send", description: "Send an issued credential. Body: deliveryMethod." },
  { group: "credentials", name: "update", method: "PATCH", path: "/credentials/{id}", description: "Partially update a credential." },
  { group: "credentials", name: "delete", method: "DELETE", path: "/credentials/{id}", description: "Permanently delete a credential." },
  { group: "credentialInteractions", name: "list", method: "GET", path: "/credential-interactions", description: "List credential interactions. Optionally filter by credential id in query." },
  { group: "credentialInteractions", name: "create", method: "POST", path: "/credential-interactions", description: "Create a credential interaction." },
  { group: "credentialTemplates", name: "list", method: "GET", path: "/groups", description: "List credential templates (formerly groups)." },
  { group: "credentialTemplates", name: "get", method: "GET", path: "/groups/{id}", description: "Get a credential template by id." },
  { group: "credentialTemplates", name: "create", method: "POST", path: "/groups", description: "Create a credential template." },
  { group: "credentialTemplates", name: "update", method: "PATCH", path: "/groups/{id}", description: "Partially update a credential template." },
  { group: "credentialTemplates", name: "delete", method: "DELETE", path: "/groups/{id}", description: "Permanently delete a credential template." },
  { group: "designTemplates", name: "list", method: "GET", path: "/designs", description: "List certificate and badge design templates." },
  { group: "designTemplates", name: "get", method: "GET", path: "/designs/{id}", description: "Get a design template by id." },
  { group: "emailTemplates", name: "list", method: "GET", path: "/email-templates", description: "List email templates." },
  { group: "attributes", name: "list", method: "GET", path: "/attributes", description: "List custom attributes." },
];
